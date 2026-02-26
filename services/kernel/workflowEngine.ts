/**
 * Hotel Singularity OS — Workflow Engine
 * Centralized approval / rejection engine for all OS modules.
 * Every action is written to the `workflows` Firestore collection for audit.
 */
import { addItem, updateItem, fetchItems, fetchItem } from './firestoreService';
import { internalAuthService, OSPermission } from './internalAuthService';

// ─── Types ────────────────────────────────────────────────────────────────────

export type WorkflowStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

export type WorkflowEntityType =
    | 'leaveRequest'
    | 'purchaseOrder'
    | 'menuItem'
    | 'banquetEvent'
    | 'transaction'
    | 'maintenance'
    | 'general';

export interface WorkflowRecord {
    id: string;
    entityType: WorkflowEntityType;
    entityId: string;
    entityLabel: string;       // human-readable description e.g. "Leave: John Doe (Annual, 3 days)"
    status: WorkflowStatus;
    submittedBy: string;       // fullName of submitter
    submittedByRole: string;
    submittedAt: number;
    approvedBy?: string;
    approvedByRole?: string;
    approvedAt?: number;
    rejectedBy?: string;
    rejectedByRole?: string;
    rejectedAt?: number;
    rejectionNote?: string;
    approvalNote?: string;
    requiredPermission: OSPermission;  // what right is needed to approve
}

// ─── Workflow Engine ──────────────────────────────────────────────────────────

export const workflowEngine = {

    /**
     * Submit a new item for approval.
     * Returns the new workflow record ID.
     */
    async submit(
        entityType: WorkflowEntityType,
        entityId: string,
        entityLabel: string,
        requiredPermission: OSPermission
    ): Promise<string> {
        const session = internalAuthService.getSession();
        if (!session) throw new Error('Not authenticated');

        const record: WorkflowRecord = {
            id: `wf_${Date.now()}`,
            entityType,
            entityId,
            entityLabel,
            status: 'Pending',
            submittedBy: session.fullName,
            submittedByRole: session.role,
            submittedAt: Date.now(),
            requiredPermission,
        };

        await addItem('workflows', record);
        return record.id;
    },

    /**
     * Approve a workflow record.
     * Throws if the current user lacks the required permission.
     */
    async approve(workflowId: string, note?: string): Promise<void> {
        const session = internalAuthService.getSession();
        if (!session) throw new Error('Not authenticated. Please log in first.');

        const workflow = await fetchItem<WorkflowRecord>('workflows', workflowId);
        if (!workflow) throw new Error(`Workflow ${workflowId} not found.`);
        if (workflow.status !== 'Pending') throw new Error('This item is no longer pending.');

        if (!internalAuthService.hasPermission(workflow.requiredPermission, session.role)) {
            throw new Error(`Access denied. Your role (${session.role}) cannot approve this.`);
        }

        const update: Partial<WorkflowRecord> = {
            status: 'Approved',
            approvedBy: session.fullName,
            approvedByRole: session.role,
            approvedAt: Date.now(),
            approvalNote: note,
        };

        await updateItem('workflows', workflowId, update);

        // ─── Autonomous Downstream Triggers ────────────────────────────
        try {
            if (workflow.entityType === 'banquetEvent') {
                // 1. Update BEO Status to Definite
                await updateItem('events', workflow.entityId, { status: 'Definite' });

                // 2. Fetch the BEO to generate matching tasks
                const beo = await fetchItem<any>('events', workflow.entityId);
                if (beo) {
                    // Generate Kitchen Prep Task if it has F&B
                    if (beo.foodAndBeverage && beo.foodAndBeverage.length > 0) {
                        const prepTask = {
                            id: `ts_${Date.now()}_kitchen`,
                            title: `Kitchen Prep: ${beo.name}`,
                            description: `Prepare F&B for ${beo.pax} pax. See BEO ${beo.id} for full recipe specs and dietaries.`,
                            department: 'Kitchen',
                            delegatorId: 'sys_workflow',
                            priority: 'High',
                            status: 'Open',
                            dueDate: new Date(beo.startDate).getTime() - (24 * 60 * 60 * 1000), // Due 24h before
                            aiSuggested: true
                        };
                        await addItem('tasks', prepTask);
                    }

                    // Generate Operations / Banquet Setup Task if it has an Agenda
                    if (beo.agenda && beo.agenda.length > 0) {
                        const setupTask = {
                            id: `ts_${Date.now()}_banquet`,
                            title: `Event Setup: ${beo.name}`,
                            description: `Set up ${beo.venueId} in ${beo.setupStyle} style. Follow agenda timeline blocks starting at ${beo.agenda[0]?.timeStart || '08:00'}.`,
                            department: 'Events',
                            delegatorId: 'sys_workflow',
                            priority: 'Medium',
                            status: 'Open',
                            dueDate: new Date(beo.startDate).getTime() - (2 * 60 * 60 * 1000), // Due 2h before
                            aiSuggested: true
                        };
                        await addItem('tasks', setupTask);
                    }
                }
            }
            // ... future entityType triggers can be added here
        } catch (error) {
            console.error('Failed to execute downstream triggers for workflow:', workflowId, error);
        }
    },

    /**
     * Reject a workflow record with a mandatory reason.
     */
    async reject(workflowId: string, reason: string): Promise<void> {
        const session = internalAuthService.getSession();
        if (!session) throw new Error('Not authenticated. Please log in first.');

        const workflow = await fetchItem<WorkflowRecord>('workflows', workflowId);
        if (!workflow) throw new Error(`Workflow ${workflowId} not found.`);
        if (workflow.status !== 'Pending') throw new Error('This item is no longer pending.');

        if (!internalAuthService.hasPermission(workflow.requiredPermission, session.role)) {
            throw new Error(`Access denied. Your role (${session.role}) cannot reject this.`);
        }

        const update: Partial<WorkflowRecord> = {
            status: 'Rejected',
            rejectedBy: session.fullName,
            rejectedByRole: session.role,
            rejectedAt: Date.now(),
            rejectionNote: reason,
        };

        await updateItem('workflows', workflowId, update);
    },

    /**
     * Fetch all workflow records (for an audit dashboard).
     */
    async getAll(): Promise<WorkflowRecord[]> {
        return fetchItems<WorkflowRecord>('workflows');
    },

    /**
     * Fetch a single workflow record by ID.
     */
    async get(workflowId: string): Promise<WorkflowRecord | null> {
        return fetchItem<WorkflowRecord>('workflows', workflowId);
    },

    /**
     * Fetch workflows for a specific entity.
     */
    async getForEntity(entityId: string): Promise<WorkflowRecord[]> {
        const all = await fetchItems<WorkflowRecord>('workflows');
        return all.filter(w => w.entityId === entityId);
    },

    /**
     * Convenience: check if current user can approve a specific permission type.
     */
    canApprove(permission: OSPermission): boolean {
        const session = internalAuthService.getSession();
        if (!session) return false;
        return internalAuthService.hasPermission(permission, session.role);
    },
};
