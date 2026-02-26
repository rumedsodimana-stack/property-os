/**
 * Behavioral Analyzer
 * 
 * Observes staff interactions and operational patterns to identify
 * inefficiencies and suggest workflow optimizations.
 */

export interface UserInteraction {
    userId: string;
    module: string;
    action: string;
    timestamp: string;
    duration?: number; // milliseconds
    success: boolean;
    metadata?: Record<string, any>;
}

export interface BehavioralPattern {
    id: string;
    pattern: string;
    description: string;
    frequency: number;
    avgDuration: number;
    inefficiency?: {
        type: 'slow' | 'error_prone' | 'repetitive' | 'manual';
        severity: 'low' | 'medium' | 'high';
        suggestion: string;
    };
}

export interface WorkflowOptimization {
    id: string;
    targetModule: string;
    currentWorkflow: string;
    proposedWorkflow: string;
    expectedImprovement: string;
    confidence: number;
    basedOnInteractions: number;
}

class BehavioralAnalyzer {
    private interactions: UserInteraction[] = [];
    private patterns: Map<string, BehavioralPattern> = new Map();
    private readonly MAX_INTERACTIONS = 1000;

    /**
     * Log user interaction
     */
    logInteraction(interaction: UserInteraction): void {
        this.interactions.unshift(interaction);

        // Limit history
        if (this.interactions.length > this.MAX_INTERACTIONS) {
            this.interactions.pop();
        }

        // Analyze patterns periodically
        if (this.interactions.length % 100 === 0) {
            this.analyzePatterns();
        }
    }

    /**
     * Analyze interactions to find patterns
     */
    analyzePatterns(): void {
        console.log('[Behavioral Analyzer] Analyzing patterns from interactions...');

        // Group interactions by module and action
        const grouped = this.groupInteractions();

        // Identify patterns
        for (const [key, interactions] of Object.entries(grouped)) {
            const pattern = this.identifyPattern(key, interactions);
            if (pattern) {
                this.patterns.set(pattern.id, pattern);
            }
        }

        console.log(`[Behavioral Analyzer] Identified ${this.patterns.size} patterns`);
    }

    /**
     * Group interactions
     */
    private groupInteractions(): Record<string, UserInteraction[]> {
        const grouped: Record<string, UserInteraction[]> = {};

        for (const interaction of this.interactions) {
            const key = `${interaction.module}:${interaction.action}`;
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(interaction);
        }

        return grouped;
    }

    /**
     * Identify pattern from interactions
     */
    private identifyPattern(
        key: string,
        interactions: UserInteraction[]
    ): BehavioralPattern | null {
        if (interactions.length < 5) return null; // Need minimum data

        const [module, action] = key.split(':');

        // Calculate metrics
        const durations = interactions
            .filter(i => i.duration !== undefined)
            .map(i => i.duration!);

        const avgDuration = durations.length > 0
            ? durations.reduce((sum, d) => sum + d, 0) / durations.length
            : 0;

        const successRate = interactions.filter(i => i.success).length / interactions.length;

        // Detect inefficiencies
        let inefficiency: BehavioralPattern['inefficiency'];

        // Slow operations (>5 seconds)
        if (avgDuration > 5000) {
            inefficiency = {
                type: 'slow',
                severity: avgDuration > 10000 ? 'high' : 'medium',
                suggestion: `Optimize ${action} in ${module} - current avg: ${Math.round(avgDuration / 1000)}s`
            };
        }

        // Error-prone operations (<80% success rate)
        if (successRate < 0.8) {
            inefficiency = {
                type: 'error_prone',
                severity: successRate < 0.5 ? 'high' : successRate < 0.7 ? 'medium' : 'low',
                suggestion: `Add validation or guidance for ${action} - only ${Math.round(successRate * 100)}% success rate`
            };
        }

        // Repetitive actions (>50 times in history)
        if (interactions.length > 50) {
            inefficiency = {
                type: 'repetitive',
                severity: 'medium',
                suggestion: `Consider automating ${action} - performed ${interactions.length} times`
            };
        }

        return {
            id: `pattern_${module}_${action}`,
            pattern: key,
            description: `${action} in ${module}`,
            frequency: interactions.length,
            avgDuration,
            inefficiency
        };
    }

    /**
     * Get detected patterns
     */
    getPatterns(moduleId?: string): BehavioralPattern[] {
        const patterns = Array.from(this.patterns.values());

        return moduleId
            ? patterns.filter(p => p.pattern.startsWith(moduleId))
            : patterns;
    }

    /**
     * Get inefficiencies
     */
    getInefficiencies(
        minSeverity: 'low' | 'medium' | 'high' = 'low'
    ): BehavioralPattern[] {
        const severityLevels = { low: 0, medium: 1, high: 2 };
        const minLevel = severityLevels[minSeverity];

        return Array.from(this.patterns.values()).filter(
            p => p.inefficiency && severityLevels[p.inefficiency.severity] >= minLevel
        );
    }

    /**
     * Generate workflow optimizations
     */
    generateOptimizations(): WorkflowOptimization[] {
        const optimizations: WorkflowOptimization[] = [];
        const inefficiencies = this.getInefficiencies('medium');

        for (const pattern of inefficiencies) {
            const [module] = pattern.pattern.split(':');

            if (pattern.inefficiency?.type === 'slow') {
                optimizations.push({
                    id: `opt_${pattern.id}`,
                    targetModule: module,
                    currentWorkflow: `Manual ${pattern.description}`,
                    proposedWorkflow: `Automated ${pattern.description} with pre-filled defaults`,
                    expectedImprovement: `${Math.round((pattern.avgDuration / 2) / 1000)}s faster`,
                    confidence: 0.75,
                    basedOnInteractions: pattern.frequency
                });
            }

            if (pattern.inefficiency?.type === 'error_prone') {
                optimizations.push({
                    id: `opt_${pattern.id}`,
                    targetModule: module,
                    currentWorkflow: pattern.description,
                    proposedWorkflow: `${pattern.description} with validation and guided steps`,
                    expectedImprovement: `Reduce errors by 50%`,
                    confidence: 0.85,
                    basedOnInteractions: pattern.frequency
                });
            }

            if (pattern.inefficiency?.type === 'repetitive') {
                optimizations.push({
                    id: `opt_${pattern.id}`,
                    targetModule: module,
                    currentWorkflow: `Manual ${pattern.description}`,
                    proposedWorkflow: `Batch automation for ${pattern.description}`,
                    expectedImprovement: `Eliminate ${Math.round(pattern.frequency * 0.7)} manual actions`,
                    confidence: 0.70,
                    basedOnInteractions: pattern.frequency
                });
            }
        }

        return optimizations;
    }

    /**
     * Get interaction statistics
     */
    getStatistics(moduleId?: string): {
        totalInteractions: number;
        avgDuration: number;
        successRate: number;
        topActions: Array<{ action: string; count: number }>;
    } {
        const filtered = moduleId
            ? this.interactions.filter(i => i.module === moduleId)
            : this.interactions;

        const durations = filtered
            .filter(i => i.duration !== undefined)
            .map(i => i.duration!);

        const avgDuration = durations.length > 0
            ? durations.reduce((sum, d) => sum + d, 0) / durations.length
            : 0;

        const successCount = filtered.filter(i => i.success).length;
        const successRate = filtered.length > 0 ? successCount / filtered.length : 0;

        // Count actions
        const actionCounts: Record<string, number> = {};
        filtered.forEach(i => {
            actionCounts[i.action] = (actionCounts[i.action] || 0) + 1;
        });

        const topActions = Object.entries(actionCounts)
            .map(([action, count]) => ({ action, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        return {
            totalInteractions: filtered.length,
            avgDuration,
            successRate,
            topActions
        };
    }

    /**
     * Clear interaction history
     */
    clear(): void {
        this.interactions = [];
        this.patterns.clear();
        console.log('[Behavioral Analyzer] Cleared all data');
    }
}

// Export singleton
export const behavioralAnalyzer = new BehavioralAnalyzer();

// Export class for testing
export default BehavioralAnalyzer;
