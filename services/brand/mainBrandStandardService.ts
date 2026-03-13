import { BrandDocument, BrandMainStandardDocument } from '../../types';

const MAIN_STANDARD_STORAGE_KEY = 'brand_main_standard_v1';

export const BRAND_SUPPORT_CATEGORY_ORDER: BrandDocument['category'][] = [
    'guideline',
    'asset',
    'sop',
    'job_description',
    'license',
    'certificate',
    'agreement',
    'system_doc'
];

export const BRAND_SUPPORT_CATEGORY_LABELS: Record<BrandDocument['category'], string> = {
    guideline: 'Guidelines',
    asset: 'Brand Assets',
    sop: 'SOPs',
    job_description: 'Job Descriptions',
    license: 'Licenses',
    certificate: 'Certificates',
    agreement: 'Agreements',
    system_doc: 'AI Brain Documents'
};

const nowIso = () => new Date().toISOString();
const MAX_EXCERPT_CHARS = 1200;

const isBrandMainStandardDocument = (value: any): value is BrandMainStandardDocument => {
    return !!value &&
        typeof value === 'object' &&
        typeof value.id === 'string' &&
        typeof value.title === 'string' &&
        typeof value.content === 'string' &&
        typeof value.version === 'number';
};

export const createBlankMainStandardDocument = (): BrandMainStandardDocument => {
    const now = nowIso();
    return {
        id: 'brand_main_standard',
        title: 'Brand Standards Main',
        content: [
            '# Brand Standards Main',
            '',
            '## Purpose',
            '- Define your hotel brand operating principles and compliance baseline.',
            '',
            '## Voice, Service, and Guest Promise',
            '- Add service ethos, tone, and non-negotiable standards.',
            '',
            '## Source Link Register',
            '- No linked documents yet.',
            '',
            '## AI Brain Reference',
            '- AI brain link not generated yet.'
        ].join('\n'),
        version: 1,
        status: 'draft',
        generatedAt: now,
        updatedAt: now,
        linkedDocumentIds: [],
        linkedCategories: [],
        metadata: {
            mode: 'blank_template'
        }
    };
};

const safeRead = (): BrandMainStandardDocument | null => {
    try {
        const raw = localStorage.getItem(MAIN_STANDARD_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!isBrandMainStandardDocument(parsed)) return null;
        return parsed;
    } catch {
        return null;
    }
};

const safeWrite = (doc: BrandMainStandardDocument) => {
    try {
        localStorage.setItem(MAIN_STANDARD_STORAGE_KEY, JSON.stringify(doc));
    } catch {
        // Ignore storage write failures to avoid breaking Brand Standards UI.
    }
};

export const getMainStandardDocument = (): BrandMainStandardDocument => {
    return safeRead() || createBlankMainStandardDocument();
};

export const saveMainStandardDocument = (document: BrandMainStandardDocument) => {
    const normalized: BrandMainStandardDocument = {
        ...document,
        updatedAt: nowIso()
    };
    safeWrite(normalized);
    return normalized;
};

export const generateMainStandardDocument = (
    documents: BrandDocument[],
    aiBrainContent: string,
    previous?: BrandMainStandardDocument
): BrandMainStandardDocument => {
    const generatedAt = nowIso();
    const grouped: Record<BrandDocument['category'], BrandDocument[]> = {
        asset: [],
        license: [],
        certificate: [],
        guideline: [],
        sop: [],
        agreement: [],
        job_description: [],
        system_doc: []
    };

    documents.forEach(document => {
        grouped[document.category].push(document);
    });

    const getDocExcerpt = (document: BrandDocument): string => {
        const rawText = String(document.metadata?.textContent || '').trim();
        if (rawText) {
            return rawText.length > MAX_EXCERPT_CHARS
                ? `${rawText.slice(0, MAX_EXCERPT_CHARS)}...`
                : rawText;
        }
        const fallback = `${document.description || 'No summary available for this file.'}`.trim();
        return fallback;
    };

    const sourceLines = BRAND_SUPPORT_CATEGORY_ORDER.flatMap(category => {
        const docs = grouped[category] || [];
        const header = `## ${BRAND_SUPPORT_CATEGORY_LABELS[category]}`;
        if (docs.length === 0) {
            return [header, '- Missing. Add a supporting document for this category.', ''];
        }

        const lines = docs.flatMap(doc => {
            const uploadedDate = new Date(doc.uploadedAt).toLocaleDateString();
            const tagText = (doc.tags || []).length > 0 ? (doc.tags || []).join(', ') : 'none';
            const excerpt = getDocExcerpt(doc);
            const fileUrl = String(doc.fileUrl || '').trim();
            const directFileLine = fileUrl
                ? `- Direct File Link: [Open Source File](${fileUrl})`
                : '- Direct File Link: Not available';
            return [
                `### ${doc.title}`,
                `- Internal Link: [Open In Brand Standards](doc://${doc.id})`,
                directFileLine,
                `- Category: ${BRAND_SUPPORT_CATEGORY_LABELS[doc.category]}`,
                `- Version: ${doc.version}`,
                `- Status: ${doc.status.replace('_', ' ')}`,
                `- Uploaded: ${uploadedDate}`,
                `- Tags: ${tagText}`,
                '',
                '#### Included Content',
                excerpt,
                ''
            ];
        });

        return [header, ...lines];
    });

    const aiBrainState = aiBrainContent.trim()
        ? `Custom AI brain linked (${aiBrainContent.trim().length} chars).`
        : 'No custom AI brain yet. System default charter is active.';

    const content = [
        '# Brand Standards Main',
        '',
        `Generated: ${new Date(generatedAt).toLocaleString()}`,
        '',
        '## Purpose',
        '- Unified source of truth generated from linked brand standards documents.',
        '- Each section below contains summarized or extracted content and a direct file link.',
        '',
        '## Integrated Standards Body',
        ...sourceLines,
        '## AI Brain Reference',
        `- ${aiBrainState}`,
        '- Manage AI provider/model/keys from Configuration > AI Configurations.'
    ].join('\n');

    const nextDoc: BrandMainStandardDocument = {
        id: previous?.id || 'brand_main_standard',
        title: 'Brand Standards Main',
        content,
        version: (previous?.version || 0) + 1,
        status: 'generated',
        generatedAt,
        updatedAt: generatedAt,
        linkedDocumentIds: documents.map(doc => doc.id),
        linkedCategories: Array.from(new Set(documents.map(doc => doc.category))),
        metadata: {
            linkedCount: documents.length
        }
    };

    safeWrite(nextDoc);
    return nextDoc;
};
