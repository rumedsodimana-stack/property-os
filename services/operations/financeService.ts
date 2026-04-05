import { LedgerEntry, GLAccount } from '../../types';
import { addItem, fetchItems, updateItem, fetchItem, getCollectionRef } from '../kernel/firestoreService';
import { internalAuthService } from '../kernel/internalAuthService';
import { db } from '../kernel/firebase';
import { query, where, getDocs, orderBy } from 'firebase/firestore';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PeriodCloseResult {
    period: string;             // e.g. "2026-03"
    status: 'closed' | 'failed';
    trialBalance: TrialBalanceSummary;
    closedAt: string;
    closedBy: string;
    error?: string;
}

export interface TrialBalanceSummary {
    totalDebits: number;
    totalCredits: number;
    netBalance: number;
    isBalanced: boolean;
    accountBreakdown: { accountId: string; accountCode: string; debits: number; credits: number; net: number }[];
}

export interface BudgetVsActual {
    accountId: string;
    accountCode: string;
    accountName: string;
    period: string;
    budgetAmount: number;
    actualAmount: number;
    variance: number;
    variancePercent: number;
}

export interface TaxCalculation {
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    totalWithTax: number;
    breakdown: { taxName: string; rate: number; amount: number }[];
}

export interface RevenueRecognitionEntry {
    id: string;
    reservationId: string;
    revenueType: 'room' | 'fb' | 'spa' | 'other';
    totalAmount: number;
    recognizedAmount: number;
    deferredAmount: number;
    recognitionDate: string;
    businessDate: string;
    status: 'deferred' | 'partial' | 'fully_recognized';
}

export interface AgingBucket {
    label: string;
    minDays: number;
    maxDays: number | null;
    count: number;
    totalAmount: number;
    entries: { accountId: string; description: string; amount: number; ageDays: number; dueDate: string }[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const now = () => new Date().toISOString();
const todayBusinessDate = () => new Date().toISOString().split('T')[0];

const generateId = (prefix: string): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return `${prefix}_${crypto.randomUUID().replace(/-/g, '').substring(0, 12)}`;
    }
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

const getCurrentUserId = (): string => {
    const session = internalAuthService.getSession();
    return session?.userId || 'system_automated';
};

// ─── Service ────────────────────────────────────────────────────────────────

export const financeService = {

    // ═══════════════════════════════════════════════════════════════════════
    // GL POSTING WITH DOUBLE-ENTRY VALIDATION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Posts a balanced journal entry to the Master Ledger.
     * Throws an error if Debits and Credits do not match.
     */
    async postTransaction(
        entries: Omit<LedgerEntry, 'id' | 'date' | 'userId'>[],
        transactionId?: string
    ): Promise<string> {
        const userId = getCurrentUserId();
        const tId = transactionId || `tx_${Date.now()}`;
        const timestamp = Date.now();

        // 1. Validate double-entry balance
        let totalDebit = 0;
        let totalCredit = 0;

        for (const entry of entries) {
            totalDebit += entry.debit || 0;
            totalCredit += entry.credit || 0;
        }

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            throw new Error(`Transaction Out of Balance: Debits (${totalDebit.toFixed(2)}) != Credits (${totalCredit.toFixed(2)})`);
        }

        // 2. Validate no entry has both debit and credit > 0
        for (const entry of entries) {
            if ((entry.debit || 0) > 0 && (entry.credit || 0) > 0) {
                throw new Error(`Invalid entry: account ${entry.accountCode} has both debit and credit. Use separate lines.`);
            }
        }

        // 3. Check period is not closed
        const businessDate = entries[0]?.businessDate;
        if (businessDate) {
            const period = businessDate.substring(0, 7); // YYYY-MM
            const isClosed = await this.isPeriodClosed(period);
            if (isClosed) {
                throw new Error(`Cannot post to closed period: ${period}`);
            }
        }

        // 4. Write each line item to the Ledger collection
        const writtenIds: string[] = [];

        for (const entry of entries) {
            const fullEntry: LedgerEntry = {
                id: generateId('le'),
                ...entry,
                date: timestamp,
                userId,
                transactionId: tId,
            };

            await addItem('ledgerEntries', fullEntry);
            writtenIds.push(fullEntry.id);
        }

        console.log(`[Finance] Posted transaction ${tId}: ${entries.length} entries, ${totalDebit.toFixed(2)} DR / ${totalCredit.toFixed(2)} CR`);
        return tId;
    },

    /**
     * Helper: Quickly post a simple two-line entry (One Debit, One Credit)
     */
    async postSimpleEntry(params: {
        debitAccount: Pick<GLAccount, 'id' | 'code'>;
        creditAccount: Pick<GLAccount, 'id' | 'code'>;
        amount: number;
        businessDate: string;
        description: string;
        moduleSource: LedgerEntry['moduleSource'];
        departmentId?: string;
        outletId?: string;
        reservationId?: string;
        posOrderId?: string;
    }): Promise<string> {
        if (params.amount <= 0) {
            throw new Error('[Finance] Amount must be positive');
        }

        const debits = {
            accountId: params.debitAccount.id,
            accountCode: params.debitAccount.code,
            debit: params.amount,
            credit: 0,
            businessDate: params.businessDate,
            description: params.description,
            moduleSource: params.moduleSource,
            departmentId: params.departmentId,
            outletId: params.outletId,
            reservationId: params.reservationId,
            posOrderId: params.posOrderId,
        };

        const credits = {
            accountId: params.creditAccount.id,
            accountCode: params.creditAccount.code,
            debit: 0,
            credit: params.amount,
            businessDate: params.businessDate,
            description: params.description,
            moduleSource: params.moduleSource,
            departmentId: params.departmentId,
            outletId: params.outletId,
            reservationId: params.reservationId,
            posOrderId: params.posOrderId,
        };

        return this.postTransaction([debits, credits]);
    },

    // ═══════════════════════════════════════════════════════════════════════
    // TRIAL BALANCE & PERIOD CLOSE
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Generate a trial balance for a given period (YYYY-MM).
     * Aggregates all ledger entries in that period by account.
     */
    async generateTrialBalance(period: string): Promise<TrialBalanceSummary> {
        const allEntries = await fetchItems<LedgerEntry>('ledgerEntries');
        const periodEntries = allEntries.filter(e => e.businessDate && e.businessDate.startsWith(period));

        const accountMap = new Map<string, { accountCode: string; debits: number; credits: number }>();

        for (const entry of periodEntries) {
            const key = entry.accountId;
            const existing = accountMap.get(key) || { accountCode: entry.accountCode, debits: 0, credits: 0 };
            existing.debits += entry.debit || 0;
            existing.credits += entry.credit || 0;
            accountMap.set(key, existing);
        }

        let totalDebits = 0;
        let totalCredits = 0;
        const accountBreakdown: TrialBalanceSummary['accountBreakdown'] = [];

        for (const [accountId, data] of accountMap) {
            totalDebits += data.debits;
            totalCredits += data.credits;
            accountBreakdown.push({
                accountId,
                accountCode: data.accountCode,
                debits: parseFloat(data.debits.toFixed(2)),
                credits: parseFloat(data.credits.toFixed(2)),
                net: parseFloat((data.debits - data.credits).toFixed(2)),
            });
        }

        const netBalance = totalDebits - totalCredits;

        return {
            totalDebits: parseFloat(totalDebits.toFixed(2)),
            totalCredits: parseFloat(totalCredits.toFixed(2)),
            netBalance: parseFloat(netBalance.toFixed(2)),
            isBalanced: Math.abs(netBalance) < 0.01,
            accountBreakdown: accountBreakdown.sort((a, b) => a.accountCode.localeCompare(b.accountCode)),
        };
    },

    /**
     * Close an accounting period. Validates trial balance is balanced first.
     */
    async closePeriod(period: string): Promise<PeriodCloseResult> {
        const userId = getCurrentUserId();

        try {
            const trialBalance = await this.generateTrialBalance(period);

            if (!trialBalance.isBalanced) {
                const result: PeriodCloseResult = {
                    period,
                    status: 'failed',
                    trialBalance,
                    closedAt: now(),
                    closedBy: userId,
                    error: `Trial balance not balanced. Net variance: ${trialBalance.netBalance.toFixed(2)}`,
                };
                await addItem('period_closes', result);
                return result;
            }

            const result: PeriodCloseResult = {
                period,
                status: 'closed',
                trialBalance,
                closedAt: now(),
                closedBy: userId,
            };

            await addItem('period_closes', { id: `pc_${period}`, ...result });
            console.log(`[Finance] Period ${period} closed successfully by ${userId}`);
            return result;
        } catch (error: any) {
            const result: PeriodCloseResult = {
                period,
                status: 'failed',
                trialBalance: { totalDebits: 0, totalCredits: 0, netBalance: 0, isBalanced: false, accountBreakdown: [] },
                closedAt: now(),
                closedBy: userId,
                error: error.message,
            };
            await addItem('period_closes', result);
            throw error;
        }
    },

    /**
     * Check whether a period is already closed.
     */
    async isPeriodClosed(period: string): Promise<boolean> {
        const record = await fetchItem<any>('period_closes', `pc_${period}`);
        return record?.status === 'closed';
    },

    // ═══════════════════════════════════════════════════════════════════════
    // BUDGET VS ACTUAL
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Compare budgeted amounts against actual ledger postings for a period.
     * Budget records are stored in Firestore collection 'budgets'.
     */
    async getBudgetVsActual(period: string): Promise<BudgetVsActual[]> {
        const budgets = await fetchItems<any>('budgets');
        const periodBudgets = budgets.filter((b: any) => b.period === period);

        const trialBalance = await this.generateTrialBalance(period);
        const actualMap = new Map<string, number>();
        for (const acct of trialBalance.accountBreakdown) {
            actualMap.set(acct.accountId, acct.net);
        }

        const results: BudgetVsActual[] = [];

        for (const budget of periodBudgets) {
            const actual = actualMap.get(budget.accountId) || 0;
            const variance = actual - budget.amount;
            const variancePercent = budget.amount !== 0 ? (variance / Math.abs(budget.amount)) * 100 : 0;

            results.push({
                accountId: budget.accountId,
                accountCode: budget.accountCode || '',
                accountName: budget.accountName || '',
                period,
                budgetAmount: budget.amount,
                actualAmount: parseFloat(actual.toFixed(2)),
                variance: parseFloat(variance.toFixed(2)),
                variancePercent: parseFloat(variancePercent.toFixed(1)),
            });
        }

        return results.sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));
    },

    /**
     * Upsert a budget line item for a specific account and period.
     */
    async setBudget(accountId: string, accountCode: string, accountName: string, period: string, amount: number): Promise<void> {
        const id = `budget_${accountId}_${period}`;
        await updateItem('budgets', id, {
            id,
            accountId,
            accountCode,
            accountName,
            period,
            amount,
            updatedAt: now(),
            updatedBy: getCurrentUserId(),
        });
        console.log(`[Finance] Budget set: ${accountCode} ${period} = ${amount}`);
    },

    // ═══════════════════════════════════════════════════════════════════════
    // TAX CALCULATION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Calculate taxes for a given subtotal.
     * Supports multiple tax components (e.g., VAT + tourism levy + municipality tax).
     */
    calculateTax(
        subtotal: number,
        taxRules?: { taxName: string; rate: number; isCompounding?: boolean }[]
    ): TaxCalculation {
        // Default: single VAT rate (configurable per property)
        const rules = taxRules || [
            { taxName: 'VAT', rate: 10, isCompounding: false },
        ];

        let runningBase = subtotal;
        const breakdown: TaxCalculation['breakdown'] = [];
        let totalTax = 0;

        for (const rule of rules) {
            const base = rule.isCompounding ? runningBase + totalTax : subtotal;
            const amount = parseFloat((base * (rule.rate / 100)).toFixed(2));
            breakdown.push({ taxName: rule.taxName, rate: rule.rate, amount });
            totalTax += amount;

            if (rule.isCompounding) {
                runningBase = base;
            }
        }

        return {
            subtotal: parseFloat(subtotal.toFixed(2)),
            taxRate: parseFloat(rules.reduce((sum, r) => sum + r.rate, 0).toFixed(2)),
            taxAmount: parseFloat(totalTax.toFixed(2)),
            totalWithTax: parseFloat((subtotal + totalTax).toFixed(2)),
            breakdown,
        };
    },

    /**
     * Calculate and post tax liability for a revenue posting.
     */
    async postRevenueWithTax(params: {
        revenueAccount: Pick<GLAccount, 'id' | 'code'>;
        cashAccount: Pick<GLAccount, 'id' | 'code'>;
        taxLiabilityAccount: Pick<GLAccount, 'id' | 'code'>;
        subtotal: number;
        businessDate: string;
        description: string;
        moduleSource: LedgerEntry['moduleSource'];
        taxRules?: { taxName: string; rate: number; isCompounding?: boolean }[];
        reservationId?: string;
    }): Promise<{ transactionId: string; tax: TaxCalculation }> {
        const tax = this.calculateTax(params.subtotal, params.taxRules);

        const entries: Omit<LedgerEntry, 'id' | 'date' | 'userId'>[] = [
            // Debit: Cash/AR for total including tax
            {
                accountId: params.cashAccount.id,
                accountCode: params.cashAccount.code,
                debit: tax.totalWithTax,
                credit: 0,
                businessDate: params.businessDate,
                description: params.description,
                moduleSource: params.moduleSource,
                transactionId: '',
                reservationId: params.reservationId,
            },
            // Credit: Revenue for subtotal
            {
                accountId: params.revenueAccount.id,
                accountCode: params.revenueAccount.code,
                debit: 0,
                credit: params.subtotal,
                businessDate: params.businessDate,
                description: `${params.description} (revenue)`,
                moduleSource: params.moduleSource,
                transactionId: '',
                reservationId: params.reservationId,
            },
            // Credit: Tax liability
            {
                accountId: params.taxLiabilityAccount.id,
                accountCode: params.taxLiabilityAccount.code,
                debit: 0,
                credit: tax.taxAmount,
                businessDate: params.businessDate,
                description: `${params.description} (tax)`,
                moduleSource: params.moduleSource,
                transactionId: '',
                reservationId: params.reservationId,
            },
        ];

        const transactionId = await this.postTransaction(entries);
        return { transactionId, tax };
    },

    // ═══════════════════════════════════════════════════════════════════════
    // REVENUE RECOGNITION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Defer revenue for a multi-night stay and recognize nightly.
     * Per ASC 606 / IFRS 15: recognize as the performance obligation is satisfied (each night).
     */
    async deferRevenue(params: {
        reservationId: string;
        revenueType: RevenueRecognitionEntry['revenueType'];
        totalAmount: number;
        checkIn: string;  // YYYY-MM-DD
        checkOut: string; // YYYY-MM-DD
    }): Promise<RevenueRecognitionEntry> {
        const entry: RevenueRecognitionEntry = {
            id: generateId('rr'),
            reservationId: params.reservationId,
            revenueType: params.revenueType,
            totalAmount: params.totalAmount,
            recognizedAmount: 0,
            deferredAmount: params.totalAmount,
            recognitionDate: params.checkIn,
            businessDate: todayBusinessDate(),
            status: 'deferred',
        };

        await addItem('revenue_recognition', entry);
        console.log(`[Finance] Deferred revenue: ${entry.id} for ${params.reservationId}, amount ${params.totalAmount}`);
        return entry;
    },

    /**
     * Recognize a portion of deferred revenue (typically called nightly by night audit).
     */
    async recognizeRevenue(entryId: string, amount: number): Promise<RevenueRecognitionEntry> {
        const entry = await fetchItem<RevenueRecognitionEntry>('revenue_recognition', entryId);
        if (!entry) throw new Error(`[Finance] Revenue recognition entry ${entryId} not found`);

        const newRecognized = entry.recognizedAmount + amount;
        const newDeferred = entry.totalAmount - newRecognized;

        if (newRecognized > entry.totalAmount + 0.01) {
            throw new Error(`[Finance] Cannot recognize more than total amount (${entry.totalAmount})`);
        }

        const status: RevenueRecognitionEntry['status'] =
            Math.abs(newDeferred) < 0.01 ? 'fully_recognized' : 'partial';

        await updateItem('revenue_recognition', entryId, {
            recognizedAmount: parseFloat(newRecognized.toFixed(2)),
            deferredAmount: parseFloat(Math.max(0, newDeferred).toFixed(2)),
            status,
            recognitionDate: todayBusinessDate(),
        });

        console.log(`[Finance] Recognized ${amount} for ${entryId}. Status: ${status}`);
        return { ...entry, recognizedAmount: newRecognized, deferredAmount: newDeferred, status };
    },

    /**
     * Get all deferred/partially recognized revenue entries.
     */
    async getDeferredRevenue(): Promise<RevenueRecognitionEntry[]> {
        const all = await fetchItems<RevenueRecognitionEntry>('revenue_recognition');
        return all.filter(e => e.status !== 'fully_recognized');
    },

    // ═══════════════════════════════════════════════════════════════════════
    // ACCOUNTS AGING (AR / AP)
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Generate an aging report for accounts receivable or payable.
     * Buckets: Current, 1-30, 31-60, 61-90, 90+ days.
     */
    async getAccountsAging(type: 'receivable' | 'payable'): Promise<{
        buckets: AgingBucket[];
        totalOutstanding: number;
    }> {
        const collectionName = type === 'receivable' ? 'accounts_receivable' : 'accounts_payable';
        const openItems = await fetchItems<any>(collectionName);

        const todayMs = Date.now();
        const bucketDefs = [
            { label: 'Current', minDays: 0, maxDays: 0 },
            { label: '1-30 Days', minDays: 1, maxDays: 30 },
            { label: '31-60 Days', minDays: 31, maxDays: 60 },
            { label: '61-90 Days', minDays: 61, maxDays: 90 },
            { label: '90+ Days', minDays: 91, maxDays: null },
        ];

        const buckets: AgingBucket[] = bucketDefs.map(def => ({
            ...def,
            count: 0,
            totalAmount: 0,
            entries: [],
        }));

        let totalOutstanding = 0;

        for (const item of openItems) {
            if (item.status === 'paid' || item.status === 'closed') continue;

            const dueDate = item.dueDate ? new Date(item.dueDate) : new Date(item.createdAt || todayMs);
            const ageDays = Math.max(0, Math.floor((todayMs - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
            const amount = item.amount || item.balance || 0;

            if (amount <= 0) continue;

            totalOutstanding += amount;

            const bucket = buckets.find(b => {
                if (b.maxDays === null) return ageDays >= b.minDays;
                return ageDays >= b.minDays && ageDays <= b.maxDays;
            });

            if (bucket) {
                bucket.count++;
                bucket.totalAmount += amount;
                bucket.entries.push({
                    accountId: item.accountId || item.id,
                    description: item.description || item.guestName || '',
                    amount: parseFloat(amount.toFixed(2)),
                    ageDays,
                    dueDate: dueDate.toISOString().split('T')[0],
                });
            }
        }

        // Round bucket totals
        for (const bucket of buckets) {
            bucket.totalAmount = parseFloat(bucket.totalAmount.toFixed(2));
        }

        return {
            buckets,
            totalOutstanding: parseFloat(totalOutstanding.toFixed(2)),
        };
    },

    // ═══════════════════════════════════════════════════════════════════════
    // LEDGER QUERIES
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Get all ledger entries for a specific account in a date range.
     */
    async getLedgerByAccount(accountId: string, fromDate?: string, toDate?: string): Promise<LedgerEntry[]> {
        const all = await fetchItems<LedgerEntry>('ledgerEntries');
        return all.filter(e => {
            if (e.accountId !== accountId) return false;
            if (fromDate && e.businessDate < fromDate) return false;
            if (toDate && e.businessDate > toDate) return false;
            return true;
        }).sort((a, b) => a.date - b.date);
    },

    /**
     * Get all ledger entries for a specific transaction.
     */
    async getLedgerByTransaction(transactionId: string): Promise<LedgerEntry[]> {
        const all = await fetchItems<LedgerEntry>('ledgerEntries');
        return all.filter(e => e.transactionId === transactionId);
    },

    /**
     * Get revenue breakdown by department for a period.
     */
    async getRevenueByDepartment(period: string): Promise<{ departmentId: string; revenue: number }[]> {
        const entries = await fetchItems<LedgerEntry>('ledgerEntries');
        const periodEntries = entries.filter(e => e.businessDate?.startsWith(period) && (e.credit || 0) > 0);

        const deptMap = new Map<string, number>();
        for (const entry of periodEntries) {
            const dept = entry.departmentId || 'Unassigned';
            deptMap.set(dept, (deptMap.get(dept) || 0) + (entry.credit || 0));
        }

        return Array.from(deptMap.entries())
            .map(([departmentId, revenue]) => ({ departmentId, revenue: parseFloat(revenue.toFixed(2)) }))
            .sort((a, b) => b.revenue - a.revenue);
    },
};
