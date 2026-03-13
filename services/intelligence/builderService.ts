import { aiProvider } from './aiProvider';
import { composeOperatingPrompt } from './aiOperatingCharter';
import { integrationHealthService, IntegrationHealthStatus } from '../kernel/integrationHealth';
import { fileModifier, type ApplyResult } from '../kernel/fileModifier';
import type { FileChange } from '../brand/codeGenerator';
import humanFirstMandate from '../../docs/ops/builder_human_first_mandate.md?raw';

export type BuilderPriority = 'critical' | 'high' | 'medium';

export interface BuilderRoadmapItem {
    id: string;
    title: string;
    outcome: string;
    priority: BuilderPriority;
    validation: string;
}

export interface BuilderSandboxProfile {
    mode: 'hard';
    writablePathPrefixes: string[];
    blockedPathSegments: string[];
    allowedExtensions: string[];
    maxWriteBytes: number;
}

export interface BuilderDepartmentResearchItem {
    department: string;
    validation: string;
}

export interface BuilderArchitectureSnapshot {
    generatedAt: string;
    modules: Array<{ id: string; label: string; area: string }>;
    services: string[];
    benchmarkTargets: string[];
    departmentResearchMap: BuilderDepartmentResearchItem[];
    sandbox: BuilderSandboxProfile;
}

export interface BuilderAssistantResult {
    summary: string;
    content: string;
    actions: string[];
    validation: string[];
    health: IntegrationHealthStatus;
    architecture: BuilderArchitectureSnapshot;
    provider: 'openai' | 'gemini' | 'anthropic' | 'ollama';
    model: string;
    error?: string;
}

export interface BuilderImplementationDraft {
    filePath: string;
    description: string;
    type: 'css' | 'typescript' | 'json';
    content: string;
}

export interface BuilderImplementationPlan {
    summary: string;
    validation: string[];
    changes: BuilderImplementationDraft[];
    blocked: string[];
    rawResponse: string;
    error?: string;
}

export interface BuilderImplementationResult {
    success: boolean;
    summary: string;
    dryRun: boolean;
    filesProposed: number;
    filesApplied: number;
    appliedFiles: string[];
    blocked: string[];
    errors: string[];
    validation: string[];
    backupId?: string;
    mode?: ApplyResult['mode'];
    rawResponse?: string;
}

export interface BuilderWriteEngineStatus {
    online: boolean;
    message: string;
}

const HARD_SANDBOX: BuilderSandboxProfile = {
    mode: 'hard',
    writablePathPrefixes: [
        'components/',
        'services/',
        'context/',
        'src/',
        'types/',
        'docs/',
        'public/',
        'App.tsx',
        'index.css',
        'index.html'
    ],
    blockedPathSegments: ['..', '.git', '.env', 'node_modules', 'dist/', '.firebase', '.singularity_backups', 'edgeNode/'],
    allowedExtensions: ['.ts', '.tsx', '.css', '.json', '.md', '.html'],
    maxWriteBytes: 300000
};

const MODULE_BLUEPRINT: BuilderArchitectureSnapshot['modules'] = [
    { id: 'dashboard', label: 'Dashboard', area: 'Core' },
    { id: 'front_desk', label: 'Front Desk', area: 'Operations' },
    { id: 'housekeeping', label: 'Housekeeping', area: 'Operations' },
    { id: 'pos', label: 'F&B / POS', area: 'Operations' },
    { id: 'events', label: 'Events', area: 'Operations' },
    { id: 'group_management', label: 'Group Management', area: 'Operations' },
    { id: 'night_audit', label: 'Night Audit', area: 'Operations' },
    { id: 'finance', label: 'Finance', area: 'Back Office' },
    { id: 'hr', label: 'Human Capital', area: 'Back Office' },
    { id: 'procurement', label: 'Procurement', area: 'Back Office' },
    { id: 'engineering', label: 'Engineering', area: 'Infrastructure' },
    { id: 'security', label: 'Security', area: 'Infrastructure' },
    { id: 'iot', label: 'IOT Control', area: 'Infrastructure' },
    { id: 'connect', label: 'Connect', area: 'Core' },
    { id: 'brand_standards', label: 'Brand Standards', area: 'Brand' },
    { id: 'ai_command_center', label: 'AI Command Center', area: 'Intelligence' },
    { id: 'builder_studio', label: 'Builder Studio', area: 'Intelligence' },
    { id: 'configuration', label: 'Configuration', area: 'System' },
    { id: 'terminal', label: 'Terminal', area: 'System' }
];

const KEY_SERVICES = [
    'services/kernel/persistence',
    'services/kernel/firestoreService',
    'services/kernel/integrationHealth',
    'services/kernel/internalAuthService',
    'services/intelligence/aiProvider',
    'services/intelligence/agentService',
    'services/intelligence/builderService',
    'services/intelligence/sovereignDrive',
    'services/intelligence/intelligenceCoordinator',
    'services/brand/autonomousBrandOrchestrator'
];

const BENCHMARK_TARGETS = ['Oracle OPERA Cloud', 'Mews', 'Cloudbeds', 'Stayntouch', 'Apaleo'];
const DEPARTMENT_RESEARCH_MAP: BuilderDepartmentResearchItem[] = [
    {
        department: 'Front Office / Reservations / Night Audit',
        validation: 'Validate complete coverage of core front desk workflows and controls.'
    },
    {
        department: 'Housekeeping',
        validation: 'Ensure housekeeping tasks, records, and status updates are fully supported.'
    },
    {
        department: 'F&B / POS / Kitchen',
        validation: 'Verify POS integration, menu management, and kitchen operations.'
    },
    {
        department: 'Finance / Accounting',
        validation: 'Review financial reporting, accounts payable/receivable, and general ledger functionality.'
    },
    {
        department: 'HR / Payroll / Attendance',
        validation: 'Confirm HR management, payroll processing, and attendance tracking.'
    },
    {
        department: 'Procurement / Inventory',
        validation: 'Assess procurement workflows, vendor management, and inventory control.'
    },
    {
        department: 'Engineering / Maintenance',
        validation: 'Validate work order management, preventative maintenance, and asset tracking.'
    },
    {
        department: 'Security',
        validation: 'Review security incident reporting, access control, and surveillance integration.'
    },
    {
        department: 'Events / Sales',
        validation: 'Ensure event booking, group management, and sales pipeline support.'
    },
    {
        department: 'Revenue / Distribution / OTA',
        validation: 'Verify rate management, channel management, and revenue optimization.'
    }
];
const BUILDER_HUMAN_FIRST_MANDATE = humanFirstMandate.trim();
const MAX_IMPLEMENT_FILES = 4;
const MAX_IMPLEMENTATION_RESPONSE_TOKENS = 3200;

const BUILDER_SYSTEM_PROMPT = composeOperatingPrompt(`You are Builder, the Hotel Singularity self-evolution engineering agent.

Your mission:
1. Understand architecture and dependencies before suggesting changes.
2. Produce safe, staged implementation plans that do not break operations.
3. Prioritize reliability, role-based security, and operator UX.
4. Enforce hard sandbox policy and never suggest writes outside allowlisted paths.
5. Include test and rollback guidance for every major recommendation.
6. Apply the judgment of a senior builder with 50 years of hospitality operations and hotel systems experience.

HUMAN-FIRST MANDATE:
${BUILDER_HUMAN_FIRST_MANDATE}

Output format:
SUMMARY:
<short diagnostic summary>

HUMAN UX GAPS:
- gap 1
- gap 2

DEPARTMENT RESEARCH MAP:
- include all mandatory departments from the runtime department research map.
- for each department report: coverage status, missing controls, data gaps, and implementation actions.

MARKET PARITY GAPS:
- competitor reference + missing feature

ACTIONS:
- action 1
- action 2

VALIDATION:
- validation step 1
- validation step 2
- include front desk control coverage checks explicitly

RISKS:
- risk 1
- risk 2`);

const BUILDER_IMPLEMENTATION_PROMPT = composeOperatingPrompt(`You are Builder Execute Mode.

You must produce implementation-ready file updates, not just analysis.
Use hard sandbox constraints and only output valid JSON.
You operate with 50 years of hospitality operations and hotel software engineering experience.

HUMAN-FIRST MANDATE:
${BUILDER_HUMAN_FIRST_MANDATE}

Execution constraints:
- Only modify files inside allowed prefixes.
- Never use blocked paths or blocked extensions.
- Always return full file content for each change.
- Keep changes minimal, safe, and production-ready.
- If uncertain, return zero changes with explanation in summary.

Return ONLY JSON:
{
  "summary": "what will be implemented",
  "validation": ["validation step 1", "validation step 2"],
  "changes": [
    {
      "filePath": "components/example.tsx",
      "description": "what changed",
      "type": "typescript",
      "content": "full file content"
    }
  ]
}`);

const BUILDER_JSON_REPAIR_PROMPT = composeOperatingPrompt(`You are a strict JSON repair assistant.

Your task:
- Convert the provided assistant output into valid JSON.
- Return ONLY one JSON object with keys: summary, validation, changes.
- validation must be a string array.
- changes must be an array of objects: { filePath, description, type, content }.
- type must be one of: "typescript", "css", "json".
- If no usable change exists, return "changes": [] and explain in "summary".
- Never include markdown fences or commentary.`);

const resolveSafeMaxTokens = (
    provider: 'openai' | 'gemini' | 'anthropic' | 'ollama',
    model: string | undefined,
    requested: number
): number => {
    const normalizedProvider = provider.toLowerCase();
    const normalizedModel = String(model || '').toLowerCase();

    // Anthropic Claude 3 Haiku: max output tokens = 4096.
    if (normalizedProvider === 'anthropic' && normalizedModel.includes('haiku')) {
        return Math.min(requested, 3200);
    }

    if (normalizedProvider === 'anthropic') {
        return Math.min(requested, 4096);
    }

    return requested;
};

const extractSectionLines = (content: string, section: 'ACTIONS' | 'VALIDATION'): string[] => {
    const startPattern = new RegExp(`${section}:`, 'i');
    const lines = content.split('\n');
    const sectionIndex = lines.findIndex((line) => startPattern.test(line.trim()));
    if (sectionIndex < 0) return [];

    const collected: string[] = [];
    for (let i = sectionIndex + 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        if (/^[A-Z ]+:$/.test(line)) break;
        if (line.startsWith('-')) {
            collected.push(line.replace(/^-+\s*/, '').trim());
        }
    }
    return collected;
};

const extractSummary = (content: string): string => {
    const lines = content.split('\n');
    const idx = lines.findIndex((line) => /^SUMMARY:/i.test(line.trim()));
    if (idx < 0) return content.trim().slice(0, 220);
    for (let i = idx + 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        if (/^[A-Z ]+:$/.test(line)) break;
        return line;
    }
    return content.trim().slice(0, 220);
};

const normalizePath = (filePath: string): string => (filePath || '').replace(/\\/g, '/').replace(/^\.?\//, '').trim();

const getFileExtension = (filePath: string): string => {
    const lastDot = filePath.lastIndexOf('.');
    return lastDot >= 0 ? filePath.slice(lastDot).toLowerCase() : '';
};

const inferFileType = (filePath: string): 'css' | 'typescript' | 'json' => {
    const ext = getFileExtension(filePath);
    if (ext === '.css') return 'css';
    if (ext === '.json') return 'json';
    return 'typescript';
};

const isBlockedPath = (filePath: string): boolean => {
    const lower = filePath.toLowerCase();
    return HARD_SANDBOX.blockedPathSegments.some((segment) => lower.includes(segment.toLowerCase()));
};

const isAllowedPath = (filePath: string): boolean => {
    return HARD_SANDBOX.writablePathPrefixes.some((prefix) => filePath === prefix || filePath.startsWith(prefix));
};

const parseJsonObjectCandidate = (candidate: string): Record<string, any> | null => {
    const normalized = String(candidate || '')
        .replace(/^\uFEFF/, '')
        .replace(/[“”]/g, '"')
        .replace(/[‘’]/g, '\'')
        .trim();

    if (!normalized) return null;

    const attempts = [
        normalized,
        normalized.replace(/,\s*([}\]])/g, '$1')
    ];

    for (const value of attempts) {
        try {
            const parsed = JSON.parse(value);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                return parsed as Record<string, any>;
            }
        } catch {
            // Try next candidate.
        }
    }

    return null;
};

const extractBalancedJsonObject = (content: string): Record<string, any> | null => {
    const text = String(content || '');

    for (let start = 0; start < text.length; start++) {
        if (text[start] !== '{') continue;

        let depth = 0;
        let inString = false;
        let escaped = false;

        for (let i = start; i < text.length; i++) {
            const char = text[i];

            if (inString) {
                if (escaped) {
                    escaped = false;
                    continue;
                }
                if (char === '\\') {
                    escaped = true;
                    continue;
                }
                if (char === '"') {
                    inString = false;
                }
                continue;
            }

            if (char === '"') {
                inString = true;
                continue;
            }
            if (char === '{') {
                depth += 1;
                continue;
            }
            if (char === '}') {
                depth -= 1;
                if (depth === 0) {
                    const parsed = parseJsonObjectCandidate(text.slice(start, i + 1));
                    if (parsed) return parsed;
                    break;
                }
            }
        }
    }

    return null;
};

const extractJsonObject = (content: string): Record<string, any> | null => {
    const normalized = String(content || '').trim();
    if (!normalized) return null;

    const fencedBlocks = [...normalized.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)];
    for (const block of fencedBlocks) {
        const parsed = parseJsonObjectCandidate(block[1] || '');
        if (parsed) return parsed;
    }

    const direct = parseJsonObjectCandidate(normalized);
    if (direct) return direct;

    const firstBrace = normalized.indexOf('{');
    const lastBrace = normalized.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
        const sliced = parseJsonObjectCandidate(normalized.slice(firstBrace, lastBrace + 1));
        if (sliced) return sliced;
    }

    return extractBalancedJsonObject(normalized);
};

const toRoadmapItem = (raw: Partial<BuilderRoadmapItem>, index: number): BuilderRoadmapItem => ({
    id: `builder_item_${index + 1}`,
    title: (raw.title || `Roadmap Item ${index + 1}`).toString().trim(),
    outcome: (raw.outcome || 'Improve operational quality and reliability.').toString().trim(),
    priority: (raw.priority === 'critical' || raw.priority === 'high' || raw.priority === 'medium')
        ? raw.priority
        : 'medium',
    validation: (raw.validation || 'Run module smoke checks and verify error-free runtime.').toString().trim()
});

class BuilderService {
    private async repairImplementationJson(
        rawContent: string,
        goal: string,
        maxFiles: number,
        safeMaxTokens: number
    ): Promise<Record<string, any> | null> {
        const trimmedRaw = String(rawContent || '').trim();
        if (!trimmedRaw) return null;

        const repairPrompt = [
            'Repair this implementation response into strict JSON.',
            `Goal: ${goal.trim() || 'n/a'}`,
            `Max files: ${maxFiles}`,
            '',
            'Source response to repair:',
            trimmedRaw.slice(0, 20000)
        ].join('\n');

        try {
            const response = await aiProvider.executeRequest(repairPrompt, {
                systemPrompt: BUILDER_JSON_REPAIR_PROMPT,
                temperature: 0,
                maxTokens: Math.min(2000, safeMaxTokens)
            });
            return extractJsonObject(response.content);
        } catch {
            return null;
        }
    }

    getHumanFirstMandate(): string {
        return BUILDER_HUMAN_FIRST_MANDATE;
    }

    getArchitectureSnapshot(): BuilderArchitectureSnapshot {
        return {
            generatedAt: new Date().toISOString(),
            modules: MODULE_BLUEPRINT,
            services: KEY_SERVICES,
            benchmarkTargets: BENCHMARK_TARGETS,
            departmentResearchMap: DEPARTMENT_RESEARCH_MAP,
            sandbox: HARD_SANDBOX
        };
    }

    async getHealthSnapshot(): Promise<IntegrationHealthStatus> {
        return integrationHealthService.checkNow();
    }

    async probeWriteEngine(): Promise<BuilderWriteEngineStatus> {
        try {
            const response = await fetch('/kernel/health', {
                method: 'GET',
                signal: AbortSignal.timeout(2000)
            });
            if (!response.ok) {
                return {
                    online: false,
                    message: `Kernel responded with HTTP ${response.status}.`
                };
            }
            return {
                online: true,
                message: 'Kernel online. Real file writes enabled.'
            };
        } catch {
            return {
                online: false,
                message: 'Kernel offline. Start `npm run kernel` for real file writes.'
            };
        }
    }

    async askBuilder(goal: string): Promise<BuilderAssistantResult> {
        const health = await this.getHealthSnapshot();
        const architecture = this.getArchitectureSnapshot();
        const runtime = aiProvider.getRuntimeConfig();

        const prompt = [
            `SYSTEM SNAPSHOT`,
            `- Health overall: ${health.overall}`,
            `- Firebase auth: ${health.firebaseAuth.message}`,
            `- Firestore: ${health.firestore.message}`,
            `- Functions: ${health.functions.message}`,
            `- AI provider: ${health.aiProvider.provider} (${health.aiProvider.message})`,
            '',
            `ARCHITECTURE SNAPSHOT`,
            `- Modules: ${architecture.modules.map((module) => module.id).join(', ')}`,
            `- Services: ${architecture.services.join(', ')}`,
            `- Benchmarks: ${architecture.benchmarkTargets.join(', ')}`,
            `- Department research map entries: ${architecture.departmentResearchMap.length}`,
            '',
            `HARD SANDBOX`,
            `- Writable prefixes: ${architecture.sandbox.writablePathPrefixes.join(', ')}`,
            `- Blocked segments: ${architecture.sandbox.blockedPathSegments.join(', ')}`,
            `- Allowed extensions: ${architecture.sandbox.allowedExtensions.join(', ')}`,
            `- Max change bytes: ${architecture.sandbox.maxWriteBytes}`,
            '',
            `GOAL`,
            goal.trim(),
            '',
            'Non-negotiable checks:',
            '- Identify missing human buttons and actions (Create/Edit/Delete/Save/Cancel/Back).',
            '- Validate front desk controls for: check-in, check-out, room assignment, reservation creation, modification, cancellation.',
            '- Validate front desk workflow status feedback, error handling, and recovery paths.',
            '- Benchmark front desk UX and workflows against market leaders; do not miss even small core gaps.',
            '- Cover all hotel departments and role workflows.',
            '- Compare feature gaps against benchmark PMS platforms and include small but important gaps.',
            '',
            'MANDATORY DEPARTMENT RESEARCH MAP:',
            ...architecture.departmentResearchMap.map((item) => `- ${item.department}: ${item.validation}`),
            '',
            'Produce practical implementation guidance using the required format.'
        ].join('\n');

        try {
            const response = await aiProvider.executeRequest(prompt, {
                systemPrompt: BUILDER_SYSTEM_PROMPT,
                temperature: 0.2,
                maxTokens: 2000
            });

            const actions = extractSectionLines(response.content, 'ACTIONS');
            const validation = extractSectionLines(response.content, 'VALIDATION');
            const summary = extractSummary(response.content);

            return {
                summary,
                content: response.content,
                actions,
                validation,
                health,
                architecture,
                provider: runtime.provider,
                model: response.model
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Builder request failed';
            return {
                summary: 'Builder could not reach the AI backend. Use health diagnostics and key/provider setup first.',
                content: message,
                actions: [
                    'Open Configuration > AI Configurations and verify provider plus API key.',
                    'Run health checks and resolve Functions/Firestore readiness issues.',
                    'Retry Builder analysis once backend status is healthy.'
                ],
                validation: [
                    'AI provider status shows healthy in Integration Health.',
                    'A Builder prompt returns a structured response without runtime errors.'
                ],
                health,
                architecture,
                provider: runtime.provider,
                model: runtime.model || 'unknown',
                error: message
            };
        }
    }

    private normalizeImplementationChanges(rawChanges: any, maxFiles: number): { valid: BuilderImplementationDraft[]; blocked: string[] } {
        const blocked: string[] = [];
        const valid: BuilderImplementationDraft[] = [];
        const inputChanges = Array.isArray(rawChanges) ? rawChanges : [];

        for (const entry of inputChanges.slice(0, maxFiles)) {
            const filePath = normalizePath(String(entry?.filePath || ''));
            const description = String(entry?.description || 'Builder implementation update').trim();
            const content = String(entry?.content || '');
            const declaredType = entry?.type === 'css' || entry?.type === 'json' || entry?.type === 'typescript'
                ? entry.type
                : inferFileType(filePath);
            const ext = getFileExtension(filePath);

            if (!filePath) {
                blocked.push('Blocked change: missing filePath.');
                continue;
            }
            if (filePath.startsWith('/')) {
                blocked.push(`Blocked ${filePath}: absolute paths are forbidden.`);
                continue;
            }
            if (isBlockedPath(filePath)) {
                blocked.push(`Blocked ${filePath}: path segment violates hard sandbox policy.`);
                continue;
            }
            if (!isAllowedPath(filePath)) {
                blocked.push(`Blocked ${filePath}: outside writable sandbox prefixes.`);
                continue;
            }
            if (!HARD_SANDBOX.allowedExtensions.includes(ext)) {
                blocked.push(`Blocked ${filePath}: extension ${ext || '(none)'} is not allowed.`);
                continue;
            }
            if (!content.trim()) {
                blocked.push(`Blocked ${filePath}: content is empty.`);
                continue;
            }
            const bytes = new TextEncoder().encode(content).length;
            if (bytes > HARD_SANDBOX.maxWriteBytes) {
                blocked.push(`Blocked ${filePath}: change exceeds ${HARD_SANDBOX.maxWriteBytes} bytes.`);
                continue;
            }

            valid.push({
                filePath,
                description,
                type: declaredType,
                content
            });
        }

        return { valid, blocked };
    }

    async proposeImplementation(goal: string, options: { maxFiles?: number } = {}): Promise<BuilderImplementationPlan> {
        const maxFiles = Math.max(1, Math.min(options.maxFiles ?? 3, MAX_IMPLEMENT_FILES));
        const health = await this.getHealthSnapshot();
        const architecture = this.getArchitectureSnapshot();
        const runtime = aiProvider.getRuntimeConfig();

        const prompt = [
            'IMPLEMENTATION GOAL',
            goal.trim(),
            '',
            'CURRENT HEALTH',
            `- overall: ${health.overall}`,
            `- firebaseAuth: ${health.firebaseAuth.message}`,
            `- firestore: ${health.firestore.message}`,
            `- functions: ${health.functions.message}`,
            `- ai: ${health.aiProvider.provider} (${health.aiProvider.message})`,
            '',
            'ARCHITECTURE',
            `- modules: ${architecture.modules.map((module) => module.id).join(', ')}`,
            `- services: ${architecture.services.join(', ')}`,
            '',
            'SANDBOX',
            `- writable prefixes: ${architecture.sandbox.writablePathPrefixes.join(', ')}`,
            `- blocked segments: ${architecture.sandbox.blockedPathSegments.join(', ')}`,
            `- allowed extensions: ${architecture.sandbox.allowedExtensions.join(', ')}`,
            `- max write bytes: ${architecture.sandbox.maxWriteBytes}`,
            '',
            `Rules: produce at most ${maxFiles} file changes with full file contents.`,
            'Prioritize fixes that materially improve operator workflows and reliability.',
            'Mandatory focus: front desk controls and recovery-safe UX.'
        ].join('\n');

        try {
            const safeMaxTokens = resolveSafeMaxTokens(
                runtime.provider,
                runtime.model,
                MAX_IMPLEMENTATION_RESPONSE_TOKENS
            );
            const response = await aiProvider.executeRequest(prompt, {
                systemPrompt: BUILDER_IMPLEMENTATION_PROMPT,
                temperature: 0.1,
                maxTokens: safeMaxTokens
            });

            let parsed = extractJsonObject(response.content);
            let repairedFromInvalidJson = false;
            if (!parsed) {
                parsed = await this.repairImplementationJson(response.content, goal, maxFiles, safeMaxTokens);
                repairedFromInvalidJson = !!parsed;
            }

            if (!parsed) {
                return {
                    summary: 'Builder returned a non-JSON response. No implementation was applied.',
                    validation: [],
                    changes: [],
                    blocked: ['AI response was not valid JSON.'],
                    rawResponse: response.content,
                    error: 'invalid_json_response'
                };
            }

            const { valid, blocked } = this.normalizeImplementationChanges(parsed.changes, maxFiles);
            const validation = Array.isArray(parsed.validation)
                ? parsed.validation.map((line) => String(line).trim()).filter(Boolean)
                : [];
            if (repairedFromInvalidJson) {
                blocked.unshift('Recovered plan from non-JSON AI output via JSON repair pass.');
            }

            return {
                summary: String(parsed.summary || 'Builder generated an implementation plan.').trim(),
                validation,
                changes: valid,
                blocked,
                rawResponse: response.content
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Builder implementation planning failed';
            return {
                summary: 'Builder could not generate implementation changes.',
                validation: [],
                changes: [],
                blocked: [],
                rawResponse: '',
                error: message
            };
        }
    }

    async implementGoal(
        goal: string,
        options: { dryRun?: boolean; maxFiles?: number; requireKernel?: boolean } = {}
    ): Promise<BuilderImplementationResult> {
        const dryRun = !!options.dryRun;
        const requireKernel = options.requireKernel ?? true;
        const plan = await this.proposeImplementation(goal, { maxFiles: options.maxFiles });

        const summary = plan.summary || 'Builder implementation completed.';
        const proposed = plan.changes.length;
        if (plan.error) {
            return {
                success: false,
                summary,
                dryRun,
                filesProposed: proposed,
                filesApplied: 0,
                appliedFiles: [],
                blocked: plan.blocked,
                errors: [plan.error],
                validation: plan.validation,
                rawResponse: plan.rawResponse
            };
        }

        if (proposed === 0) {
            return {
                success: false,
                summary: `${summary} No valid code changes were produced.`,
                dryRun,
                filesProposed: 0,
                filesApplied: 0,
                appliedFiles: [],
                blocked: plan.blocked,
                errors: ['No valid implementation changes to apply.'],
                validation: plan.validation,
                rawResponse: plan.rawResponse
            };
        }

        if (dryRun) {
            return {
                success: true,
                summary: `${summary} Dry run only.`,
                dryRun: true,
                filesProposed: proposed,
                filesApplied: 0,
                appliedFiles: [],
                blocked: plan.blocked,
                errors: [],
                validation: plan.validation,
                rawResponse: plan.rawResponse
            };
        }

        if (requireKernel) {
            const writeEngine = await this.probeWriteEngine();
            if (!writeEngine.online) {
                return {
                    success: false,
                    summary: `${summary} Build blocked: ${writeEngine.message}`,
                    dryRun: false,
                    filesProposed: proposed,
                    filesApplied: 0,
                    appliedFiles: [],
                    blocked: plan.blocked,
                    errors: [writeEngine.message],
                    validation: plan.validation,
                    rawResponse: plan.rawResponse
                };
            }
        }

        const changes: FileChange[] = plan.changes.map((change) => ({
            filePath: change.filePath,
            content: change.content,
            type: change.type,
            description: change.description
        }));
        const applyResult = await fileModifier.applyAndRefresh(changes, `Builder auto-implementation: ${goal}`);

        return {
            success: applyResult.success,
            summary,
            dryRun: false,
            filesProposed: proposed,
            filesApplied: applyResult.filesModified,
            appliedFiles: plan.changes.map((change) => change.filePath),
            blocked: plan.blocked,
            errors: applyResult.errors,
            validation: plan.validation,
            backupId: applyResult.backupId,
            mode: applyResult.mode,
            rawResponse: plan.rawResponse
        };
    }

    async generateRoadmap(goal: string): Promise<BuilderRoadmapItem[]> {
        const response = await this.askBuilder(
            `Create a staged 5-step implementation roadmap for this goal: ${goal}\n` +
            'Return JSON array only with objects using keys: title, outcome, priority, validation.'
        );

        try {
            const jsonCandidate = response.content.match(/\[[\s\S]*\]/)?.[0];
            if (jsonCandidate) {
                const parsed = JSON.parse(jsonCandidate) as Array<Partial<BuilderRoadmapItem>>;
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed.slice(0, 5).map((item, index) => toRoadmapItem(item, index));
                }
            }
        } catch {
            // Fall through to deterministic roadmap below.
        }

        return [
            toRoadmapItem({ title: 'Baseline Assessment', outcome: 'Map current module readiness and runtime risks.', priority: 'high', validation: 'Complete module sweep without runtime overlay.' }, 0),
            toRoadmapItem({ title: 'Security and Guardrails', outcome: 'Lock execution to hard sandbox policy and role controls.', priority: 'critical', validation: 'Unauthorized write attempts are denied with explicit errors.' }, 1),
            toRoadmapItem({ title: 'Feature Gap Implementation', outcome: `Implement prioritized enhancements for: ${goal}.`, priority: 'high', validation: 'Acceptance criteria pass in affected modules.' }, 2),
            toRoadmapItem({ title: 'Reliability Hardening', outcome: 'Catch async failures and improve health telemetry coverage.', priority: 'high', validation: 'No uncaught promise rejections in console during module sweep.' }, 3),
            toRoadmapItem({ title: 'Regression and Rollout', outcome: 'Run smoke tests and define rollback-safe deployment.', priority: 'medium', validation: 'Build passes and production checklist is signed off.' }, 4)
        ];
    }
}

export const builderService = new BuilderService();
