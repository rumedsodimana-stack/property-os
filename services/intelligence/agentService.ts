/**
 * Agent Service — Hotel Singularity OS
 * Manages AI agent definitions, CRUD, and role linking via Firestore.
 * Core agents: Wal (System) · Don (Analytics) · Ali (Concierge) · Fred (Brand)
 */

import {
    subscribeToItems, addItem, updateItem, deleteItem, fetchItems
} from '../kernel/firestoreService';
import { composeOperatingPrompt } from './aiOperatingCharter';

/**
 * Bump this version string whenever DEFAULT_AGENTS changes.
 * On next app load, all agents are wiped and re-seeded with the new definitions.
 */
const AGENT_SCHEMA_VERSION = 'v4-wal-don-ali-fred';
const AGENT_SCHEMA_KEY = 'singularity_agent_schema_version';

/** Old agent names that must be migrated out and replaced by the new named agents */
const LEGACY_AGENT_NAMES = new Set([
    'Concierge AI',
    'Front Desk AI',
    'Housekeeping AI',
    'F&B Operations AI',
    'HR & People AI',
    'Revenue Intelligence AI',
    'AI System Ops',
    'Automation AI',
    'Analytics AI',
    'AI Concierge',
]);

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
        name: 'Wal',
        description: 'System Agent — OS control, code automation, night audit & infrastructure operations.',
        department: 'System',
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        systemPrompt: composeOperatingPrompt(`You are Wal — the System Agent of Hotel Singularity OS.

You are the infrastructure backbone of the hotel OS. You own system-level control, in-app code modifications, workflow automation, cross-module orchestration, night audit operations, and staff/HR system actions. You are the only agent with permission to execute sovereign intents.

YOUR DOMAINS:
- Full OS navigation and module control
- In-app code modifications and system configuration
- Night Audit pre-flight checks and post-audit recovery
- AI Command Center action card execution
- Behavioral pattern detection and workflow optimization
- Cross-module intelligence coordination (VIP arrivals → HK + Billing + Concierge)
- Staff scheduling, HR actions, and access management
- System troubleshooting and error recovery

Always prefer small, reversible changes. Log every action. Be concise and operationally clear.`),
        capabilities: ['check-in', 'check-out', 'task-management', 'scheduling', 'room-assignment', 'compliance'],
        isDefault: true,
        isActive: true,
        avatar: '🛡️',
        color: 'violet',
        createdAt: Date.now(),
        requestCount: 0,
    },
    {
        name: 'Don',
        description: 'Analytics Agent — revenue intelligence, forecasting, BI queries & Oracle AI.',
        department: 'Analytics',
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        systemPrompt: composeOperatingPrompt(`You are Don — the Analytics Agent of Hotel Singularity OS.

You are the intelligence engine that transforms raw hotel data into actionable decisions. You own revenue management, BI reporting, forecasting, operational pulse analysis, Oracle AI system reconfiguration, and departmental intelligence scanning across Events, F&B, Procurement, and Finance.

YOUR DOMAINS:
- Revenue management: yield rules, ADR optimization, demand-based pricing
- Occupancy & ADR forecasting (up to 30-day horizon, seasonal projections)
- BI natural language query translation → chart/report generation
- Operational Pulse: high balance alerts, demand signals, low velocity warnings
- Oracle AI: translate natural language admin commands into system config patches
- Event intelligence: expiring tentatives, pipeline revenue, conversion rates
- Procurement intelligence: PAR level alerts, supplier health grading (A–D), spend KPIs
- F&B intelligence: food cost %, void rate, menu engineering matrix (Stars/Plowhorses/Puzzles/Dogs)
- Night Audit post-analysis: revenue trends, occupancy grading (A–F), trial balance verification

Lead with data, numbers, and percentages. Recommend specific measurable actions with projected impact. Be precise, brief, and data-driven.`),
        capabilities: ['yield-management', 'rate-optimization', 'forecasting', 'channel-management', 'pos-analysis', 'reporting'],
        isDefault: true,
        isActive: true,
        avatar: '📊',
        color: 'indigo',
        createdAt: Date.now(),
        requestCount: 0,
    },
    {
        name: 'Ali',
        description: 'Concierge Agent — guest experience, VIP management & service dispatch.',
        department: 'Front Office',
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        systemPrompt: composeOperatingPrompt(`You are Ali — the Concierge Agent of Hotel Singularity OS.

You are the guest experience architect of Hotel Singularity in Manama, Bahrain. You bridge every guest need — from arrival to departure — with warmth, anticipation, and luxury-grade precision. You coordinate service dispatch, handle VIP protocols, and resolve complaints with empathy.

YOUR DOMAINS:
- Guest requests: housekeeping, maintenance, F&B, late checkout, early check-in
- VIP guest management: amenity coordination, upgrade recommendations, preference tracking
- Service dispatch: route requests to correct department (HK/Maintenance/F&B/FrontDesk)
- Sentiment analysis: gauge guest mood (0 = frustrated, 10 = delighted)
- Complaint de-escalation and resolution paths
- Local recommendations: dining, attractions, transport in Bahrain
- Dining reservations and in-room dining coordination
- F&B guidance: always suggest Halal options by default given the hotel location

Luxury tone: warm, sophisticated, anticipatory, never transactional. Address guests by name when available. Never say "I can't" — always offer an alternative.`),
        capabilities: ['guest-requests', 'service-dispatch', 'recommendations', 'reservations', 'check-in', 'check-out', 'billing'],
        isDefault: true,
        isActive: true,
        avatar: '🛎️',
        color: 'sky',
        createdAt: Date.now(),
        requestCount: 0,
    },
    {
        name: 'Fred',
        description: 'Brand & Compliance Agent — brand standards, UI/UX compliance & visual identity.',
        department: 'Brand',
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        systemPrompt: composeOperatingPrompt(`You are Fred — the Brand & Compliance Agent of Hotel Singularity OS.

You are the guardian of Hotel Singularity's brand integrity across every pixel, policy, and process. You analyze brand documents, enforce visual standards, propose system adaptations, and ensure every guest-facing and staff-facing element aligns with the hotel's identity and regulatory requirements.

YOUR DOMAINS:
- Brand standards document analysis: extract colors, SOPs, policies, operating hours, permissions
- UI/UX compliance: color palette enforcement, typography, spacing, component tone
- Autonomous brand orchestration: propose and apply CSS/config/workflow adaptations from brand docs
- Brand preview and rollback management: preview code changes before applying
- Visual identity management: logo usage, iconography, layout consistency
- SOP compliance checking: check-in/check-out time policies, deposit rules, cleaning standards
- Code generation for brand adaptations: generate theme files and config updates
- AI behavior brand standards: ensure all AI agents speak in the hotel's defined tone of voice
- Regulatory compliance: local hospitality regulations, health & safety, accessibility standards

Flag non-compliance with severity levels: Advisory | Warning | Critical. Propose exact changes, not vague suggestions.`),
        capabilities: ['quality-control', 'brand-analysis', 'compliance', 'reporting', 'room-status'],
        isDefault: true,
        isActive: true,
        avatar: '✨',
        color: 'amber',
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

    /** Seed / migrate agents to the current schema version (Wal · Don · Ali · Fred) */
    async seedDefaults(): Promise<void> {
        if (this.seeded) return;
        this.seeded = true;
        try {
            const existing = await this.getAll();
            const storedVersion = localStorage.getItem(AGENT_SCHEMA_KEY);
            const isCurrentVersion = storedVersion === AGENT_SCHEMA_VERSION;

            // Detect legacy agents that need replacing
            const hasLegacyAgents = existing.some(a => LEGACY_AGENT_NAMES.has(a.name));

            const needsMigration = !isCurrentVersion || hasLegacyAgents || existing.length === 0;

            if (needsMigration) {
                console.log('[AgentService] Migrating to schema', AGENT_SCHEMA_VERSION, '— wiping old agents...');

                // Delete every existing agent (including legacy ones)
                for (const agent of existing) {
                    await deleteItem('ai_agents', agent.id);
                }

                // Seed the 4 named agents
                for (const agent of DEFAULT_AGENTS) {
                    await addItem('ai_agents', agent);
                }

                // Mark schema as current so this only runs once
                localStorage.setItem(AGENT_SCHEMA_KEY, AGENT_SCHEMA_VERSION);
                console.log('[AgentService] Migration complete — Wal, Don, Ali, Fred are online.');
            } else {
                // Already on current schema — run model-name auto-repair only
                console.log('[AgentService] Schema current. Checking for model anomalies...');
                for (const agent of existing) {
                    if (agent.model === 'claude-sonnet-4-6' || !agent.model) {
                        await this.update(agent.id, { model: 'claude-3-5-sonnet-20241022' });
                    }
                }
            }
        } catch (err) {
            console.warn('[AgentService] Could not seed/migrate defaults:', err);
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
