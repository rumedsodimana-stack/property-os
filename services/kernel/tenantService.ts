import { internalAuthService } from './internalAuthService';

const ACTIVE_PROPERTY_KEY = 'hs_active_property';
const PROPERTY_ALIASES: Record<string, string> = {
  H1: 'demo_property_h1',
  H2: 'demo_property_h2',
};

const isNonEmpty = (val?: string | null) => !!val && val.trim().length > 0;
const normalizePropertyId = (val?: string | null): string | null => {
  if (!isNonEmpty(val)) return null;
  const trimmed = val!.trim();
  return PROPERTY_ALIASES[trimmed] || trimmed;
};

const pickPropertyId = (): string | null => {
  const ls = typeof localStorage !== 'undefined' ? localStorage : null;
  const session = internalAuthService.getSession();
  const sessionProperty = normalizePropertyId(session?.hotelId);
  const stored = normalizePropertyId(ls?.getItem(ACTIVE_PROPERTY_KEY));
  // Only use env var — never fall back to a hardcoded demo id for real enrolled hotels.
  const envDefault = normalizePropertyId(import.meta.env.VITE_DEFAULT_PROPERTY_ID || null);

  // GM can override active property from the sidebar switcher.
  if (session?.role === 'GM' && isNonEmpty(stored)) return stored!;
  if (isNonEmpty(sessionProperty)) return sessionProperty!;
  if (isNonEmpty(stored)) return stored!;
  if (isNonEmpty(envDefault)) return envDefault!;
  return null;
};

export const tenantService = {
  /** Returns the active propertyId, throws if none is configured. */
  getActivePropertyId(): string {
    const propertyId = pickPropertyId();
    if (!isNonEmpty(propertyId)) {
      throw new Error('[Tenant] No active property selected. Multi-tenancy requires propertyId.');
    }
    // Persist for subsequent reads (especially when sourced from session)
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ACTIVE_PROPERTY_KEY, propertyId!);
    }
    return propertyId!;
  },

  /** Explicitly sets the active propertyId (e.g., property switcher UI). */
  setActivePropertyId(propertyId: string) {
    const nextPropertyId = normalizePropertyId(propertyId);
    if (!isNonEmpty(nextPropertyId)) {
      throw new Error('[Tenant] Cannot set empty propertyId.');
    }
    const session = internalAuthService.getSession();
    const sessionProperty = normalizePropertyId(session?.hotelId);
    if (sessionProperty && sessionProperty !== nextPropertyId && session.role !== 'GM') {
      throw new Error('[Tenant] Cross-property access denied for this role.');
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ACTIVE_PROPERTY_KEY, nextPropertyId!);
    }
  },

  /** Clears stored property (used on logout). */
  clear() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(ACTIVE_PROPERTY_KEY);
    }
  }
};
