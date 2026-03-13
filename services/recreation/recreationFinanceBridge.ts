import { GLAccount, LedgerEntry } from "../../types";
import { addItem } from "../kernel/firestoreService";
import { financeService } from "../operations/financeService";
import { RecChargeInput, RecCharge } from "../../types/recreation";

export interface RecFinanceParams {
    revenueAccount: Pick<GLAccount, "id" | "code">;
    settlementAccount: Pick<GLAccount, "id" | "code">; // cash/bank/clearing
    businessDate: string;
    description: string;
    moduleSource: LedgerEntry["moduleSource"];
    departmentId?: string;
    outletId?: string;
    reservationId?: string;
    posOrderId?: string;
}

export const recreationFinanceBridge = {
    /**
     * Records a recreational charge and posts balanced ledger entries.
     * Returns {chargeId, transactionId}
     */
    async postRecCharge(
        charge: RecChargeInput,
        gl: RecFinanceParams
    ): Promise<{ chargeId: string; transactionId: string }> {
        const chargeId = `rec_charge_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const recCharge: RecCharge = {
            id: chargeId,
            createdAt: new Date().toISOString(),
            status: charge.status || 'posted',
            ...charge,
        };

        // Persist charge record
        await addItem('rec_charges', recCharge);

        // Post finance entry
        const txId = await financeService.postSimpleEntry({
            debitAccount: gl.settlementAccount,
            creditAccount: gl.revenueAccount,
            amount: charge.amount,
            businessDate: gl.businessDate,
            description: gl.description,
            moduleSource: gl.moduleSource,
            departmentId: gl.departmentId,
            outletId: gl.outletId,
            reservationId: gl.reservationId,
            posOrderId: gl.posOrderId
        });

        return { chargeId, transactionId: txId };
    }
};
