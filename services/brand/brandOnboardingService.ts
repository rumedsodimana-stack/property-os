/**
 * Hotel Singularity OS — Brand Onboarding Service
 *
 * Handles the brand profile collected during the Setup Wizard's Brand step.
 *
 * On completion:
 *  1. Saves brand profile to Firestore  hotels/{hotelId}/settings/brand
 *  2. Auto-generates the Brand Standards Main document (markdown) from inputs
 *  3. Seeds it into localStorage via saveMainStandardDocument so BrandStandards
 *     module picks it up immediately without a Firestore read
 *  4. Marks brandOnboardingComplete = true in settings/general
 *
 * On skip:
 *  - Saves brandOnboardingComplete = false to settings/general
 *  - BrandStandards module shows a banner CTA to complete later
 */

import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../kernel/firebase';
import {
  saveMainStandardDocument,
  getMainStandardDocument,
} from './mainBrandStandardService';

// ─── Types ────────────────────────────────────────────────────────────────────

export type BrandVoice   = 'formal' | 'warm' | 'luxury' | 'casual' | 'boutique';
export type BrandTier    = 'budget' | 'midscale' | 'upscale' | 'luxury' | 'ultra-luxury';
export type FontStyle    = 'serif' | 'sans-serif' | 'modern' | 'classic' | 'playful';

export interface BrandOnboardingPayload {
  // Identity
  hotelName:        string;
  tagline:          string;
  logoUrl:          string;

  // Color palette
  primaryColor:     string;   // hex — synced from Step 2 branding
  secondaryColor:   string;   // hex
  accentColor:      string;   // hex

  // Typography
  headingFont:      FontStyle;
  bodyFont:         FontStyle;

  // Brand positioning
  brandTier:        BrandTier;
  brandVoice:       BrandVoice;
  coreValues:       string[];  // up to 5 short values e.g. "Warmth", "Excellence"

  // Narrative
  guestPromise:     string;    // 1–2 sentences
  servicePhilosophy: string;   // 1–2 sentences
  targetGuest:      string;    // e.g. "Business travellers and leisure couples"

  // Status
  skipped:          boolean;
}

export const EMPTY_BRAND_PAYLOAD: BrandOnboardingPayload = {
  hotelName:        '',
  tagline:          '',
  logoUrl:          '',
  primaryColor:     '#6366f1',
  secondaryColor:   '#1e293b',
  accentColor:      '#f59e0b',
  headingFont:      'serif',
  bodyFont:         'sans-serif',
  brandTier:        'upscale',
  brandVoice:       'warm',
  coreValues:       ['Excellence', 'Warmth', 'Integrity'],
  guestPromise:     '',
  servicePhilosophy: '',
  targetGuest:      '',
  skipped:          false,
};

export const BRAND_VOICE_LABELS: Record<BrandVoice, string>  = {
  formal:  'Formal & Professional',
  warm:    'Warm & Welcoming',
  luxury:  'Luxury & Exclusive',
  casual:  'Casual & Friendly',
  boutique:'Boutique & Artistic',
};

export const BRAND_TIER_LABELS: Record<BrandTier, string>    = {
  budget:        'Budget / Economy',
  midscale:      'Midscale',
  upscale:       'Upscale',
  luxury:        'Luxury',
  'ultra-luxury':'Ultra-Luxury',
};

export const FONT_STYLE_LABELS: Record<FontStyle, string>    = {
  serif:     'Serif (Classic, editorial)',
  'sans-serif': 'Sans-Serif (Modern, clean)',
  modern:    'Modern (Geometric, minimal)',
  classic:   'Classic (Traditional, refined)',
  playful:   'Playful (Creative, expressive)',
};

export const FONT_STYLE_CSS: Record<FontStyle, string>       = {
  serif:       'Georgia, "Times New Roman", serif',
  'sans-serif':'Inter, "Segoe UI", sans-serif',
  modern:      '"DM Sans", "Helvetica Neue", sans-serif',
  classic:     '"Palatino Linotype", Palatino, serif',
  playful:     '"Nunito", "Varela Round", sans-serif',
};

export const PRESET_CORE_VALUES = [
  'Excellence', 'Warmth', 'Integrity', 'Innovation', 'Sustainability',
  'Elegance', 'Personalisation', 'Community', 'Heritage', 'Authenticity',
  'Discretion', 'Joy', 'Craftsmanship', 'Wellness', 'Adventure',
];

// ─── Firestore key ────────────────────────────────────────────────────────────

const BRAND_DOC_PATH = (hotelId: string) => `hotels/${hotelId}/settings/brand`;

// ─── Save brand profile ───────────────────────────────────────────────────────

export async function saveBrandProfile(
  hotelId: string,
  payload: BrandOnboardingPayload,
): Promise<void> {
  // 1. Write brand profile to Firestore
  await setDoc(doc(db, BRAND_DOC_PATH(hotelId)), {
    ...payload,
    updatedAt: serverTimestamp(),
  }, { merge: true });

  // 2. Mark onboarding status in settings/general
  await setDoc(
    doc(db, `hotels/${hotelId}/settings/general`),
    {
      brandOnboardingComplete: !payload.skipped,
      brandColor:  payload.primaryColor,
      tagline:     payload.tagline,
      logoUrl:     payload.logoUrl,
      updatedAt:   serverTimestamp(),
    },
    { merge: true },
  );

  // 3. If not skipped, seed the Brand Standards Main document in localStorage
  if (!payload.skipped) {
    const generated = generateBrandStandardsDoc(payload);
    const existing  = getMainStandardDocument();
    saveMainStandardDocument({
      ...existing,
      id:        'brand_main_standard',
      title:     `${payload.hotelName} — Brand Standards`,
      content:   generated,
      version:   (existing.version ?? 0) + 1,
      status:    'generated',
      generatedAt: new Date().toISOString(),
      updatedAt:   new Date().toISOString(),
      metadata: { mode: 'onboarding_generated', hotelId },
    });
  }
}

// ─── Read brand profile ───────────────────────────────────────────────────────

export async function getBrandProfile(hotelId: string): Promise<BrandOnboardingPayload | null> {
  try {
    const snap = await getDoc(doc(db, BRAND_DOC_PATH(hotelId)));
    if (!snap.exists()) return null;
    return snap.data() as BrandOnboardingPayload;
  } catch {
    return null;
  }
}

/** Check if brand onboarding has been completed for a hotel */
export async function getBrandOnboardingStatus(hotelId: string): Promise<{
  complete: boolean; skipped: boolean;
}> {
  try {
    const snap = await getDoc(doc(db, `hotels/${hotelId}/settings/general`));
    if (!snap.exists()) return { complete: false, skipped: false };
    const d = snap.data();
    return {
      complete: d.brandOnboardingComplete === true,
      skipped:  d.brandOnboardingComplete === false && d.setupComplete === true,
    };
  } catch {
    return { complete: true, skipped: false }; // fail-safe: don't block the UI
  }
}

// ─── Brand Standards document generator ──────────────────────────────────────

/**
 * Auto-generates the Brand Standards Main markdown document
 * from the brand onboarding form data.
 */
export function generateBrandStandardsDoc(p: BrandOnboardingPayload): string {
  const now = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const valuesLine = p.coreValues.length > 0
    ? p.coreValues.map(v => `- ${v}`).join('\n')
    : '- Not yet defined';

  const colorSection = [
    `- **Primary:** ${p.primaryColor}`,
    `- **Secondary:** ${p.secondaryColor}`,
    `- **Accent:** ${p.accentColor}`,
  ].join('\n');

  const fontSection = [
    `- **Headings:** ${FONT_STYLE_LABELS[p.headingFont]} (${p.headingFont})`,
    `- **Body:** ${FONT_STYLE_LABELS[p.bodyFont]} (${p.bodyFont})`,
  ].join('\n');

  return [
    `# ${p.hotelName} — Brand Standards`,
    '',
    `*Generated: ${now} · Auto-seeded from Brand Onboarding Wizard*`,
    '',
    '---',
    '',
    '## 1. Brand Identity',
    '',
    `**Hotel:** ${p.hotelName}`,
    p.tagline ? `**Tagline:** *"${p.tagline}"*` : '',
    `**Brand Tier:** ${BRAND_TIER_LABELS[p.brandTier]}`,
    `**Brand Voice:** ${BRAND_VOICE_LABELS[p.brandVoice]}`,
    p.targetGuest ? `**Target Guest:** ${p.targetGuest}` : '',
    '',
    '## 2. Core Values',
    '',
    valuesLine,
    '',
    '## 3. Guest Promise',
    '',
    p.guestPromise
      ? `> ${p.guestPromise}`
      : '> *Not yet defined — add your guest promise in Brand Standards.*',
    '',
    '## 4. Service Philosophy',
    '',
    p.servicePhilosophy
      ? p.servicePhilosophy
      : '*Not yet defined — describe your service philosophy here.*',
    '',
    '## 5. Visual Identity',
    '',
    '### Color Palette',
    '',
    colorSection,
    '',
    '### Typography',
    '',
    fontSection,
    '',
    p.logoUrl ? `### Logo\n\n![Hotel Logo](${p.logoUrl})` : '### Logo\n\n*Logo not yet uploaded — use the Brand Assets tab to upload.*',
    '',
    '---',
    '',
    '## 6. Brand Compliance Notes',
    '',
    '- All guest-facing materials must use the primary brand color palette.',
    '- Staff communication should reflect the brand voice at all times.',
    '- SOPs and training materials should be uploaded to the Documents tab.',
    '- AI responses are governed by the brand voice defined in the AI Brain tab.',
    '',
    '---',
    '',
    '*This document was auto-generated from the Hotel Setup Wizard. Edit it here or upload supplementary brand guideline documents using the Documents tab.*',
  ].filter(line => line !== null && line !== undefined).join('\n');
}
