/**
 * Intelligent Document Analyzer
 * 
 * Combines document parsing + real AI to deeply understand brand documents
 * and propose precise system adaptations.
 */

import { BrandDocument } from '../../types';
import { aiProvider } from '../intelligence/aiProvider';
import { documentParser, ParsedDocument } from '../kernel/documentParser';
import { SystemAdaptation } from './brandStandardsAIService';

export interface IntelligentAnalysis {
    documentId: string;
    rawData: ParsedDocument;
    aiAnalysis: {
        summary: string;
        extractedData: {
            colors?: Record<string, string>;
            times?: Record<string, string>;
            policies?: Array<{
                requirement: string;
                mandatory: boolean;
                affectedAreas: string[];
            }>;
            workflows?: Array<{
                name: string;
                steps: string[];
                timing?: string;
            }>;
            permissions?: Array<{
                role: string;
                access: string[];
            }>;
        };
        confidence: number;
    };
    proposedAdaptations: SystemAdaptation[];
    timestamp: string;
}

class IntelligentAnalyzer {
    /**
     * Fully analyze a brand document
     */
    async analyzeDocument(
        doc: BrandDocument,
        file?: File
    ): Promise<IntelligentAnalysis> {
        console.log(`[Intelligent Analyzer] Analyzing document: ${doc.title}`);

        // Step 1: Parse document (if file provided)
        let parsedDoc: ParsedDocument | null = null;
        if (file) {
            if (file.type === 'application/pdf') {
                parsedDoc = await documentParser.parsePDF(file, {
                    extractImages: true,
                    performOCR: true,
                    preserveFormatting: true
                });
            } else if (file.type.startsWith('image/')) {
                parsedDoc = await documentParser.parseImage(file);
            }
        }

        // Step 2: Rule-based extraction (fast, cheap)
        const ruleBasedExtraction = this.ruleBasedExtraction(
            parsedDoc?.text || doc.description,
            doc
        );

        // Step 3: AI Analysis (slow, expensive, but intelligent)
        const aiAnalysis = await this.aiAnalysis(
            parsedDoc?.text || doc.description,
            doc.category,
            ruleBasedExtraction
        );

        // Step 4: Combine results (AI corrects rule-based errors)
        const mergedData = this.mergeExtractions(ruleBasedExtraction, aiAnalysis.extractedData);

        // Step 5: Generate system adaptations
        const adaptations = await this.generateAdaptations(doc, mergedData);

        return {
            documentId: doc.id,
            rawData: parsedDoc || {
                text: doc.description,
                images: [],
                tables: [],
                metadata: { pageCount: 1 }
            },
            aiAnalysis: {
                ...aiAnalysis,
                extractedData: mergedData
            },
            proposedAdaptations: adaptations,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Rule-based extraction (fast, deterministic)
     */
    private ruleBasedExtraction(text: string, doc: BrandDocument): any {
        const colors = documentParser.extractColors(text);
        const times = documentParser.extractTimes(text);
        const policies = documentParser.extractPolicies(text);

        // Use metadata if available
        const metadata = doc.metadata || {};

        return {
            colors: Object.keys(colors).length > 0 ? colors : metadata.colors,
            times: Object.keys(times).length > 0 ? times : {
                checkInTime: metadata.checkInTime,
                checkOutTime: metadata.checkOutTime,
                cleaningTime: metadata.cleaningTime
            },
            policies: policies.map(p => ({
                requirement: p,
                mandatory: /required|mandatory|must/i.test(p),
                affectedAreas: this.inferAffectedAreas(p, doc.category)
            })),
            workflows: [],
            permissions: []
        };
    }

    /**
     * AI-powered analysis (slow, intelligent)
     */
    private async aiAnalysis(
        text: string,
        category: string,
        hintData: any
    ): Promise<{
        summary: string;
        extractedData: any;
        confidence: number;
    }> {
        try {
            // Different analysis based on document type
            let analysisType: 'full' | 'colors' | 'policies' | 'workflows' = 'full';

            if (category === 'asset') {
                analysisType = 'colors';
            } else if (category === 'sop') {
                analysisType = 'workflows';
            } else if (category === 'guideline') {
                analysisType = 'policies';
            }

            const response = await aiProvider.analyzeDocument(text, category, analysisType);

            // Parse AI response
            let extractedData = {};
            try {
                // Try to extract JSON from response
                const jsonMatch = response.content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    extractedData = JSON.parse(jsonMatch[0]);
                }
            } catch (e) {
                console.warn('[AI Analysis] Failed to parse JSON, using rule-based data');
                extractedData = hintData;
            }

            return {
                summary: `AI analyzed ${category} document`,
                extractedData,
                confidence: (extractedData as any).confidence || 0.7
            };
        } catch (error: any) {
            console.error('[AI Analysis] Error:', error.message);

            // Fallback to rule-based if AI fails
            return {
                summary: 'Fallback to rule-based analysis (AI unavailable)',
                extractedData: hintData,
                confidence: 0.5
            };
        }
    }

    /**
     * Merge rule-based and AI extractions
     */
    private mergeExtractions(ruleBased: any, aiExtracted: any): any {
        // AI takes precedence, but fall back to rules
        return {
            colors: aiExtracted.colors || ruleBased.colors || {},
            times: aiExtracted.times || ruleBased.times || {},
            policies: aiExtracted.policies || ruleBased.policies || [],
            workflows: aiExtracted.workflows || ruleBased.workflows || [],
            permissions: aiExtracted.permissions || ruleBased.permissions || []
        };
    }

    /**
     * Generate system adaptations from extracted data
     */
    private async generateAdaptations(
        doc: BrandDocument,
        extractedData: any
    ): Promise<SystemAdaptation[]> {
        const adaptations: SystemAdaptation[] = [];

        // Color adaptations
        if (extractedData.colors) {
            Object.entries(extractedData.colors).forEach(([colorName, colorValue]) => {
                if (typeof colorValue === 'string' && colorValue.startsWith('#')) {
                    adaptations.push({
                        id: `adapt_${Date.now()}_${colorName}`,
                        changeId: `change_${doc.id}`,
                        documentId: doc.id,
                        type: 'css',
                        targetFile: '/src/index.css',
                        targetLine: this.getCSSLineNumber(colorName),
                        proposedChange: `Update --color-${colorName} to ${colorValue}`,
                        currentValue: this.getCurrentCSSValue(colorName),
                        newValue: colorValue,
                        risk: 'low',
                        autoApply: false,
                        rollbackPlan: `Revert --color-${colorName} to previous value`,
                        affectedModules: ['all'],
                        confidence: 0.95
                    });
                }
            });
        }

        // Time adaptations
        if (extractedData.times) {
            Object.entries(extractedData.times).forEach(([timeKey, timeValue]) => {
                if (typeof timeValue === 'string') {
                    const module = this.getModuleForTime(timeKey);
                    if (module) {
                        adaptations.push({
                            id: `adapt_${Date.now()}_${timeKey}`,
                            changeId: `change_${doc.id}`,
                            documentId: doc.id,
                            type: 'config',
                            targetFile: module.file,
                            proposedChange: `Update ${timeKey} to ${timeValue}`,
                            currentValue: module.currentValue,
                            newValue: timeValue,
                            risk: 'medium',
                            autoApply: false,
                            rollbackPlan: `Revert ${timeKey} to ${module.currentValue}`,
                            affectedModules: [module.module],
                            confidence: 0.90
                        });
                    }
                }
            });
        }

        // Policy adaptations (workflows)
        if (extractedData.policies && Array.isArray(extractedData.policies)) {
            extractedData.policies.forEach((policy: any) => {
                if (policy.mandatory) {
                    adaptations.push({
                        id: `adapt_${Date.now()}_policy`,
                        changeId: `change_${doc.id}`,
                        documentId: doc.id,
                        type: 'workflow',
                        targetFile: this.getFileForAreas(policy.affectedAreas),
                        proposedChange: `Implement policy: ${policy.requirement}`,
                        currentValue: 'no_policy',
                        newValue: policy.requirement,
                        risk: 'high',
                        autoApply: false,
                        rollbackPlan: 'Remove policy validation',
                        affectedModules: policy.affectedAreas || ['system'],
                        confidence: 0.75
                    });
                }
            });
        }

        return adaptations;
    }

    /**
     * Helper: Infer affected areas from text
     */
    private inferAffectedAreas(text: string, category: string): string[] {
        const lower = text.toLowerCase();
        const areas: string[] = [];

        if (lower.includes('check-in') || lower.includes('check in') || lower.includes('front desk')) {
            areas.push('front_desk');
        }
        if (lower.includes('housekeeping') || lower.includes('cleaning')) {
            areas.push('housekeeping');
        }
        if (lower.includes('restaurant') || lower.includes('f&b') || lower.includes('food')) {
            areas.push('pos');
        }
        if (lower.includes('guest') || lower.includes('service')) {
            areas.push('guest_service');
        }

        if (areas.length === 0 && category === 'sop') {
            return ['operations'];
        }

        return areas;
    }

    /**
     * Helper: Get CSS line number for color variable
     */
    private getCSSLineNumber(colorName: string): number {
        const mapping: Record<string, number> = {
            'primary': 15,
            'accent': 16,
            'error': 17,
            'warning': 18,
            'success': 19
        };
        return mapping[colorName.toLowerCase()] || 15;
    }

    /**
     * Helper: Get current CSS value
     */
    private getCurrentCSSValue(colorName: string): string {
        const mapping: Record<string, string> = {
            'primary': '#8B5CF6',
            'accent': '#10B981',
            'error': '#EF4444',
            'warning': '#F59E0B',
            'success': '#10B981'
        };
        return mapping[colorName.toLowerCase()] || '#8B5CF6';
    }

    /**
     * Helper: Get module info for time setting
     */
    private getModuleForTime(timeKey: string): {
        file: string;
        module: string;
        currentValue: string;
    } | null {
        const mapping: Record<string, any> = {
            'checkInTime': {
                file: '/components/pms/FrontDesk.tsx',
                module: 'front_desk',
                currentValue: '14:00'
            },
            'checkOutTime': {
                file: '/components/pms/FrontDesk.tsx',
                module: 'front_desk',
                currentValue: '11:00'
            },
            'cleaningTime': {
                file: '/components/pms/Housekeeping.tsx',
                module: 'housekeeping',
                currentValue: '25 minutes'
            }
        };
        return mapping[timeKey] || null;
    }

    /**
     * Helper: Get file for affected areas
     */
    private getFileForAreas(areas: string[]): string {
        if (areas.includes('front_desk')) {
            return '/components/pms/FrontDesk.tsx';
        }
        if (areas.includes('housekeeping')) {
            return '/components/pms/Housekeeping.tsx';
        }
        if (areas.includes('pos')) {
            return '/components/pos/POSDashboard.tsx';
        }
        return '/App.tsx';
    }
}

// Export singleton
export const intelligentAnalyzer = new IntelligentAnalyzer();

// Export class for testing
export default IntelligentAnalyzer;
