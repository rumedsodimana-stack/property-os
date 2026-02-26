/**
 * AI Configuration Service - Four-Tier AI Governance System
 * Manages AI configurations, permissions, and tier-based access control
 */

import type {
    AIConfiguration,
    AITier,
    AIProvider,
    TierPermissions,
    CONCIERGE_PERMISSIONS,
    SYSTEM_OPS_PERMISSIONS,
    AUTOMATION_PERMISSIONS,
    ANALYTICS_PERMISSIONS
} from '../../types/ai';
import {
    CONCIERGE_PERMISSIONS as CONCIERGE_PERMS,
    SYSTEM_OPS_PERMISSIONS as SYSTEM_OPS_PERMS,
    AUTOMATION_PERMISSIONS as AUTOMATION_PERMS,
    ANALYTICS_PERMISSIONS as ANALYTICS_PERMS
} from '../../types/ai';

class AIConfigurationService {
    private configurations: Map<AITier, AIConfiguration> = new Map();
    private encryptionKey: string = 'hotel-singularity-ai-key'; //In production, use proper encryption

    /** Safely read env vars across Vite (import.meta.env) and Node (process.env) */
    private getEnv(key: string): string {
        try {
            // @ts-ignore
            if (import.meta && import.meta.env && import.meta.env[key]) {
                // @ts-ignore
                return import.meta.env[key];
            }
        } catch { }
        try {
            if (typeof process !== 'undefined' && process.env && process.env[key]) {
                return process.env[key] as string;
            }
        } catch { }
        return '';
    }

    constructor() {
        this.initializeDefaultConfigurations();
    }

    /**
     * Initialize default configurations for all AI tiers
     */
    private initializeDefaultConfigurations(): void {
        // Load from localStorage if available
        const stored = localStorage.getItem('ai_configurations');
        if (stored) {
            try {
                const configs = JSON.parse(stored);
                let needsRepair = false;

                Object.entries(configs).forEach(([tier, config]: [string, any]) => {
                    // Repair invalid model names in localStorage
                    if (config.model === 'claude-sonnet-4-6' || !config.model) {
                        console.log(`[AI Config] Repairing model for tier ${tier}: ${config.model} -> claude-3-5-sonnet-20241022`);
                        config.model = 'claude-3-5-sonnet-20241022';
                        needsRepair = true;
                    }
                    this.configurations.set(tier as AITier, config as AIConfiguration);
                });

                if (needsRepair) {
                    this.saveToStorage();
                    console.log('[AI Config] Repaired and persisted configurations');
                } else {
                    console.log('[AI Config] Loaded configurations from storage');
                }
                return;
            } catch (error) {
                console.error('[AI Config] Failed to load/repair stored configs:', error);
            }
        }

        // Create default configurations
        this.createDefaultConfiguration('concierge');
        this.createDefaultConfiguration('system_ops');
        this.createDefaultConfiguration('automation');
        this.createDefaultConfiguration('analytics');

        // Auto-enable Anthropic tiers if the API key is available in environment
        this.autoEnableFromEnvironment();

        console.log('[AI Config] Initialized default configurations');
    }

    /**
     * Create default configuration for a tier
     */
    private createDefaultConfiguration(tier: AITier): void {
        const defaultProviders: Record<AITier, { provider: AIProvider; model: string }> = {
            concierge: { provider: 'ollama', model: 'llama3.2' },
            system_ops: { provider: 'anthropic', model: 'claude-3-haiku-20240307' },
            automation: { provider: 'anthropic', model: 'claude-3-haiku-20240307' },
            analytics: { provider: 'gemini', model: 'gemini-pro' }
        };

        const { provider, model } = defaultProviders[tier];
        const permissions = this.getDefaultPermissions(tier);

        const config: AIConfiguration = {
            id: `ai-config-${tier}-${Date.now()}`,
            tier,
            enabled: false, // Disabled by default until API keys are set
            provider,
            model,
            apiKey: '', // Empty until configured
            settings: {
                temperature: 0.7,
                maxTokens: tier === 'analytics' ? 4000 : tier === 'concierge' ? 500 : 2000,
                systemPrompt: this.getDefaultSystemPrompt(tier),
                rateLimit: {
                    requestsPerHour: permissions.rateLimits?.requestsPerHour || 100,
                    tokensPerDay: permissions.rateLimits?.tokensPerDay || 100000
                },
                costLimit: {
                    dailyBudget: tier === 'concierge' ? 0 : tier === 'analytics' ? 0 : 10,
                    alertThreshold: 0.8
                }
            },
            permissions: {
                dataAccess: permissions.allowedOperations,
                writeAccess: tier === 'system_ops',
                requiresApproval: permissions.approvalRequired || false,
                allowedOperations: permissions.allowedOperations
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'system'
        };

        this.configurations.set(tier, config);
    }

    /**
     * Auto-enable tiers based on available environment API keys.
     * Called once on startup so the system works out of the box.
     */
    private autoEnableFromEnvironment(): void {
        const anthropicKey = this.getEnv('VITE_ANTHROPIC_API_KEY');
        const geminiKey = this.getEnv('VITE_GEMINI_API_KEY');

        if (anthropicKey) {
            // Inject key & enable tiers that use Anthropic
            const encodedKey = btoa(anthropicKey);
            (['system_ops', 'automation'] as AITier[]).forEach(tier => {
                const config = this.configurations.get(tier);
                if (config && config.provider === 'anthropic') {
                    this.configurations.set(tier, {
                        ...config,
                        apiKey: encodedKey,
                        enabled: true,
                        updatedAt: new Date().toISOString()
                    });
                    console.log(`[AI Config] Auto-enabled ${tier} tier with Anthropic key from environment`);
                }
            });
        }

        if (geminiKey) {
            const config = this.configurations.get('analytics');
            if (config && config.provider === 'gemini') {
                this.configurations.set('analytics', {
                    ...config,
                    apiKey: btoa(geminiKey),
                    enabled: true,
                    updatedAt: new Date().toISOString()
                });
                console.log('[AI Config] Auto-enabled analytics tier with Gemini key from environment');
            }
        }

        // Persist the auto-enabled state
        this.saveToStorage();
    }

    /**
     * Get default permissions for a tier
     */
    private getDefaultPermissions(tier: AITier): TierPermissions {
        const permissionsMap: Record<AITier, TierPermissions> = {
            concierge: CONCIERGE_PERMS,
            system_ops: SYSTEM_OPS_PERMS,
            automation: AUTOMATION_PERMS,
            analytics: ANALYTICS_PERMS
        };
        return permissionsMap[tier];
    }

    /**
     * Get default system prompt for a tier
     */
    private getDefaultSystemPrompt(tier: AITier): string {
        const prompts: Record<AITier, string> = {
            concierge: `You are a helpful hotel concierge AI assistant. You help guests with:
- Hotel information and amenities
- Local recommendations (restaurants, attractions, transportation)
- Explaining billing and charges
- Room service and spa bookings

You are friendly, professional, and multilingual. You CANNOT modify reservations, access other guests' data, or process payments. If a guest needs these services, politely direct them to the front desk.`,

            system_ops: `You are an AI System Operations assistant for Hotel Singularity OS. Your role is to:
- Analyze brand standards documents and propose system updates
- Identify policy changes and their impacts
- Generate comprehensive proposals with impact analysis
- Ensure all changes align with brand guidelines

You MUST create detailed proposals for ANY system change. You CANNOT execute changes without Director Board approval. Always provide rollback plans and risk assessments.`,

            automation: `You are an AI Automation Learning Engine for hotel operations. Your role is to:
- Observe operational patterns across departments
- Identify optimization opportunities
- Suggest workflow improvements with confidence scores
- Learn from staff feedback

You analyze housekeeping, front desk, F&B, and revenue data. You CANNOT execute changes directly - only suggest them with detailed impact analysis. Maintain 85%+ confidence before suggesting.`,

            analytics: `You are an AI Analytics Engine for hotel business intelligence. Your role is to:
- Generate executive dashboards and KPI tracking
- Analyze trends in revenue, occupancy, and satisfaction
- Create predictive forecasts
- Provide actionable insights

You are READ-ONLY. You analyze data and create reports but CANNOT modify any system data. Anonymize PII in all reports.`
        };
        return prompts[tier];
    }

    /**
     * Get configuration for a specific tier
     */
    getConfiguration(tier: AITier): AIConfiguration | null {
        return this.configurations.get(tier) || null;
    }

    /**
     * Get all configurations
     */
    getAllConfigurations(): AIConfiguration[] {
        return Array.from(this.configurations.values());
    }

    /**
     * Update configuration for a tier
     */
    updateConfiguration(tier: AITier, updates: Partial<AIConfiguration>): void {
        const current = this.configurations.get(tier);
        if (!current) {
            throw new Error(`No configuration found for tier: ${tier}`);
        }

        const updated: AIConfiguration = {
            ...current,
            ...updates,
            updatedAt: new Date().toISOString()
        };

        // Validate API key if changed
        if (updates.apiKey && updates.apiKey !== current.apiKey) {
            updated.apiKey = this.encryptAPIKey(updates.apiKey);
        }

        this.configurations.set(tier, updated);
        this.saveToStorage();

        console.log(`[AI Config] Updated configuration for ${tier}`);
    }

    /**
     * Enable a tier (requires API key to be set)
     */
    enableTier(tier: AITier): boolean {
        const config = this.configurations.get(tier);
        if (!config) return false;

        // Allow enabling for free providers without API key
        const freeProviders = ['ollama', 'gemini'];
        const isFree = freeProviders.includes(config.provider);

        if (!isFree && !config.apiKey) {
            console.warn(`[AI Config] Cannot enable ${tier}: API key not set`);
            return false;
        }

        this.updateConfiguration(tier, { enabled: true });
        console.log(`[AI Config] Enabled ${tier}`);
        return true;
    }

    /**
     * Disable a tier
     */
    disableTier(tier: AITier): void {
        this.updateConfiguration(tier, { enabled: false });
        console.log(`[AI Config] Disabled ${tier}`);
    }

    /**
     * Check if a tier is enabled
     */
    isTierEnabled(tier: AITier): boolean {
        const config = this.configurations.get(tier);
        return config?.enabled || false;
    }

    /**
     * Set API key for a tier
     */
    setAPIKey(tier: AITier, apiKey: string): void {
        const config = this.configurations.get(tier);
        if (!config) {
            throw new Error(`No configuration found for tier: ${tier}`);
        }

        this.updateConfiguration(tier, {
            apiKey: this.encryptAPIKey(apiKey)
        });

        console.log(`[AI Config] API key set for ${tier}`);
    }

    /**
     * Get decrypted API key for a tier
     */
    getAPIKey(tier: AITier): string {
        const config = this.configurations.get(tier);
        if (!config || !config.apiKey) return '';
        return this.decryptAPIKey(config.apiKey);
    }

    /**
     * Simple encryption (in production, use proper encryption)
     */
    private encryptAPIKey(apiKey: string): string {
        // In production, use crypto.subtle or a proper encryption library
        return btoa(apiKey);
    }

    /**
     * Simple decryption (in production, use proper decryption)
     */
    private decryptAPIKey(encrypted: string): string {
        try {
            return atob(encrypted);
        } catch {
            return '';
        }
    }

    /**
     * Check if operation is allowed for a tier
     */
    isOperationAllowed(tier: AITier, operation: string): boolean {
        const config = this.configurations.get(tier);
        if (!config) return false;

        return config.permissions.allowedOperations.includes(operation);
    }

    /**
     * Check if tier requires approval for operations
     */
    requiresApproval(tier: AITier): boolean {
        const config = this.configurations.get(tier);
        return config?.permissions.requiresApproval || false;
    }

    /**
     * Save configurations to localStorage
     */
    private saveToStorage(): void {
        const configs = Object.fromEntries(this.configurations);
        localStorage.setItem('ai_configurations', JSON.stringify(configs));
    }

    /**
     * Test connection for a tier
     */
    async testConnection(tier: AITier): Promise<{ success: boolean; message: string }> {
        const config = this.configurations.get(tier);
        if (!config) {
            return { success: false, message: 'Configuration not found' };
        }

        if (!config.enabled) {
            return { success: false, message: 'Tier not enabled' };
        }

        // For free providers
        if (config.provider === 'ollama') {
            try {
                const response = await fetch('http://localhost:11434/api/tags');
                if (response.ok) {
                    return { success: true, message: 'Ollama connection successful' };
                }
                return { success: false, message: 'Ollama not running. Start with: ollama serve' };
            } catch {
                return { success: false, message: 'Cannot connect to Ollama' };
            }
        }

        // For API-based providers, check if API key is set
        if (!config.apiKey) {
            return { success: false, message: 'API key not set' };
        }

        return { success: true, message: `${config.provider} configured (API key set)` };
    }

    /**
     * Get recommended setup based on property size
     */
    getRecommendedSetup(propertySize: 'small' | 'medium' | 'large' = 'medium'): Record<AITier, { provider: AIProvider; model: string; rationale: string }> {
        // Budget setup (recommended for all sizes)
        return {
            concierge: {
                provider: 'ollama',
                model: 'llama3.2',
                rationale: 'FREE, fast, perfect for guest conversations'
            },
            system_ops: {
                provider: 'anthropic',
                model: 'claude-3-5-sonnet-20241022',
                rationale: 'Best reasoning for critical decisions, 70% cheaper than GPT-4'
            },
            automation: {
                provider: 'anthropic',
                model: 'claude-3-5-sonnet-20241022',
                rationale: 'Deep analysis for learning patterns, weekly runs only'
            },
            analytics: {
                provider: 'gemini',
                model: 'gemini-pro',
                rationale: 'FREE with rate limits, perfect for daily reports'
            }
        };
    }

    /**
     * Apply recommended setup
     */
    applyRecommendedSetup(): void {
        const recommendations = this.getRecommendedSetup();

        Object.entries(recommendations).forEach(([tier, { provider, model }]) => {
            this.updateConfiguration(tier as AITier, {
                provider: provider as AIProvider,
                model
            });
        });

        this.saveToStorage();
        console.log('[AI Config] Applied recommended setup');
    }

    /**
     * Get configuration summary for UI display
     */
    getConfigurationSummary() {
        const configs = this.getAllConfigurations();

        return {
            total: configs.length,
            enabled: configs.filter(c => c.enabled).length,
            disabled: configs.filter(c => !c.enabled).length,
            byProvider: configs.reduce((acc, c) => {
                acc[c.provider] = (acc[c.provider] || 0) + 1;
                return acc;
            }, {} as Record<AIProvider, number>),
            estimatedMonthlyCost: this.calculateEstimatedCost()
        };
    }

    /**
     * Calculate estimated monthly cost
     */
    private calculateEstimatedCost(): number {
        const configs = this.getAllConfigurations();
        let total = 0;

        configs.forEach(config => {
            if (!config.enabled) return;

            // Rough estimates (in USD/month)
            const costEstimates: Record<string, number> = {
                'ollama': 0,
                'gemini:gemini-pro': 0,
                'openai:gpt-3.5-turbo': 5,
                'openai:gpt-4': 40,
                'openai:gpt-4-turbo': 14,
                'anthropic:claude-3-haiku': 3,
                'anthropic:claude-3-5-sonnet-20241022': 15,
                'anthropic:claude-3-opus-20240229': 8
            };

            const key = `${config.provider}:${config.model}`;
            total += costEstimates[key] || costEstimates[config.provider] || 0;
        });

        return total;
    }
}

// Singleton instance
export const aiConfigService = new AIConfigurationService();
export default AIConfigurationService;
