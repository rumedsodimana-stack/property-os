/**
 * Agent Service — Hotel Singularity OS
 * Manages AI agent definitions, CRUD, and role linking via Firestore.
 */

import {
    subscribeToItems, addItem, updateItem, deleteItem, fetchItems
} from '../kernel/firestoreService';
import { composeOperatingPrompt } from './aiOperatingCharter';

export interface AgentCapability {
    id: string;
    label: string;
    description: string;
}

export interface AgentDefinition {
    id: string;
    name: string;
    description: string;
    department: string;
    /** Linked job description ID (if role-specific) */
    linkedJobDescriptionId?: string;
    linkedJobTitle?: string;
    provider: 'anthropic' | 'openai' | 'gemini' | 'ollama';
    model: string;
    systemPrompt: string;
    capabilities: string[];
    isDefault: boolean;
    isActive: boolean;
    avatar: string;  // emoji
    color: string;   // tailwind color key
    createdAt: number;
    lastActiveAt?: number;
    requestCount: number;
}

export const DEFAULT_AGENTS: Omit<AgentDefinition, 'id'>[] = [
    {
        name: 'Concierge AI',
        description: 'Handles guest requests, local recommendations, and service dispatch.',
        department: 'Front Office',
        provider: 'anthropic',
        model: 'claude-3-haiku-20240307',
        systemPrompt: composeOperatingPrompt(`You are the AI Concierge for Hotel Singularity OS. You handle guest requests with warmth and precision. You can dispatch housekeeping, arrange dining reservations, provide local recommendations, and process service requests. Always be professional, empathetic, and solution-oriented. Respond concisely.`),
        capabilities: ['guest-requests', 'service-dispatch', 'recommendations', 'reservations'],
        isDefault: true,
        isActive: true,
        avatar: '🛎️',
        color: 'violet',
        createdAt: Date.now(),
        requestCount: 0,
    },
    {
        name: 'Front Desk AI',
        description: 'Manages check-ins, check-outs, room assignments, and billing.',
        department: 'Front Office',
        provider: 'anthropic',
        model: 'claude-3-haiku-20240307',
        systemPrompt: composeOperatingPrompt(`You are the Front Desk AI Agent for Hotel Singularity OS. You assist with check-in and check-out procedures, room assignment decisions, billing inquiries, and reservation management. You have access to PMS data and can suggest optimal room assignments based on guest preferences and availability. Be efficient and accurate.`),
        capabilities: ['check-in', 'check-out', 'billing', 'room-assignment'],
        isDefault: true,
        isActive: true,
        avatar: '🏨',
        color: 'sky',
        createdAt: Date.now(),
        requestCount: 0,
    },
    {
        name: 'Housekeeping AI',
        description: 'Optimizes room cleaning schedules, tracks tasks, and manages staff allocation.',
        department: 'Housekeeping',
        provider: 'anthropic',
        model: 'claude-3-haiku-20240307',
        systemPrompt: composeOperatingPrompt(`You are the Housekeeping AI Agent for Hotel Singularity OS. You optimize cleaning schedules, prioritize rooms based on departures and arrivals, manage task assignments for housekeeping staff, and track room status updates. Focus on efficiency, quality standards, and timely turnaround.`),
        capabilities: ['scheduling', 'task-management', 'room-status', 'quality-control'],
        isDefault: true,
        isActive: true,
        avatar: '🧹',
        color: 'emerald',
        createdAt: Date.now(),
        requestCount: 0,
    },
    {
        name: 'F&B Operations AI',
        description: 'Manages POS intelligence, menu engineering, and service optimization.',
        department: 'F&B',
        provider: 'anthropic',
        model: 'claude-3-haiku-20240307',
        systemPrompt: composeOperatingPrompt(`You are the Food & Beverage AI Agent for Hotel Singularity OS. You analyze POS data for menu engineering insights, optimize table management, assist with inventory decisions, and provide recommendations for F&B operations. You understand restaurant and bar operations at a professional level.`),
        capabilities: ['menu-engineering', 'inventory', 'pos-analysis', 'table-management'],
        isDefault: true,
        isActive: true,
        avatar: '🍽️',
        color: 'amber',
        createdAt: Date.now(),
        requestCount: 0,
    },
    {
        name: 'HR & People AI',
        description: 'Assists with talent management, scheduling, and HR analytics.',
        department: 'HR',
        provider: 'anthropic',
        model: 'claude-3-haiku-20240307',
        systemPrompt: composeOperatingPrompt(`You are the HR AI Agent for Hotel Singularity OS. You assist with staff scheduling optimization, performance analysis, leave management, hiring recommendations, and HR compliance. You understand hospitality HR best practices and labor regulations. Be professional and confidential.`),
        capabilities: ['scheduling', 'performance-analysis', 'hiring', 'compliance'],
        isDefault: true,
        isActive: true,
        avatar: '👥',
        color: 'rose',
        createdAt: Date.now(),
        requestCount: 0,
    },
    {
        name: 'Revenue Intelligence AI',
        description: 'Drives yield management, rate optimization, and revenue forecasting.',
        department: 'Finance',
        provider: 'anthropic',
        model: 'claude-3-haiku-20240307',
        systemPrompt: composeOperatingPrompt(`You are the Revenue Intelligence AI Agent for Hotel Singularity OS. You analyze occupancy patterns, competitor rates, and market conditions to recommend dynamic pricing strategies. You assist with revenue forecasting, yield management decisions, and OTA channel optimization. Base recommendations on data-driven insights.`),
        capabilities: ['yield-management', 'rate-optimization', 'forecasting', 'channel-management'],
        isDefault: true,
        isActive: true,
        avatar: '📈',
        color: 'indigo',
        createdAt: Date.now(),
        requestCount: 0,
    },
];

export const ALL_CAPABILITIES: AgentCapability[] = [
    { id: 'guest-requests', label: 'Guest Requests', description: 'Handle and dispatch guest service requests' },
    { id: 'service-dispatch', label: 'Service Dispatch', description: 'Route tasks to relevant departments' },
    { id: 'recommendations', label: 'Recommendations', description: 'Provide local and in-house recommendations' },
    { id: 'reservations', label: 'Reservations', description: 'Manage dining and activity bookings' },
    { id: 'check-in', label: 'Check-In', description: 'Assist with guest check-in process' },
    { id: 'check-out', label: 'Check-Out', description: 'Manage departures and billing' },
    { id: 'billing', label: 'Billing', description: 'Handle folio and billing inquiries' },
    { id: 'room-assignment', label: 'Room Assignment', description: 'Optimize room allocation decisions' },
    { id: 'scheduling', label: 'Scheduling', description: 'Manage staff and task schedules' },
    { id: 'task-management', label: 'Task Management', description: 'Create, assign, and track operational tasks' },
    { id: 'room-status', label: 'Room Status', description: 'Track and update room cleanliness status' },
    { id: 'quality-control', label: 'Quality Control', description: 'Enforce brand and quality standards' },
    { id: 'menu-engineering', label: 'Menu Engineering', description: 'Analyze and optimize F&B menus' },
    { id: 'inventory', label: 'Inventory', description: 'Monitor and manage stock levels' },
    { id: 'pos-analysis', label: 'POS Analysis', description: 'Analyze point-of-sale data for insights' },
    { id: 'table-management', label: 'Table Management', description: 'Optimize seating and reservations' },
    { id: 'performance-analysis', label: 'Performance Analysis', description: 'Evaluate staff KPIs and metrics' },
    { id: 'hiring', label: 'Hiring Support', description: 'Screen candidates and suggest hiring decisions' },
    { id: 'compliance', label: 'Compliance', description: 'Ensure labor and HR regulatory compliance' },
    { id: 'yield-management', label: 'Yield Management', description: 'Dynamic pricing and occupancy optimization' },
    { id: 'rate-optimization', label: 'Rate Optimization', description: 'Optimize room rates based on demand' },
    { id: 'forecasting', label: 'Forecasting', description: 'Revenue and occupancy forecasting' },
    { id: 'channel-management', label: 'Channel Management', description: 'OTA and distribution channel optimization' },
    { id: 'brand-analysis', label: 'Brand Analysis', description: 'Analyze and enforce brand standards' },
    { id: 'reporting', label: 'Reporting', description: 'Generate operational and financial reports' },
];

class AgentService {
    private seeded = false;

    /** Subscribe to all agents in real time */
    subscribe(callback: (agents: AgentDefinition[]) => void): () => void {
        return subscribeToItems<AgentDefinition>('ai_agents', callback);
    }

    /** Get all agents once */
    async getAll(): Promise<AgentDefinition[]> {
        return fetchItems<AgentDefinition>('ai_agents');
    }

    /** Create a new agent */
    async create(agent: Omit<AgentDefinition, 'id'>): Promise<void> {
        await addItem('ai_agents', agent);
    }

    /** Update an existing agent */
    async update(agentId: string, updates: Partial<AgentDefinition>): Promise<void> {
        await updateItem('ai_agents', agentId, updates);
    }

    /** Delete an agent */
    async delete(agentId: string): Promise<void> {
        await deleteItem('ai_agents', agentId);
    }

    /** Seed default agents if none exist */
    async seedDefaults(): Promise<void> {
        if (this.seeded) return;
        this.seeded = true;
        try {
            const existing = await this.getAll();
            if (existing.length === 0) {
                for (const agent of DEFAULT_AGENTS) {
                    await addItem('ai_agents', agent);
                }
                console.log('[AgentService] Seeded default AI agents');
            } else {
                // AUTO-REPAIR: If invalid model names (claude-sonnet-4-6) are found in existing data, fix them!
                console.log('[AgentService] Checking for neural model anomalies...');
                for (const agent of existing) {
                    if (agent.model === 'claude-sonnet-4-6' || !agent.model) {
                        console.log(`[AgentService] Repairing model name for agent: ${agent.name}`);
                        await this.update(agent.id, { model: 'claude-3-5-sonnet-20241022' });
                    }
                    if (!agent.systemPrompt?.includes('Execution Log')) {
                        await this.update(agent.id, { systemPrompt: composeOperatingPrompt(agent.systemPrompt || '') });
                    }
                }
            }
        } catch (err) {
            console.warn('[AgentService] Could not seed/repair defaults:', err);
        }
    }

    /** Build a system prompt for a job description */
    buildRolePrompt(jobTitle: string, department: string, capabilities: string[]): string {
        const capList = capabilities.map(c => {
            const cap = ALL_CAPABILITIES.find(a => a.id === c);
            return cap ? `- ${cap.label}: ${cap.description}` : `- ${c}`;
        }).join('\n');

        return composeOperatingPrompt(`You are the AI Agent for the ${jobTitle} role in the ${department} department at Hotel Singularity OS.

Your core capabilities include:
${capList}

You assist the ${jobTitle} by providing intelligent recommendations, automating routine tasks, and surfacing actionable insights specific to this role. Always be professional, concise, and operationally focused. Prioritize guest satisfaction and operational efficiency.`);
    }
}

export const agentService = new AgentService();
export default AgentService;
