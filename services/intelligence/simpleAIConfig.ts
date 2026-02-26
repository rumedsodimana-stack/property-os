/**
 * Simple AI Configuration Service
 * Single API key, 4 AI assistants available simultaneously
 */

import type { SimpleAIConfig, AIProvider } from '../../types/simpleAI';

class SimpleAIConfigService {
    private config: SimpleAIConfig = {
        provider: 'openai',
        apiKey: '',
        model: 'gpt-4',
        enabled: false
    };

    constructor() {
        this.loadFromStorage();
    }

    /**
     * Set AI configuration (one API key for all 4 assistants)
     */
    setConfig(provider: AIProvider, apiKey: string, model: string): void {
        this.config = {
            provider,
            apiKey: btoa(apiKey), // Basic encryption
            model,
            enabled: true
        };
        this.saveToStorage();
    }

    /**
     * Get current configuration
     */
    getConfig(): SimpleAIConfig {
        return {
            ...this.config,
            apiKey: this.config.apiKey ? atob(this.config.apiKey) : ''
        };
    }

    /**
     * Check if AI is enabled
     */
    isEnabled(): boolean {
        return this.config.enabled && this.config.apiKey !== '';
    }

    /**
     * Disable all AI assistants
     */
    disable(): void {
        this.config.enabled = false;
        this.saveToStorage();
    }

    /**
     * Enable all AI assistants
     */
    enable(): void {
        if (!this.config.apiKey) {
            throw new Error('API key required');
        }
        this.config.enabled = true;
        this.saveToStorage();
    }

    /**
     * Save to localStorage
     */
    private saveToStorage(): void {
        localStorage.setItem('simple_ai_config', JSON.stringify(this.config));
    }

    /**
     * Load from localStorage
     */
    private loadFromStorage(): void {
        const stored = localStorage.getItem('simple_ai_config');
        if (stored) {
            try {
                this.config = JSON.parse(stored);
            } catch (error) {
                console.error('Failed to load AI config:', error);
            }
        }
    }
}

export const simpleAIConfig = new SimpleAIConfigService();
export default SimpleAIConfigService;
