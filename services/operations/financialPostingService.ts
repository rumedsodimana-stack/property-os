import { PosOrder } from '../../types';
import { financeService } from './financeService';

type PaymentMethod = PosOrder['paymentMethod'];

type AccountRef = {
    id: string;
    code: string;
};

export const LEDGER_ACCOUNTS = {
    cash: { id: 'gl_03', code: '1000' },
    cardClearing: { id: 'gl_card_clearing', code: '1010' },
    cityLedger: { id: 'gl_city_ledger', code: '1200' },
    guestLedger: { id: 'gl_guest_ledger', code: '1100' },
    inventory: { id: 'gl_inventory', code: '1300' },
    accountsPayable: { id: 'gl_04', code: '2000' },
    tipsPayable: { id: 'gl_tips_payable', code: '2200' },
    roomRevenue: { id: 'gl_room_rev', code: '4000' },
    fbRevenue: { id: 'gl_fb_rev', code: '4100' },
    cogs: { id: 'gl_02', code: '5000' },
    cashOverShort: { id: 'gl_cash_over_short', code: '6190' },
    posCashClearing: { id: 'gl_pos_cash_clearing', code: '1015' }
} as const;

const businessDate = () => new Date().toISOString().split('T')[0];

export const normalizePosPaymentMethod = (raw: unknown): PaymentMethod => {
    const value = String(raw || '').toLowerCase();

    if (value === 'cash') return 'Cash';
    if (value === 'card') return 'Card';
    if (value === 'ap' || value === 'app') return 'App';
    if (value === 'voucher') return 'Voucher';
    if (value === 'roompost' || value === 'room_post' || value === 'room post') return 'RoomPost';
    if (value === 'cityledger' || value === 'city_ledger' || value === 'city ledger') return 'CityLedger';

    return 'Cash';
};

const getSettlementAssetAccount = (paymentMethod: PaymentMethod): AccountRef => {
    if (paymentMethod === 'Cash') return LEDGER_ACCOUNTS.cash;
    if (paymentMethod === 'CityLedger') return LEDGER_ACCOUNTS.cityLedger;
    return LEDGER_ACCOUNTS.cardClearing;
};

export const postPosSettlementToLedger = async (
    order: PosOrder,
    payment: {
        type?: unknown;
        amount?: number;
        tips?: number;
    }
): Promise<string | null> => {
    const paymentMethod = normalizePosPaymentMethod(payment.type ?? order.paymentMethod);
    if (paymentMethod === 'RoomPost') return null;

    const revenueAmount = Number(order.total || 0);
    if (revenueAmount <= 0) return null;

    const providedTips = Number(payment.tips || 0);
    const inferredTips = Math.max(0, Number(payment.amount || 0) - revenueAmount);
    const tipsAmount = Math.max(0, providedTips || inferredTips);
    const assetAccount = getSettlementAssetAccount(paymentMethod);
    const txId = `tx_pos_settle_${order.id}_${Date.now()}`;
    const date = businessDate();

    const entries: Parameters<typeof financeService.postTransaction>[0] = [
        {
            transactionId: txId,
            businessDate: date,
            accountId: assetAccount.id,
            accountCode: assetAccount.code,
            debit: revenueAmount,
            credit: 0,
            description: `POS Settlement ${paymentMethod} - Order #${order.id.slice(-6)}`,
            moduleSource: 'POS',
            departmentId: 'F&B',
            outletId: order.outletId,
            posOrderId: order.id,
            reservationId: undefined
        },
        {
            transactionId: txId,
            businessDate: date,
            accountId: LEDGER_ACCOUNTS.fbRevenue.id,
            accountCode: LEDGER_ACCOUNTS.fbRevenue.code,
            debit: 0,
            credit: revenueAmount,
            description: `F&B Revenue - Order #${order.id.slice(-6)}`,
            moduleSource: 'POS',
            departmentId: 'F&B',
            outletId: order.outletId,
            posOrderId: order.id,
            reservationId: undefined
        }
    ];

    if (tipsAmount > 0) {
        entries.push(
            {
                transactionId: txId,
                businessDate: date,
                accountId: assetAccount.id,
                accountCode: assetAccount.code,
                debit: tipsAmount,
                credit: 0,
                description: `Tips Collected - Order #${order.id.slice(-6)}`,
                moduleSource: 'POS',
                departmentId: 'F&B',
                outletId: order.outletId,
                posOrderId: order.id,
                reservationId: undefined
            },
            {
                transactionId: txId,
                businessDate: date,
                accountId: LEDGER_ACCOUNTS.tipsPayable.id,
                accountCode: LEDGER_ACCOUNTS.tipsPayable.code,
                debit: 0,
                credit: tipsAmount,
                description: `Tips Payable - Order #${order.id.slice(-6)}`,
                moduleSource: 'POS',
                departmentId: 'F&B',
                outletId: order.outletId,
                posOrderId: order.id,
                reservationId: undefined
            }
        );
    }

    await financeService.postTransaction(entries, txId);
    return txId;
};

export const postInventoryConsumptionToLedger = async (
    order: Pick<PosOrder, 'id' | 'outletId'>,
    consumedCost: number
): Promise<string | null> => {
    if (consumedCost <= 0) return null;

    const txId = `tx_cogs_${order.id}_${Date.now()}`;
    const date = businessDate();

    await financeService.postTransaction([
        {
            transactionId: txId,
            businessDate: date,
            accountId: LEDGER_ACCOUNTS.cogs.id,
            accountCode: LEDGER_ACCOUNTS.cogs.code,
            debit: consumedCost,
            credit: 0,
            description: `COGS - Inventory consumption for Order #${order.id.slice(-6)}`,
            moduleSource: 'POS',
            departmentId: 'F&B',
            outletId: order.outletId,
            posOrderId: order.id
        },
        {
            transactionId: txId,
            businessDate: date,
            accountId: LEDGER_ACCOUNTS.inventory.id,
            accountCode: LEDGER_ACCOUNTS.inventory.code,
            debit: 0,
            credit: consumedCost,
            description: `Inventory Depletion - Order #${order.id.slice(-6)}`,
            moduleSource: 'POS',
            departmentId: 'F&B',
            outletId: order.outletId,
            posOrderId: order.id
        }
    ], txId);

    return txId;
};

export const postFolioSettlementToLedger = async (params: {
    reservationId: string;
    amount: number;
    paymentMethod?: unknown;
    description?: string;
}): Promise<string | null> => {
    if (params.amount <= 0) return null;

    const paymentMethod = normalizePosPaymentMethod(params.paymentMethod || 'Card');
    const assetAccount = getSettlementAssetAccount(paymentMethod);
    const txId = `tx_folio_settle_${params.reservationId}_${Date.now()}`;
    const date = businessDate();

    await financeService.postTransaction([
        {
            transactionId: txId,
            businessDate: date,
            accountId: assetAccount.id,
            accountCode: assetAccount.code,
            debit: params.amount,
            credit: 0,
            description: params.description || `Folio Settlement (${paymentMethod})`,
            moduleSource: 'PMS',
            departmentId: 'FrontDesk',
            reservationId: params.reservationId
        },
        {
            transactionId: txId,
            businessDate: date,
            accountId: LEDGER_ACCOUNTS.guestLedger.id,
            accountCode: LEDGER_ACCOUNTS.guestLedger.code,
            debit: 0,
            credit: params.amount,
            description: params.description || `Folio Settlement (${paymentMethod})`,
            moduleSource: 'PMS',
            departmentId: 'FrontDesk',
            reservationId: params.reservationId
        }
    ], txId);

    return txId;
};
