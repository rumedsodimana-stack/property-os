/**
 * Autonomous Brand Orchestrator
 * 
 * Coordinates the entire autonomous brand standards modification workflow
 * From document analysis to code generation to file modification
 */

import { aiProvider } from '../intelligence/aiProvider';
import { brandStandardsParser, BrandStandards } from './brandStandardsParser';
import { codeGenerator, FileChange } from './codeGenerator';
import { fileModifier, ApplyResult } from '../kernel/fileModifier';
import { brandServiceBus } from './brandServiceBus';
import { SystemAdaptation } from './brandStandardsAIService';

export interface AutonomousResult {
    success: boolean;
    standards: BrandStandards | null;
    changes: FileChange[];
    applyResult: ApplyResult | null;
    error?: string;
}

export class AutonomousBrandOrchestrator {
    /**
     * Full autonomous workflow: analyze → generate → apply
     */
    private pendingAdaptations: SystemAdaptation[] = [];

    /**
     * Get pending adaptations
     */
    getPendingAdaptations(): SystemAdaptation[] {
        return [...this.pendingAdaptations];
    }

    /**
     * Approve an adaptation
     */
    async approveAdaptation(adaptationId: string): Promise<boolean> {
        const adaptationIndex = this.pendingAdaptations.findIndex(a => a.id === adaptationId);

        if (adaptationIndex === -1) {
            console.error(`[Autonomous] Adaptation not found: ${adaptationId}`);
            return false;
        }

        const adaptation = this.pendingAdaptations[adaptationIndex];

        // Apply the adaptation
        const result = await this.applyAdaptation(adaptation);

        if (result.success) {
            // Remove from pending list
            this.pendingAdaptations.splice(adaptationIndex, 1);

            // Notify subscribers
            brandServiceBus.publish({
                id: `evt_${Date.now()}`,
                type: 'adaptation_deployed',
                timestamp: new Date().toISOString(),
                source: 'autonomous_orchestrator',
                data: { adaptationId, status: 'approved' },
                priority: 'high',
                affectedModules: adaptation.affectedModules
            });

            return true;
        }

        return false;
    }

    /**
     * Reject an adaptation
     */
    async rejectAdaptation(adaptationId: string): Promise<boolean> {
        const adaptationIndex = this.pendingAdaptations.findIndex(a => a.id === adaptationId);

        if (adaptationIndex === -1) {
            console.error(`[Autonomous] Adaptation not found: ${adaptationId}`);
            return false;
        }

        // Remove from pending list
        this.pendingAdaptations.splice(adaptationIndex, 1);

        // Notify subscribers (optional, but good for UI updates)
        brandServiceBus.publish({
            id: `evt_${Date.now()}`,
            type: 'all_changes', // generic update
            timestamp: new Date().toISOString(),
            source: 'autonomous_orchestrator',
            data: { adaptationId, status: 'rejected' },
            priority: 'low'
        });

        return true;
    }

    /**
     * Apply adaptation (Mocked implementation)
     */
    private async applyAdaptation(adaptation: SystemAdaptation): Promise<{ success: boolean; applyResult: ApplyResult | null }> {
        console.log(`[Autonomous] Applying adaptation: ${adaptation.id}`);
        return { success: true, applyResult: null };
    }

    /**
     * Full autonomous workflow: analyze → generate → apply
     */
    async processDocument(documentText: string, autoApply: boolean = false): Promise<AutonomousResult> {
        try {
            console.log('[Autonomous] Starting brand standards processing...');

            // Step 1: AI Analysis
            const aiResponse = await aiProvider.executeRequest(
                `Extract brand standards from this document and format them clearly:

${documentText}

Please extract:
- Brand name and tagline
- Colors (in #RRGGBB format)
- Fonts/typography  
- Operating hours (checkIn, checkOut in 24h format)
- Policies (cancellation, pets, etc.)

Format your response clearly with labels like "Primary Color: #XXXXX"`,
                {
                    provider: 'ollama',
                    model: 'llama3.2'
                }
            );

            console.log('[Autonomous] AI analysis complete');

            // Step 2: Parse AI output into structured standards
            const standards = brandStandardsParser.parseFromAIResponse(aiResponse.content);
            const validation = brandStandardsParser.validateStandards(standards);

            if (!validation.valid) {
                console.error('[Autonomous] Validation failed:', validation.errors);
                return {
                    success: false,
                    standards: null,
                    changes: [],
                    applyResult: null,
                    error: `Validation failed: ${validation.errors.join(', ')}`
                };
            }

            console.log('[Autonomous] Standards parsed and validated:', standards);

            // Step 3: Generate code changes
            const changes = this.generateChangesFromStandards(standards);
            console.log(`[Autonomous] Generated ${changes.length} file changes`);

            // Step 3b: Generate adaptations (using simplified logic for now, mirroring logic in brandStandardsAIService)
            // In a full implementation, this should likely call brandStandardsAIService.generateAdaptations
            // For now, let's create adaptations based on the changes

            const newAdaptations: SystemAdaptation[] = changes.map((change, index) => ({
                id: `adapt_${Date.now()}_${index}`,
                changeId: `change_${Date.now()}_${index}`,
                documentId: 'doc_imported', // This would come from the actual document object
                type: change.type === 'css' ? 'css' : 'config', // Simplified mapping
                targetFile: change.filePath,
                proposedChange: change.description,
                currentValue: 'Unknown',
                newValue: 'New Value',
                risk: 'medium',
                autoApply: false,
                rollbackPlan: 'Revert changes',
                affectedModules: ['all'],
                confidence: 0.9
            }));

            // Store pending adaptations
            this.pendingAdaptations.push(...newAdaptations);

            // Notify UI
            brandServiceBus.publish({
                id: `evt_${Date.now()}_new_adaptations`,
                type: 'all_changes',
                timestamp: new Date().toISOString(),
                source: 'autonomous_orchestrator',
                data: { count: newAdaptations.length, status: 'new_adaptations' },
                priority: 'medium'
            });

            // Step 4: Auto-apply if requested
            let applyResult: ApplyResult | null = null;

            if (autoApply) {
                console.log('[Autonomous] Auto-applying changes...');
                applyResult = await fileModifier.applyAndRefresh(
                    changes,
                    `Brand standards update: ${standards.identity.name || 'Unnamed'}`
                );

                // If auto-applied, clear them from pending
                // In reality, we'd mark them applied, but for this simple list we remove them to avoid duplication
                this.pendingAdaptations = this.pendingAdaptations.filter(pa =>
                    !newAdaptations.some(na => na.id === pa.id)
                );

                console.log(`[Autonomous] Applied ${applyResult.filesModified} changes`);
            }

            return {
                success: true,
                standards,
                changes,
                applyResult
            };

        } catch (error: any) {
            console.error('[Autonomous] Processing failed:', error);
            return {
                success: false,
                standards: null,
                changes: [],
                applyResult: null,
                error: error.message
            };
        }
    }

    /**
     * Generate file changes from brand standards
     */
    private generateChangesFromStandards(standards: BrandStandards): FileChange[] {
        const changes: FileChange[] = [];

        // CSS changes (colors + fonts)
        const cssContent = this.generateCSSContent(standards);
        changes.push({
            filePath: 'src/index.css',
            content: cssContent,
            type: 'css',
            description: 'Update brand colors and fonts'
        });

        // Brand theme config
        const themeConfig = this.generateThemeConfig(standards);
        changes.push({
            filePath: 'src/config/brandTheme.ts',
            content: themeConfig,
            type: 'typescript',
            description: 'Generate brand theme configuration'
        });

        // Operating hours config
        const hoursConfig = this.generateOperatingHoursConfig(standards);
        changes.push({
            filePath: 'src/config/operatingHours.ts',
            content: hoursConfig,
            type: 'typescript',
            description: 'Generate operating hours configuration'
        });

        return changes;
    }

    /**
     * Generate complete CSS content
     */
    private generateCSSContent(standards: BrandStandards): string {
        const lines: string[] = [
            '/* Auto-generated Brand Standards CSS */',
            `/* Generated: ${new Date().toLocaleString()} */`,
            '',
        ];

        // Font imports
        if (standards.typography.primaryFont && standards.typography.primaryFont !== 'Inter') {
            const fontName = standards.typography.primaryFont.replace(/\s+/g, '+');
            lines.push(`@import url('https://fonts.googleapis.com/css2?family=${fontName}:wght@300;400;500;600;700&display=swap');`);
            lines.push('');
        }

        // Root variables
        lines.push(':root {');

        // Colors
        lines.push('    /* Brand Colors */');
        if (standards.colors.primary) {
            lines.push(`    --color-primary: ${standards.colors.primary};`);
        }
        if (standards.colors.secondary) {
            lines.push(`    --color-secondary: ${standards.colors.secondary};`);
        }
        if (standards.colors.accent) {
            lines.push(`    --color-accent: ${standards.colors.accent};`);
        }

        lines.push('');

        // Typography
        lines.push('    /* Typography */');
        if (standards.typography.primaryFont) {
            lines.push(`    --font-primary: '${standards.typography.primaryFont}', sans-serif;`);
        }
        if (standards.typography.secondaryFont) {
            lines.push(`    --font-secondary: '${standards.typography.secondaryFont}', sans-serif;`);
        }

        lines.push('}');
        lines.push('');

        // Add existing CSS (simplified for demo)
        lines.push('/* Existing styles would be preserved here */');

        return lines.join('\n');
    }

    /**
     * Generate theme config TypeScript
     */
    private generateThemeConfig(standards: BrandStandards): string {
        return `/**
 * Brand Theme Configuration
 * Auto-generated from brand standards
 * Generated: ${new Date().toLocaleString()}
 */

export interface BrandTheme {
    identity: {
        name?: string;
        tagline?: string;
    };
    colors: {
        primary: string;
        secondary?: string;
        accent?: string;
    };
    typography: {
        primaryFont: string;
        secondaryFont?: string;
    };
}

export const brandTheme: BrandTheme = ${JSON.stringify(standards, null, 4)};

export default brandTheme;
`;
    }

    /**
     * Generate operating hours config TypeScript
     */
    private generateOperatingHoursConfig(standards: BrandStandards): string {
        return `/**
 * Operating Hours Configuration
 * Auto-generated from brand standards
 * Generated: ${new Date().toLocaleString()}
 */

export interface OperatingHours {
    checkIn: string;
    checkOut: string;
    reception?: { open: string; close: string };
}

export const operatingHours: OperatingHours = ${JSON.stringify(standards.operatingHours, null, 4)};

export default operatingHours;
`;
    }

    /**
     * Preview changes without applying
     */
    async previewChanges(documentText: string): Promise<{
        standards: BrandStandards | null;
        changes: FileChange[];
        preview: any;
    }> {
        const result = await this.processDocument(documentText, false);

        return {
            standards: result.standards,
            changes: result.changes,
            preview: result.standards ? {
                colors: {
                    before: 'Current colors',
                    after: result.standards.colors
                },
                fonts: {
                    before: 'Inter',
                    after: result.standards.typography.primaryFont
                },
                hours: {
                    before: 'Check-in: 14:00, Check-out: 11:00',
                    after: `Check-in: ${result.standards.operatingHours.checkIn}, Check-out: ${result.standards.operatingHours.checkOut}`
                }
            } : null
        };
    }

    /**
     * Rollback to previous version
     */
    async rollback(backupId: string): Promise<boolean> {
        const success = await fileModifier.rollback(backupId);

        if (success) {
            // Trigger refresh
            fileModifier['reloadCSS']();
            window.dispatchEvent(new CustomEvent('brand:rollback', {
                detail: { backupId }
            }));
        }

        return success;
    }

    /**
     * Get backup history
     */
    getBackupHistory() {
        return fileModifier.getBackups();
    }
}

// Export singleton instance
export const autonomousBrandOrchestrator = new AutonomousBrandOrchestrator();
