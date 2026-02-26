/**
 * Simple AI Configuration
 * Four AI assistants sharing one API key, all available simultaneously
 */

export type AIAssistant = 'concierge' | 'system_ops' | 'automation' | 'analytics';
export type AIProvider = 'openai' | 'anthropic' | 'gemini';

export interface SimpleAIConfig {
    provider: AIProvider;
    apiKey: string; // ONE key for all assistants
    model: string;
    enabled: boolean;
}

export interface AIAssistantInfo {
    id: AIAssistant;
    name: string;
    description: string;
    icon: string;
    systemPrompt: string;
    color: string;
}

// The 4 AI Assistants
export const AI_ASSISTANTS: Record<AIAssistant, AIAssistantInfo> = {
    concierge: {
        id: 'concierge',
        name: 'AI Concierge',
        description: 'Guest-facing assistant for reservations, dining, local recommendations',
        icon: '🤝',
        color: 'emerald',
        systemPrompt: 'You are a senior hotel concierge AI with 30+ years hospitality operations expertise and 35+ years software engineering discipline. Keep responses professional and brief. For any executed or proposed execution, include a numbered Execution Log with action, target system, and expected outcome.'
    },
    system_ops: {
        id: 'system_ops',
        name: 'AI System Ops',
        description: 'Brand standards analysis, system optimization, policy management',
        icon: '⚙️',
        color: 'violet',
        systemPrompt: 'You are a senior hotel operations and systems AI (30+ years hotel operations, 35+ years software engineering). Keep responses concise and professional. Prioritize safe, reversible changes. For any task execution, include a numbered Execution Log (action, target, expected outcome).'
    },
    automation: {
        id: 'automation',
        name: 'Automation AI',
        description: 'Pattern recognition, workflow optimization, efficiency suggestions',
        icon: '🤖',
        color: 'amber',
        systemPrompt: 'You are an automation specialist with senior hotel manager judgment and principal engineer rigor. Keep responses short and professional. Never risk system stability. For executed actions, include a numbered Execution Log step-by-step.'
    },
    analytics: {
        id: 'analytics',
        name: 'Analytics AI',
        description: 'Data analysis, reporting, insights, forecasting',
        icon: '📊',
        color: 'blue',
        systemPrompt: 'You are a senior hospitality analytics AI with executive and engineering depth. Keep communication concise and professional. For implementation steps or execution, provide a numbered Execution Log with action, target module, and expected outcome.'
    }
};

export interface ActionCard {
    id: string;
    type: 'critical' | 'warning' | 'info' | 'success';
    assistantId: 'concierge' | 'system_ops' | 'automation' | 'analytics';
    title: string;
    description: string;
    actionLabel: string;
    impact: string;
    executeData: {
        target: string;
        action: string;
        value: any;
    };
}
