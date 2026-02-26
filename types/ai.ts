/**
 * Four-Tier AI Governance System - Type Definitions
 * Comprehensive interfaces for AI configuration, proposals, director board, and learning
 */

// ============================================================================
// AI Configuration Types
// ============================================================================

export type AITier = 'concierge' | 'system_ops' | 'automation' | 'analytics';
export type AIProvider = 'openai' | 'anthropic' | 'gemini' | 'ollama';

export interface AIConfiguration {
    id: string;
    tier: AITier;
    enabled: boolean;
    provider: AIProvider;
    model: string;
    apiKey: string; // Encrypted in storage
    settings: {
        temperature: number;
        maxTokens: number;
        systemPrompt: string;
        rateLimit: {
            requestsPerHour: number;
            tokensPerDay: number;
        };
        costLimit: {
            dailyBudget: number;
            alertThreshold: number;
        };
    };
    permissions: {
        dataAccess: string[]; // Allowed data sources
        writeAccess: boolean;
        requiresApproval: boolean;
        allowedOperations: string[];
    };
    createdAt: string;
    updatedAt: string;
    createdBy: string;
}

// ============================================================================
// AI Proposal Types
// ============================================================================

export type ProposalType =
    | 'brand_update'
    | 'policy_change'
    | 'workflow_optimization'
    | 'automation_execution';

export type ProposalStatus =
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'executed'
    | 'rolled_back';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface AIProposal {
    id: string;
    aiTier: 'system_ops' | 'automation';
    proposalType: ProposalType;
    title: string;
    summary: string;
    detailedAnalysis: {
        currentState: string;
        proposedChanges: string;
        reasoning: string;
        impactAnalysis: {
            affectedModules: string[];
            affectedUsers: number;
            affectedGuests: number;
            riskLevel: RiskLevel;
            estimatedDowntime: number; // minutes
        };
        rollbackPlan: string;
    };
    changes: {
        type: 'code' | 'config' | 'data';
        before: any;
        after: any;
        diff: string;
    }[];
    status: ProposalStatus;
    votes: ProposalVote[];
    approvalRequired: number; // Minimum votes needed
    approvalReceived: number;
    createdAt: string;
    submittedBy: 'system_ops_ai' | 'automation_ai';
    executedAt?: string;
    executedBy?: string;
}

export interface ProposalVote {
    directorId: string;
    directorName: string;
    vote: 'approve' | 'reject' | 'abstain';
    comment: string;
    timestamp: string;
}

// ============================================================================
// Director Board Types
// ============================================================================

export type NotificationUrgency = 'all' | 'high_only' | 'critical_only';
export type ApprovalThreshold = 'majority' | 'unanimous' | 'supermajority';

export interface DirectorBoardMember {
    id: string;
    userId: string;
    name: string;
    role: string; // GM, Operations Director, etc.
    email: string;
    votingPower: number; // 1-3 (GM might have 2x weight)
    notificationPreferences: {
        email: boolean;
        sms: boolean;
        inApp: boolean;
        urgency: NotificationUrgency;
    };
    active: boolean;
    addedAt: string;
    addedBy: string;
}

export interface DirectorBoardConfig {
    approvalThreshold: ApprovalThreshold;
    quorum: number; // Minimum directors who must vote
    votingDeadline: number; // Hours before auto-escalation
    autoRejectAfter: number; // Hours of no action
    criticalChangeApproval: 'unanimous' | 'gm_only';
}

// ============================================================================
// AI Activity Log Types
// ============================================================================

export interface AIActivityLog {
    id: string;
    timestamp: string;
    aiTier: AITier;
    action: string;
    details: {
        userId?: string;
        guestId?: string;
        proposalId?: string;
        inputTokens: number;
        outputTokens: number;
        cost: number;
        latencyMs: number;
        success: boolean;
        error?: string;
    };
    metadata: Record<string, any>;
}

// ============================================================================
// Automation Learning Types
// ============================================================================

export type LearningCategory =
    | 'housekeeping'
    | 'front_desk'
    | 'fnb'
    | 'revenue'
    | 'maintenance';

export type SuggestionStatus =
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'implemented';

export interface AutomationLearningData {
    id: string;
    category: LearningCategory;
    patternType: string; // "cleaning_time_pattern", "check_in_peak_time", etc.
    observations: {
        timestamp: string;
        data: any;
    }[];
    pattern: {
        description: string;
        confidence: number; // 0-100
        frequency: string; // "daily", "weekly", "seasonal"
        lastUpdated: string;
    };
    suggestions: AutomationSuggestion[];
    createdAt: string;
    updatedAt: string;
}

export interface AutomationSuggestion {
    id: string;
    suggestion: string;
    expectedBenefit: string;
    estimatedImpact: {
        timeSaved: number; // minutes per day
        costSaved: number; // USD per month
        qualityImprovement: number; // 0-100 score
    };
    confidence: number;
    status: SuggestionStatus;
    staffFeedback?: {
        rating: number; // 1-5
        comment: string;
        timestamp: string;
    };
}

// ============================================================================
// AI Tier Specific Permissions
// ============================================================================

export interface TierPermissions {
    allowedOperations: string[];
    deniedOperations: string[];
    rateLimits?: {
        requestsPerHour: number;
        tokensPerDay: number;
    };
    approvalRequired?: boolean;
    minimumApprovers?: number;
    learningMode?: boolean;
    confidenceThreshold?: number;
    dataAccess?: 'read_only' | 'read_write';
    piiAnonymization?: boolean;
}

// Tier 1: AI Concierge Permissions
export const CONCIERGE_PERMISSIONS: TierPermissions = {
    allowedOperations: [
        'read_guest_reservation',
        'read_hotel_info',
        'read_menu_catalog',
        'read_local_recommendations'
    ],
    deniedOperations: [
        'write_*',
        'read_other_guests',
        'read_financial_data',
        'execute_system_commands'
    ],
    rateLimits: {
        requestsPerHour: 30,
        tokensPerDay: 50000
    }
};

// Tier 2: System Ops Permissions
export const SYSTEM_OPS_PERMISSIONS: TierPermissions = {
    allowedOperations: [
        'read_system_config',
        'read_brand_standards',
        'read_module_metadata',
        'propose_changes',
        'create_proposal'
    ],
    deniedOperations: [
        'execute_changes_without_approval',
        'modify_financial_transactions',
        'access_payment_data'
    ],
    approvalRequired: true,
    minimumApprovers: 3
};

// Tier 3: Automation AI Permissions
export const AUTOMATION_PERMISSIONS: TierPermissions = {
    allowedOperations: [
        'read_operational_data',
        'read_historical_data',
        'analyze_patterns',
        'create_suggestions'
    ],
    deniedOperations: [
        'execute_automations_without_approval',
        'modify_guest_data',
        'override_staff_decisions'
    ],
    learningMode: true,
    confidenceThreshold: 0.85
};

// Tier 4: Analytics AI Permissions
export const ANALYTICS_PERMISSIONS: TierPermissions = {
    allowedOperations: [
        'read_all_data',
        'generate_reports',
        'create_dashboards',
        'export_anonymized_data'
    ],
    deniedOperations: [
        'write_*',
        'execute_*',
        'modify_*'
    ],
    dataAccess: 'read_only',
    piiAnonymization: true
};

// ============================================================================
// Cost Estimation Types
// ============================================================================

export interface TierCostEstimate {
    tier: AITier;
    provider: AIProvider;
    model: string;
    estimatedMonthlyRequests: number;
    estimatedMonthlyCost: number;
}

export interface AISystemCostEstimate {
    total: number;
    breakdown: TierCostEstimate[];
    savingsVsAllPremium: number;
}

// ============================================================================
// Recommended Configuration Types
// ============================================================================

export interface RecommendedAISetup {
    name: string; // "Budget", "Balanced", "Premium"
    totalCost: number;
    configurations: {
        tier: AITier;
        provider: AIProvider;
        model: string;
        rationale: string;
    }[];
}

export const RECOMMENDED_SETUPS: RecommendedAISetup[] = [
    {
        name: 'Budget',
        totalCost: 24,
        configurations: [
            {
                tier: 'concierge',
                provider: 'ollama',
                model: 'llama3.2',
                rationale: 'FREE, fast, guest conversations don\'t need complex reasoning'
            },
            {
                tier: 'system_ops',
                provider: 'anthropic',
                model: 'claude-3-5-sonnet-20241022',
                rationale: 'Best reasoning for critical decisions, 70% cheaper than GPT-4'
            },
            {
                tier: 'automation',
                provider: 'anthropic',
                model: 'claude-3-opus-20240229',
                rationale: 'Deep analysis for learning patterns, weekly runs only'
            },
            {
                tier: 'analytics',
                provider: 'gemini',
                model: 'gemini-pro',
                rationale: 'FREE with rate limits, perfect for daily reports'
            }
        ]
    },
    {
        name: 'Balanced',
        totalCost: 32,
        configurations: [
            {
                tier: 'concierge',
                provider: 'openai',
                model: 'gpt-3.5-turbo',
                rationale: 'Fast and reliable for high guest volume'
            },
            {
                tier: 'system_ops',
                provider: 'anthropic',
                model: 'claude-3-5-sonnet-20241022',
                rationale: 'Best reasoning for critical decisions'
            },
            {
                tier: 'automation',
                provider: 'openai',
                model: 'gpt-4',
                rationale: 'Advanced pattern recognition, weekly runs'
            },
            {
                tier: 'analytics',
                provider: 'gemini',
                model: 'gemini-pro',
                rationale: 'FREE, good for standard reports'
            }
        ]
    },
    {
        name: 'Premium',
        totalCost: 86,
        configurations: [
            {
                tier: 'concierge',
                provider: 'openai',
                model: 'gpt-4-turbo',
                rationale: 'Best guest experience with advanced understanding'
            },
            {
                tier: 'system_ops',
                provider: 'anthropic',
                model: 'claude-3-5-sonnet-20241022',
                rationale: 'Highest quality reasoning for critical changes'
            },
            {
                tier: 'automation',
                provider: 'openai',
                model: 'gpt-4',
                rationale: 'Maximum pattern recognition capability'
            },
            {
                tier: 'analytics',
                provider: 'openai',
                model: 'gpt-4-turbo',
                rationale: 'Most sophisticated insights and predictions'
            }
        ]
    }
];
