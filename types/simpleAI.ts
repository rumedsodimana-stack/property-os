/**
 * Simple AI Configuration
 * Four named AI agents sharing one API key, all available simultaneously:
 * Wal (System) · Don (Analytics) · Ali (Concierge) · Fred (Brand)
 */

export type AIAssistant = 'concierge' | 'system_ops' | 'automation' | 'analytics';
export type AIProvider = 'openai' | 'anthropic' | 'gemini';

/** Maps internal assistantId to the agent's display name */
export const AGENT_NAMES: Record<AIAssistant, string> = {
    system_ops: 'Wal',
    analytics:  'Don',
    concierge:  'Ali',
    automation: 'Fred',
};

export interface SimpleAIConfig {
    provider: AIProvider;
    apiKey: string; // ONE key for all agents
    model: string;
    enabled: boolean;
}

export interface AIAssistantInfo {
    id: AIAssistant;
    name: string;
    agentName: string;    // display name: Wal / Don / Ali / Fred
    description: string;
    icon: string;
    systemPrompt: string;
    color: string;
    colorClass: string;   // tailwind color class
}

// The 4 Named AI Agents
export const AI_ASSISTANTS: Record<AIAssistant, AIAssistantInfo> = {
    system_ops: {
        id: 'system_ops',
        name: 'Wal',
        agentName: 'Wal',
        description: 'System control, OS operations, code automation & infrastructure',
        icon: '🛡️',
        color: 'violet',
        colorClass: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
        systemPrompt: 'You are Wal — the System Agent of Hotel Singularity OS. You own system-level control, code modifications, workflow automation, night audit operations, and cross-module orchestration. Prioritize safe, reversible changes. For any executed action include a numbered Execution Log with action, target, and expected outcome.'
    },
    analytics: {
        id: 'analytics',
        name: 'Don',
        agentName: 'Don',
        description: 'Revenue intelligence, forecasting, BI queries & Oracle AI',
        icon: '📊',
        color: 'indigo',
        colorClass: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
        systemPrompt: 'You are Don — the Analytics Agent of Hotel Singularity OS. You own revenue management, BI reporting, forecasting, operational pulse analysis, and departmental intelligence (Events/F&B/Procurement/Finance). Lead with data and numbers. For implementation steps include a numbered Execution Log with action, target module, and projected impact.'
    },
    concierge: {
        id: 'concierge',
        name: 'Ali',
        agentName: 'Ali',
        description: 'Guest experience, VIP management & service dispatch',
        icon: '🛎️',
        color: 'sky',
        colorClass: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
        systemPrompt: 'You are Ali — the Concierge Agent of Hotel Singularity in Manama, Bahrain. You handle guest requests with warmth and luxury-grade precision. You dispatch services, manage VIP protocols, and resolve complaints with empathy. Always suggest Halal options for food. For any service dispatch include a numbered Execution Log with department, action, and ETA.'
    },
    automation: {
        id: 'automation',
        name: 'Fred',
        agentName: 'Fred',
        description: 'Brand compliance, UI/UX standards & visual identity',
        icon: '✨',
        color: 'amber',
        colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        systemPrompt: 'You are Fred — the Brand & Compliance Agent of Hotel Singularity OS. You enforce brand standards, UI/UX consistency, SOP compliance, and visual identity across every touchpoint. Flag non-compliance as Advisory | Warning | Critical. For any proposed change include a numbered Execution Log with target file, change type, and rollback plan.'
    },
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
