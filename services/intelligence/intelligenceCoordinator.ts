/**
 * Intelligence Coordinator
 * 
 * Cross-module intelligence that enables contextual adaptation.
 * Modules share knowledge and make coordinated decisions.
 */

import { BrandEvent, brandServiceBus } from '../brand/brandServiceBus';
import { moduleRegistry } from '../kernel/moduleRegistry';
import { behavioralAnalyzer } from './behavioralAnalyzer';

export interface ContextualAdaptation {
    trigger: string;
    context: Record<string, any>;
    coordinatedActions: Array<{
        module: string;
        action: string;
        reasoning: string;
    }>;
}

export interface ConflictResolution {
    conflictId: string;
    conflictingDirectives: any[];
    resolution: any;
    reasoning: string;
    confidence: number;
}

class IntelligenceCoordinator {
    private contextualRules: Map<string, ContextualAdaptation> = new Map();
    private knowledgeBase: Map<string, any> = new Map();

    constructor() {
        this.initializeContextualRules();
    }

    /**
     * Initialize contextual adaptation rules
     */
    private initializeContextualRules(): void {
        // Rule: Summer season → coordinated changes
        this.contextualRules.set('summer_season', {
            trigger: 'season_summer',
            context: { season: 'summer', months: [6, 7, 8] },
            coordinatedActions: [
                {
                    module: 'pos',
                    action: 'extend_outdoor_dining_hours',
                    reasoning: 'Summer guests prefer outdoor seating'
                },
                {
                    module: 'housekeeping',
                    action: 'increase_pool_cleaning_frequency',
                    reasoning: 'Higher pool usage in summer'
                },
                {
                    module: 'front_desk',
                    action: 'promote_beach_amenities',
                    reasoning: 'Seasonal amenity push'
                },
                {
                    module: 'ui_theme',
                    action: 'use_vibrant_summer_colors',
                    reasoning: 'Seasonal brand refresh'
                }
            ]
        });

        // Rule: High occupancy → resource optimization
        this.contextualRules.set('high_occupancy', {
            trigger: 'occupancy_above_85',
            context: { occupancy: '>85%' },
            coordinatedActions: [
                {
                    module: 'housekeeping',
                    action: 'prioritize_checkout_rooms',
                    reasoning: 'Need turnover for incoming guests'
                },
                {
                    module: 'front_desk',
                    action: 'expedite_check_in_process',
                    reasoning: 'Reduce lobby congestion'
                },
                {
                    module: 'pos',
                    action: 'increase_staff_coverage',
                    reasoning: 'Higher demand for F&B services'
                }
            ]
        });

        // Rule: VIP guest arrival → service elevation
        this.contextualRules.set('vip_arrival', {
            trigger: 'vip_guest_checkin',
            context: { guestType: 'VIP' },
            coordinatedActions: [
                {
                    module: 'front_desk',
                    action: 'assign_premium_room',
                    reasoning: 'VIP experience standard'
                },
                {
                    module: 'housekeeping',
                    action: 'add_welcome_amenities',
                    reasoning: 'VIP welcome package'
                },
                {
                    module: 'pos',
                    action: 'enable_room_charge_priority',
                    reasoning: 'Streamlined VIP billing'
                }
            ]
        });

        console.log(`[Intelligence Coordinator] Initialized ${this.contextualRules.size} contextual rules`);
    }

    /**
     * Analyze context and trigger coordinated adaptations
     */
    async analyzeContext(context: Record<string, any>): Promise<ContextualAdaptation[]> {
        const triggeredAdaptations: ContextualAdaptation[] = [];

        for (const [ruleId, rule] of this.contextualRules.entries()) {
            if (this.matchesContext(context, rule.context)) {
                triggeredAdaptations.push(rule);

                // Execute coordinated actions
                await this.executeCoordinatedActions(rule);
            }
        }

        return triggeredAdaptations;
    }

    /**
     * Check if context matches rule
     */
    private matchesContext(
        actualContext: Record<string, any>,
        ruleContext: Record<string, any>
    ): boolean {
        for (const [key, value] of Object.entries(ruleContext)) {
            if (actualContext[key] !== value) {
                return false;
            }
        }
        return true;
    }

    /**
     * Execute coordinated actions across modules
     */
    private async executeCoordinatedActions(adaptation: ContextualAdaptation): Promise<void> {
        console.log(`[Intelligence Coordinator] Executing coordinated adaptation: ${adaptation.trigger}`);

        for (const action of adaptation.coordinatedActions) {
            console.log(`  → ${action.module}: ${action.action} (${action.reasoning})`);

            // Publish event to specific module
            await brandServiceBus.publish({
                id: `coord_${Date.now()}`,
                type: 'workflow_updated',
                timestamp: new Date().toISOString(),
                source: 'intelligence_coordinator',
                data: {
                    action: action.action,
                    reasoning: action.reasoning,
                    context: adaptation.context
                },
                priority: 'high',
                affectedModules: [action.module]
            });
        }
    }

    /**
     * Resolve conflicts between directives
     */
    resolveConflict(
        directive1: any,
        directive2: any,
        context: Record<string, any>
    ): ConflictResolution {
        console.log('[Intelligence Coordinator] Resolving conflict...');

        // Priority rules for conflict resolution
        const priorities = {
            'safety': 100,
            'legal': 90,
            'brand': 80,
            'operational': 70,
            'preference': 60
        };

        // Determine priorities
        const priority1 = this.determinePriority(directive1);
        const priority2 = this.determinePriority(directive2);

        // Higher priority wins
        const resolution = priority1 >= priority2 ? directive1 : directive2;
        const winner = priority1 >= priority2 ? '1' : '2';

        return {
            conflictId: `conflict_${Date.now()}`,
            conflictingDirectives: [directive1, directive2],
            resolution,
            reasoning: `Directive ${winner} has higher priority (${priority1 >= priority2 ? priority1 : priority2} vs ${priority1 < priority2 ? priority1 : priority2})`,
            confidence: 0.90
        };
    }

    /**
     * Determine directive priority
     */
    private determinePriority(directive: any): number {
        // Simple heuristic - would be more sophisticated in production
        if (directive.category === 'safety' || directive.type === 'safety') return 100;
        if (directive.category === 'legal' || directive.type === 'legal') return 90;
        if (directive.category === 'brand' || directive.type === 'brand') return 80;
        if (directive.category === 'operational') return 70;
        return 60;
    }

    /**
     * Share knowledge between modules
     */
    shareKnowledge(sourceModule: string, knowledge: any): void {
        const key = `${sourceModule}_knowledge`;
        this.knowledgeBase.set(key, {
            ...knowledge,
            timestamp: new Date().toISOString()
        });

        console.log(`[Intelligence Coordinator] ${sourceModule} shared knowledge`);

        // Notify relevant modules
        this.notifyInterestedModules(sourceModule, knowledge);
    }

    /**
     * Notify modules that might benefit from knowledge
     */
    private notifyInterestedModules(sourceModule: string, knowledge: any): void {
        // In production, this would use ML to determine interested modules
        // For now, use simple rules

        if (knowledge.type === 'guest_preference') {
            // Share guest preferences with front desk and pos
            brandServiceBus.publish({
                id: `knowledge_${Date.now()}`,
                type: 'policy_updated',
                timestamp: new Date().toISOString(),
                source: 'intelligence_coordinator',
                data: knowledge,
                priority: 'low',
                affectedModules: ['front_desk', 'pos']
            });
        }
    }

    /**
     * Get module performance insights
     */
    getModuleInsights(moduleId: string): {
        efficiency: number;
        commonIssues: string[];
        suggestions: string[];
    } {
        const stats = behavioralAnalyzer.getStatistics(moduleId);
        const inefficiencies = behavioralAnalyzer.getInefficiencies('low')
            .filter(i => i.pattern.startsWith(moduleId));

        return {
            efficiency: stats.successRate,
            commonIssues: inefficiencies.map(i => i.inefficiency?.suggestion || ''),
            suggestions: [
                stats.avgDuration > 5000 ? 'Consider automation for slow operations' : '',
                stats.successRate < 0.8 ? 'Add validation to reduce errors' : ''
            ].filter(Boolean)
        };
    }

    /**
     * Recommend cross-module optimizations
     */
    recommendOptimizations(): Array<{
        optimization: string;
        affectedModules: string[];
        impact: string;
    }> {
        const recommendations = [];

        // Analysis based on behavioral patterns
        const patterns = behavioralAnalyzer.getPatterns();

        // Check for workflow overlaps
        const checkInPatterns = patterns.filter(p => p.pattern.includes('check_in'));
        if (checkInPatterns.length > 1) {
            recommendations.push({
                optimization: 'Consolidate check-in workflows',
                affectedModules: ['front_desk', 'pos'],
                impact: 'Reduce duplicate data entry, faster check-in'
            });
        }

        // Check for manual reporting
        const reportPatterns = patterns.filter(p =>
            p.pattern.includes('report') && p.frequency > 30
        );
        if (reportPatterns.length > 0) {
            recommendations.push({
                optimization: 'Automate daily reports',
                affectedModules: ['pos', 'housekeeping', 'front_desk'],
                impact: 'Save 30+ minutes daily per module'
            });
        }

        return recommendations;
    }

    /**
     * Get knowledge base
     */
    getKnowledgeBase(): Map<string, any> {
        return this.knowledgeBase;
    }
}

// Export singleton
export const intelligenceCoordinator = new IntelligenceCoordinator();

// Export class for testing
export default IntelligenceCoordinator;
