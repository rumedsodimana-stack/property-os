import { LedgerEntry, GLAccount } from '../../types';
import { addItem } from '../kernel/firestoreService';
import { internalAuthService } from '../kernel/internalAuthService';

/**
 * Hotel Singularity OS — Finance Service
 * Handles unified double-entry ledger posting to ensure every 
 * financial event (PMS, POS, BEO) posts a balanced Debit and Credit.
 */

export const financeService = {
    /**
     * Posts a balanced journal entry to the Master Ledger.
     * Throws an error if Debits and Credits do not match.
     */
    async postTransaction(
        entries: Omit<LedgerEntry, 'id' | 'date' | 'userId'>[],
        transactionId?: string
    ): Promise<string> {
        const session = internalAuthService.getSession();
        const userId = session?.userId || 'system_automated';
        const tId = transactionId || `tx_${Date.now()}`;
        const timestamp = Date.now();

        // 1. Calculate Debit vs Credit to ensure it balances
        let totalDebit = 0;
        let totalCredit = 0;

        for (const entry of entries) {
            totalDebit += entry.debit || 0;
            totalCredit += entry.credit || 0;
        }

        // Floating point math precision fix for simple checks
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            throw new Error(`Transaction Out of Balance: Debits (${totalDebit}) != Credits (${totalCredit})`);
        }

        // 2. Write each line item to the Ledger collection
        const writtenIds: string[] = [];

        for (const entry of entries) {
            const fullEntry: LedgerEntry = {
                id: `le_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                ...entry,
                date: timestamp,
                userId,
                transactionId: tId,
            };

            await addItem('ledgerEntries', fullEntry);
            writtenIds.push(fullEntry.id);
        }

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
            posOrderId: params.posOrderId
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
            posOrderId: params.posOrderId
        };

        return this.postTransaction([debits, credits]);
    }
};
