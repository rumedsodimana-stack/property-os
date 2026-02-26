/**
 * Brand Standards System Knowledge Base
 * 
 * This file contains the comprehensive mapping of how brand documents
 * affect different parts of the Hotel Singularity OS. It serves as the
 * "pre-training" data for the AI adaptation engine.
 */

import { BrandDocument } from '../../types';

// System Architecture Map
export const SYSTEM_MODULES = {
    frontDesk: {
        path: '/components/pms/FrontDesk.tsx',
        configPoints: [
            'checkInTime',
            'checkOutTime',
            'depositRequired',
            'idVerification',
            'creditCardAuth'
        ],
        workflows: {
            checkIn: {
                steps: ['verify_identity', 'assign_room', 'collect_deposit', 'issue_keys'],
                configurable: true
            },
            checkOut: {
                steps: ['final_billing', 'collect_keys', 'room_inspection', 'process_payment'],
                configurable: true
            }
        },
        affectedBy: ['Front_Desk_SOP', 'Check-in_Procedure', 'Check-out_Procedure', 'Guest_Service_Standards']
    },

    housekeeping: {
        path: '/components/pms/Housekeeping.tsx',
        configPoints: [
            'cleaningDuration',
            'inspectionRequired',
            'cleaningChecklist',
            'priorityRules'
        ],
        workflows: {
            cleaning: {
                steps: ['assign_room', 'clean', 'inspect', 'update_status'],
                configurable: true
            }
        },
        affectedBy: ['Housekeeping_SOP', 'Cleaning_Standards', 'Quality_Standards']
    },

    pos: {
        path: '/components/pos/POSDashboard.tsx',
        configPoints: [
            'serviceCharge',
            'taxRate',
            'menuCategories',
            'discountRules'
        ],
        workflows: {
            orderProcessing: {
                steps: ['take_order', 'send_to_kitchen', 'serve', 'bill'],
                configurable: true
            }
        },
        affectedBy: ['F&B_Service_Protocol', 'Service_Standards']
    },

    finance: {
        path: '/components/finance/FinanceDashboard.tsx',
        configPoints: [
            'accountingPeriod',
            'taxRates',
            'currencySettings',
            'approvalLimits'
        ],
        affectedBy: ['Financial_Policies', 'Accounting_Standards']
    },

    hr: {
        path: '/components/hr/HRDashboard.tsx',
        configPoints: [
            'rolePermissions',
            'departments',
            'reportingStructure',
            'shiftPatterns'
        ],
        affectedBy: ['Job_Descriptions', 'Org_Chart', 'HR_Policies']
    }
};

// CSS Variable Mappings
export const CSS_VARIABLES = {
    '--color-primary': {
        currentValue: '#8B5CF6',
        affects: ['buttons', 'headers', 'activeStates', 'charts', 'badges'],
        source: 'Brand_Color_Palette',
        cssFile: '/src/index.css',
        lineNumber: 15
    },
    '--color-accent': {
        currentValue: '#10B981',
        affects: ['successStates', 'cta', 'highlights'],
        source: 'Brand_Color_Palette',
        cssFile: '/src/index.css',
        lineNumber: 16
    },
    '--color-error': {
        currentValue: '#EF4444',
        affects: ['errorStates', 'warnings', 'validation'],
        source: 'Brand_Color_Palette',
        cssFile: '/src/index.css',
        lineNumber: 17
    },
    '--font-primary': {
        currentValue: 'Inter',
        affects: ['body', 'headers', 'ui'],
        source: 'Typography_Guidelines',
        cssFile: '/src/index.css',
        lineNumber: 10
    }
};

// Document-to-Component Mapping
export const DOCUMENT_MAPPINGS = {
    // Brand Assets
    'Brand_Color_Palette': {
        documentPattern: /color.*palette/i,
        affects: {
            css: {
                variables: ['--color-primary', '--color-accent', '--color-error', '--color-warning'],
                file: '/src/index.css'
            },
            components: ['all'] // Color changes affect all components
        },
        extractionRules: {
            colorCodes: /primary.*?(#[A-Fa-f0-9]{6})/i,
            accentCodes: /accent.*?(#[A-Fa-f0-9]{6})/i
        },
        autoApply: false // Requires admin approval
    },

    'Typography_Guidelines': {
        documentPattern: /typography|font/i,
        affects: {
            css: {
                variables: ['--font-primary', '--font-secondary', '--font-mono'],
                file: '/src/index.css'
            }
        },
        extractionRules: {
            primaryFont: /primary.*?font.*?:\s*([A-Za-z\s]+)/i,
            secondaryFont: /secondary.*?font.*?:\s*([A-Za-z\s]+)/i
        },
        autoApply: false
    },

    // SOPs
    'Front_Desk_Check-in': {
        documentPattern: /front.*desk.*check.*in|check.*in.*procedure/i,
        affects: {
            components: [
                '/components/pms/FrontDesk.tsx'
            ],
            workflows: ['checkIn'],
            configPoints: ['checkInTime', 'depositRequired', 'idVerification']
        },
        extractionRules: {
            checkInTime: /check.*in.*time.*?(\d{1,2}:\d{2})/i,
            depositRequired: /deposit\s+(required|mandatory|needed)/i,
            idCheck: /(?:passport|id|identification).*(?:required|mandatory|scan)/i
        },
        workflowImpact: {
            type: 'validation',
            severity: 'medium'
        },
        autoApply: false // Workflow changes need review
    },

    'Housekeeping_SOP': {
        documentPattern: /housekeeping.*(?:sop|standard|cleaning)/i,
        affects: {
            components: [
                '/components/pms/Housekeeping.tsx'
            ],
            workflows: ['cleaning', 'inspection'],
            configPoints: ['cleaningDuration', 'inspectionRequired', 'cleaningChecklist']
        },
        extractionRules: {
            cleaningTime: /cleaning.*?time.*?(\d+).*?minutes?/i,
            inspectionRequired: /inspection\s+(required|mandatory)/i,
            minimumStandard: /minimum.*standard|quality.*criteria/i
        },
        autoApply: false
    },

    'VIP_Protocol': {
        documentPattern: /vip.*(?:protocol|procedure|handling)/i,
        affects: {
            components: [
                '/components/pms/FrontDesk.tsx',
                '/components/pms/Housekeeping.tsx'
            ],
            workflows: ['checkIn', 'roomPreparation'],
            configPoints: ['vipAmenities', 'priorityService']
        },
        extractionRules: {
            vipTiers: /tier.*?(?:gold|platinum|diamond)/i,
            amenities: /amenity|welcome.*gift|upgrade/i
        },
        autoApply: false
    },

    // Job Descriptions
    'Front_Office_Manager_JD': {
        documentPattern: /front.*office.*manager.*(?:job|role|description)/i,
        affects: {
            components: [
                '/types.ts' // Permission matrix
            ],
            configPoints: ['rolePermissions', 'accessLevels']
        },
        extractionRules: {
            responsibilities: /responsibilit(?:y|ies).*?:\s*(.+?)(?:\n\n|$)/is,
            permissions: /access.*?to.*?(?:module|system)s?:\s*(.+?)(?:\n|$)/i
        },
        permissionImpact: {
            role: 'front_office_manager',
            affectedModules: ['front_desk', 'housekeeping', 'finance']
        },
        autoApply: false // Security impact
    }
};

// Workflow Pattern Recognition
export const WORKFLOW_PATTERNS = {
    'require_deposit': {
        keywords: ['deposit required', 'deposit mandatory', 'collect deposit'],
        target: 'frontDesk.checkIn',
        modification: 'add_validation_step',
        code: `
// Auto-generated validation step
if (requiresDeposit && !depositCollected) {
  throw new Error('Deposit collection required before room assignment');
}
`,
        risk: 'medium'
    },

    'passport_scan': {
        keywords: ['passport scan', 'id scan required', 'scan identification'],
        target: 'frontDesk.checkIn',
        modification: 'add_validation_step',
        code: `
// Auto-generated validation step
if (requiresPassportScan && !passportScanned) {
  showPassportScanDialog();
  return;
}
`,
        risk: 'low'
    },

    'inspection_mandatory': {
        keywords: ['inspection required', 'quality check mandatory', 'supervisor inspection'],
        target: 'housekeeping.cleaning',
        modification: 'add_validation_step',
        code: `
// Auto-generated validation step
if (inspectionRequired && !inspectionCompleted) {
  setRoomStatus('pending_inspection');
  return;
}
`,
        risk: 'low'
    },

    'vip_upgrade': {
        keywords: ['vip automatic upgrade', 'loyalty upgrade', 'complimentary upgrade'],
        target: 'frontDesk.checkIn',
        modification: 'add_business_logic',
        code: `
// Auto-generated VIP logic
if (guest.loyaltyTier in ['platinum', 'diamond'] && roomUpgradeAvailable()) {
  offerComplimentaryUpgrade();
}
`,
        risk: 'low'
    }
};

// Change Detection Rules
export const CHANGE_DETECTION_RULES = {
    colorChange: {
        pattern: /#[A-Fa-f0-9]{6}/g,
        significance: 'visual',
        autoExtract: true,
        requiresApproval: false // Colors are low risk
    },

    timeChange: {
        pattern: /\d{1,2}:\d{2}/g,
        significance: 'operational',
        autoExtract: true,
        requiresApproval: true // Time changes affect workflows
    },

    policyKeywords: {
        patterns: [
            /required|mandatory|must/i,
            /forbidden|prohibited|not allowed/i,
            /upgrade|complimentary|free/i
        ],
        significance: 'policy',
        autoExtract: true,
        requiresApproval: true
    },

    permissionKeywords: {
        patterns: [
            /access to|can access|permitted to/i,
            /responsible for|accountable for/i,
            /reports to|managed by/i
        ],
        significance: 'security',
        autoExtract: true,
        requiresApproval: true // Security critical
    }
};

// AI Pre-Training Context
export const AI_SYSTEM_CONTEXT = `
You are the Brand Standards AI for Hotel Singularity OS, a comprehensive property management system.

SYSTEM ARCHITECTURE:
The system consists of several interconnected modules:
- Front Desk (PMS): Guest check-in/out, reservations, room assignments
- Housekeeping: Room cleaning, maintenance, status tracking
- POS: Restaurant and bar operations, billing
- Finance: Accounting, reporting, reconciliation
- HR: Staff management, scheduling, payroll

CONFIGURATION APPROACH:
1. CSS Variables: Visual changes (colors, fonts) are applied via CSS custom properties
2. Component Props: Operational configs (times, requirements) passed as props
3. Workflow Logic: Business rules implemented in component state machines
4. Type Definitions: Permissions and roles defined in types.ts

ADAPTATION RULES:
When analyzing brand documents, identify:
1. Visual Changes: Color codes, typography → Update CSS variables
2. Operational Changes: Times, durations, requirements → Update config
3. Workflow Changes: New steps, validations, policies → Modify component logic
4. Permission Changes: Role updates, access levels → Update type definitions

SAFETY GUIDELINES:
- Visual changes (colors, fonts): Low risk, can auto-apply after confirmation
- Operational changes (times, policies): Medium risk, require admin review
- Workflow changes (new steps, validations): High risk, require detailed review
- Permission changes: Critical risk, require security review

RESPONSE FORMAT:
Always return adaptations as structured JSON:
{
  "documentId": "doc_xxx",
  "detectedChanges": [...],
  "proposedAdaptations": [
    {
      "type": "css" | "config" | "workflow" | "permission",
      "target": "file path or component",
      "change": "description",
      "risk": "low" | "medium" | "high" | "critical",
      "autoApply": boolean,
      "rollback": "rollback instructions"
    }
  ]
}

EXAMPLE SCENARIOS:
1. Color Palette Update:
   - Detect: Primary color #8B5CF6 → #10B981
   - Adapt: Update --color-primary in /src/index.css
   - Risk: Low
   - Auto-apply: Yes (after confirmation)

2. Check-in Time Change:
   - Detect: Check-in time 14:00 → 15:00
   - Adapt: Update checkInTime config in FrontDesk.tsx
   - Risk: Medium
   - Auto-apply: No (requires review)

3. New SOP Requirement:
   - Detect: "Passport scan required before room assignment"
   - Adapt: Add validation step to checkIn workflow
   - Risk: High
   - Auto-apply: No (requires detailed review)
`;

// Rollback Templates
export const ROLLBACK_TEMPLATES = {
    cssVariable: {
        type: 'css',
        template: (varName: string, oldValue: string) => ({
            file: '/src/index.css',
            action: 'replace',
            target: varName,
            value: oldValue,
            instructions: `Revert ${varName} to previous value: ${oldValue}`
        })
    },

    componentConfig: {
        type: 'config',
        template: (componentPath: string, configKey: string, oldValue: any) => ({
            file: componentPath,
            action: 'update_config',
            target: configKey,
            value: oldValue,
            instructions: `Restore ${configKey} to: ${JSON.stringify(oldValue)}`
        })
    },

    workflowStep: {
        type: 'workflow',
        template: (componentPath: string, stepId: string) => ({
            file: componentPath,
            action: 'remove_step',
            target: stepId,
            instructions: `Remove auto-generated validation step: ${stepId}`
        })
    }
};

// Export helper functions
export const getAffectedComponents = (documentTitle: string): string[] => {
    for (const [key, mapping] of Object.entries(DOCUMENT_MAPPINGS)) {
        if (mapping.documentPattern.test(documentTitle)) {
            return (mapping.affects as any).components || [];
        }
    }
    return [];
};

export const getExtractionRules = (documentTitle: string) => {
    for (const [key, mapping] of Object.entries(DOCUMENT_MAPPINGS)) {
        if (mapping.documentPattern.test(documentTitle)) {
            return mapping.extractionRules;
        }
    }
    return null;
};

export const shouldAutoApply = (documentTitle: string): boolean => {
    for (const [key, mapping] of Object.entries(DOCUMENT_MAPPINGS)) {
        if (mapping.documentPattern.test(documentTitle)) {
            return mapping.autoApply;
        }
    }
    return false;
};
