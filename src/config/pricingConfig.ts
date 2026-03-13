/**
 * Hotel Singularity — Shared Pricing Configuration
 *
 * Single source of truth for all plan data.
 * Used by: WebsiteLanding (public website) + SuperAdminApp (operator panel)
 *
 * To change pricing, update this file OR update via the SuperAdmin panel
 * which will eventually write to Firestore and hot-reload these values.
 */

export interface PlanFeature {
  label: string;
  included: boolean;
}

export interface PricingPlan {
  id: 'starter' | 'professional' | 'enterprise';
  name: string;
  tagline: string;
  monthlyPrice: number;          // Full price (USD/month)
  launchDiscountPct: number;     // e.g. 50 = 50% off, 0 = no discount
  launchDiscountMonths: number;  // How many months the discount applies
  roomRange: string;             // Display label e.g. "1 – 80 rooms"
  maxRooms: number | null;       // null = unlimited
  minRooms: number;
  maxUsers: number | null;       // null = unlimited
  color: 'emerald' | 'indigo' | 'amber';
  highlight: boolean;            // true = "Most Popular" badge
  ctaLabel: string;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'Perfect for independent boutique hotels.',
    monthlyPrice: 690,
    launchDiscountPct: 50,
    launchDiscountMonths: 3,
    roomRange: '1 – 80 rooms',
    minRooms: 1,
    maxRooms: 80,
    maxUsers: 25,
    color: 'emerald',
    highlight: false,
    ctaLabel: 'Enroll on Starter',
  },
  {
    id: 'professional',
    name: 'Professional',
    tagline: 'For growing mid-size properties.',
    monthlyPrice: 1600,
    launchDiscountPct: 50,
    launchDiscountMonths: 3,
    roomRange: '81 – 200 rooms',
    minRooms: 81,
    maxRooms: 200,
    maxUsers: 60,
    color: 'indigo',
    highlight: true,
    ctaLabel: 'Enroll on Professional',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Full power for large properties & chains.',
    monthlyPrice: 3900,
    launchDiscountPct: 50,
    launchDiscountMonths: 3,
    roomRange: '200+ rooms',
    minRooms: 201,
    maxRooms: null,
    maxUsers: null,
    color: 'amber',
    highlight: false,
    ctaLabel: 'Enroll on Enterprise',
  },
];

/** All modules included in every plan (no module gating) */
export const ALL_MODULES = [
  'Property Management System (PMS)',
  'Point of Sale (POS) — F&B, Spa, Retail',
  'Revenue Management System (RMS)',
  'Customer Relationship Management (CRM)',
  'Channel Manager — OTA sync',
  'Human Capital Management (HCM)',
  'Finance & ERP',
  'Building Management System (BMS)',
  'Procurement & Inventory',
  'Engineering & Maintenance',
  'Security Console',
  'Events & Group Management',
  'Guest-Facing Web App',
  'AI Command Centre (Gemini-powered)',
  'Real-time Analytics & Reporting',
  'Multi-property / Cluster Support',
];

/** Helper: compute discounted price */
export const getDiscountedPrice = (plan: PricingPlan): number =>
  plan.launchDiscountPct > 0
    ? Math.round(plan.monthlyPrice * (1 - plan.launchDiscountPct / 100))
    : plan.monthlyPrice;

/** Helper: color map → Tailwind classes (dark OS theme) */
export const PLAN_COLOR_MAP: Record<string, { badge: string; border: string; button: string; text: string }> = {
  emerald: {
    badge: 'bg-emerald-900 text-emerald-300',
    border: 'border-emerald-700',
    button: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    text: 'text-emerald-400',
  },
  indigo: {
    badge: 'bg-violet-900 text-violet-300',
    border: 'border-violet-600',
    button: 'bg-violet-600 hover:bg-violet-500 text-white',
    text: 'text-violet-400',
  },
  amber: {
    badge: 'bg-amber-900 text-amber-300',
    border: 'border-amber-700',
    button: 'bg-amber-500 hover:bg-amber-400 text-black',
    text: 'text-amber-400',
  },
};
