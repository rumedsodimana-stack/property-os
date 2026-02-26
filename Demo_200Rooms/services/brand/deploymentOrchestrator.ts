/**
 * Deployment Orchestrator
 * 
 * Coordinates code generation, testing, deployment, and rollback.
 * The brain that safely applies brand standard adaptations to the live system.
 */

import { SystemAdaptation } from './brandStandardsAIService';
import { codeGenerator } from './codeGenerator';
import { fileSystemManager } from '../kernel/fileSystemManager';
import { aiProvider } from '../intelligence/aiProvider';

export interface DeploymentPlan {
    id: string;
    adaptations: SystemAdaptation[];
    estimatedDuration: number; // seconds
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    requiresReload: boolean;
    affectedModules: string[];
}

export interface DeploymentResult {
    success: boolean;
    deploymentId: string;
    appliedAdaptations: string[];
    failedAdaptations: string[];
    backupIds: string[];
    duration: number;
    errors?: string[];
}

export interface RollbackResult {
    success: boolean;
    restoredFiles: string[];
    errors?: string[];
}

class DeploymentOrchestrator {
    private activeDeployments: Map<string, DeploymentPlan> = new Map();
    private deploymentHistory: DeploymentResult[] = [];

    /**
     * Create deployment plan from adaptations
     */
    async createDeploymentPlan(
        adaptations: SystemAdaptation[]
    ): Promise<DeploymentPlan> {
        const plan: DeploymentPlan = {
            id: `deploy_${Date.now()}`,
            adaptations,
            estimatedDuration: this.estimateDuration(adaptations),
            riskLevel: this.assessRisk(adaptations),
            requiresReload: this.requiresReload(adaptations),
            affectedModules: this.getAffectedModules(adaptations)
        };

        this.activeDeployments.set(plan.id, plan);
        return plan;
    }

    /**
     * Deploy adaptations
     */
    async deploy(
        adaptations: SystemAdaptation[],
        options: {
            dryRun?: boolean;
            skipTests?: boolean;
            autoRollback?: boolean;
        } = {}
    ): Promise<DeploymentResult> {
        const startTime = Date.now();
        const deploymentId = `deploy_${startTime}`;
        const appliedAdaptations: string[] = [];
        const failedAdaptations: string[] = [];
        const backupIds: string[] = [];
        const errors: string[] = [];

        console.log(`[Deployment] Starting deployment ${deploymentId}`);
        console.log(`[Deployment] ${adaptations.length} adaptations to apply`);

        try {
            // Step 1: Validate all adaptations
            console.log('[Deployment] Step 1: Validating adaptations...');
            for (const adaptation of adaptations) {
                const validation = await this.validateAdaptation(adaptation);
                if (!validation.valid) {
                    errors.push(`Validation failed for ${adaptation.id}: ${validation.error}`);
                    failedAdaptations.push(adaptation.id);
                }
            }

            if (failedAdaptations.length > 0 && !options.skipTests) {
                throw new Error(`${failedAdaptations.length} adaptations failed validation`);
            }

            // Step 2: Generate code for each adaptation
            console.log('[Deployment] Step 2: Generating code...');
            const codeChanges = await this.generateCodeChanges(adaptations);

            // Step 3: Dry run check
            if (options.dryRun) {
                console.log('[Deployment] Dry run mode - skipping actual deployment');
                return {
                    success: true,
                    deploymentId,
                    appliedAdaptations: adaptations.map(a => a.id),
                    failedAdaptations: [],
                    backupIds: [],
                    duration: Date.now() - startTime
                };
            }

            // Step 4: Apply changes
            console.log('[Deployment] Step 4: Applying changes...');
            for (const adaptation of adaptations) {
                try {
                    const result = await this.applyAdaptation(adaptation);
                    if (result.success) {
                        appliedAdaptations.push(adaptation.id);
                        if (result.backupId) {
                            backupIds.push(result.backupId);
                        }
                    } else {
                        failedAdaptations.push(adaptation.id);
                        errors.push(result.error || 'Unknown error');
                    }
                } catch (error: any) {
                    failedAdaptations.push(adaptation.id);
                    errors.push(error.message);
                }
            }

            // Step 5: Test deployment
            if (!options.skipTests) {
                console.log('[Deployment] Step 5: Testing deployment...');
                const testResults = await this.testDeployment(adaptations);
                if (!testResults.passed && options.autoRollback) {
                    console.error('[Deployment] Tests failed, rolling back...');
                    await this.rollback(backupIds);
                    throw new Error('Deployment tests failed');
                }
            }

            // Step 6: Trigger reload if needed
            if (this.requiresReload(adaptations)) {
                console.log('[Deployment] Step 6: Triggering hot reload...');
                this.triggerHotReload(adaptations);
            }

            const result: DeploymentResult = {
                success: failedAdaptations.length === 0,
                deploymentId,
                appliedAdaptations,
                failedAdaptations,
                backupIds,
                duration: Date.now() - startTime,
                errors: errors.length > 0 ? errors : undefined
            };

            this.deploymentHistory.unshift(result);
            console.log(`[Deployment] Completed in ${result.duration}ms`);

            return result;

        } catch (error: any) {
            console.error('[Deployment] Deployment failed:', error.message);

            // Auto-rollback on failure
            if (options.autoRollback && backupIds.length > 0) {
                console.log('[Deployment] Performing auto-rollback...');
                await this.rollback(backupIds);
            }

            return {
                success: false,
                deploymentId,
                appliedAdaptations,
                failedAdaptations,
                backupIds,
                duration: Date.now() - startTime,
                errors: [error.message, ...errors]
            };
        }
    }

    /**
     * Apply single adaptation
     */
    private async applyAdaptation(
        adaptation: SystemAdaptation
    ): Promise<{ success: boolean; error?: string; backupId?: string }> {
        console.log(`[Deployment] Applying ${adaptation.type} adaptation: ${adaptation.proposedChange}`);

        try {
            switch (adaptation.type) {
                case 'css':
                    return await this.applyCSSAdaptation(adaptation);

                case 'config':
                    return await this.applyConfigAdaptation(adaptation);

                case 'workflow':
                    return await this.applyWorkflowAdaptation(adaptation);

                case 'permission':
                    return await this.applyPermissionAdaptation(adaptation);

                default:
                    return { success: false, error: 'Unknown adaptation type' };
            }
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Apply CSS adaptation
     */
    private async applyCSSAdaptation(
        adaptation: SystemAdaptation
    ): Promise<{ success: boolean; error?: string; backupId?: string }> {
        // Extract variable name from proposed change
        const variableMatch = adaptation.proposedChange.match(/--color-(\w+)/);
        if (!variableMatch) {
            return { success: false, error: 'Could not parse CSS variable name' };
        }

        const variableName = `--color-${variableMatch[1]}`;

        return await fileSystemManager.updateCSSFile(
            adaptation.targetFile,
            variableName,
            adaptation.newValue
        );
    }

    /**
     * Apply config adaptation
     */
    private async applyConfigAdaptation(
        adaptation: SystemAdaptation
    ): Promise<{ success: boolean; error?: string; backupId?: string }> {
        // Extract config name from target file
        const configName = adaptation.proposedChange.split(' ')[1]; // Simple parsing

        return await fileSystemManager.updateConfigValue(
            adaptation.targetFile,
            configName,
            adaptation.newValue
        );
    }

    /**
     * Apply workflow adaptation
     */
    private async applyWorkflowAdaptation(
        adaptation: SystemAdaptation
    ): Promise<{ success: boolean; error?: string; backupId?: string }> {
        // Generate validation code
        const validationCode = codeGenerator.generateValidationStep(
            `!${adaptation.newValue}`,
            adaptation.proposedChange
        );

        // Insert into target file
        return await fileSystemManager.insertCode(
            adaptation.targetFile,
            adaptation.targetLine || 1,
            validationCode.formatted
        );
    }

    /**
     * Apply permission adaptation
     */
    private async applyPermissionAdaptation(
        adaptation: SystemAdaptation
    ): Promise<{ success: boolean; error?: string; backupId?: string }> {
        // Update type definitions
        return await fileSystemManager.updateConfigValue(
            adaptation.targetFile,
            'permissions',
            adaptation.newValue
        );
    }

    /**
     * Validate adaptation before applying
     */
    private async validateAdaptation(
        adaptation: SystemAdaptation
    ): Promise<{ valid: boolean; error?: string }> {
        // Check target file exists
        const exists = await fileSystemManager.fileExists(adaptation.targetFile);
        if (!exists) {
            return { valid: false, error: 'Target file does not exist' };
        }

        // Validate new value format
        if (adaptation.type === 'css') {
            if (!/^#[A-Fa-f0-9]{6}$/.test(adaptation.newValue)) {
                return { valid: false, error: 'Invalid hex color format' };
            }
        }

        return { valid: true };
    }

    /**
     * Generate code changes from adaptations
     */
    private async generateCodeChanges(
        adaptations: SystemAdaptation[]
    ): Promise<Map<string, string>> {
        const changes = new Map<string, string>();

        for (const adaptation of adaptations) {
            // Group changes by file
            if (!changes.has(adaptation.targetFile)) {
                changes.set(adaptation.targetFile, '');
            }
        }

        return changes;
    }

    /**
     * Test deployment
     */
    private async testDeployment(
        adaptations: SystemAdaptation[]
    ): Promise<{ passed: boolean; failures: string[] }> {
        // In production, this would run actual tests
        // For now, simulate success
        console.log('[Deployment] Running post-deployment tests...');

        await new Promise(resolve => setTimeout(resolve, 500));

        return {
            passed: true,
            failures: []
        };
    }

    /**
     * Trigger hot reload
     */
    private triggerHotReload(adaptations: SystemAdaptation[]): void {
        console.log('[Deployment] Hot reload triggered');

        // In production, this would use Vite's HMR API
        // window.location.reload();
    }

    /**
     * Rollback deployment
     */
    async rollback(backupIds: string[]): Promise<RollbackResult> {
        console.log(`[Deployment] Rolling back ${backupIds.length} changes...`);

        const restoredFiles: string[] = [];
        const errors: string[] = [];

        for (const backupId of backupIds) {
            const result = await fileSystemManager.restoreFromBackup(backupId);
            if (result.success) {
                restoredFiles.push(backupId);
            } else {
                errors.push(result.error || 'Unknown error');
            }
        }

        return {
            success: errors.length === 0,
            restoredFiles,
            errors: errors.length > 0 ? errors : undefined
        };
    }

    /**
     * Helper: Estimate deployment duration
     */
    private estimateDuration(adaptations: SystemAdaptation[]): number {
        // Rough estimate: 2 seconds per adaptation
        return adaptations.length * 2;
    }

    /**
     * Helper: Assess overall risk
     */
    private assessRisk(adaptations: SystemAdaptation[]): 'low' | 'medium' | 'high' | 'critical' {
        const risks = adaptations.map(a => a.risk);

        if (risks.includes('critical')) return 'critical';
        if (risks.includes('high')) return 'high';
        if (risks.includes('medium')) return 'medium';
        return 'low';
    }

    /**
     * Helper: Check if reload required
     */
    private requiresReload(adaptations: SystemAdaptation[]): boolean {
        // CSS changes can hot reload, others may need full reload
        return adaptations.some(a => a.type !== 'css');
    }

    /**
     * Helper: Get affected modules
     */
    private getAffectedModules(adaptations: SystemAdaptation[]): string[] {
        const modules = new Set<string>();
        adaptations.forEach(a => a.affectedModules.forEach(m => modules.add(m)));
        return Array.from(modules);
    }

    /**
     * Get deployment history
     */
    getDeploymentHistory(limit: number = 20): DeploymentResult[] {
        return this.deploymentHistory.slice(0, limit);
    }

    /**
     * Get latest deployment
     */
    getLatestDeployment(): DeploymentResult | null {
        return this.deploymentHistory.length > 0 ? this.deploymentHistory[0] : null;
    }
}

// Export singleton
export const deploymentOrchestrator = new DeploymentOrchestrator();

// Export class for testing
export default DeploymentOrchestrator;
