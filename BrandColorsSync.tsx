import React, { useEffect } from 'react';
import { getPropertyConfig, PROPERTY_CONFIG_UPDATED_EVENT } from './services/kernel/persistence';

const hexToRgb = (hex: string, fallback: string): string => {
  const value = (hex || '').replace(/^#/, '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(value)) return fallback;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
};

const hasColor = (v: string | undefined): boolean =>
  Boolean((v || '').trim().length);

/** Sync brand colors from Property Config to CSS variables. Call after saving. */
export const syncBrandColors = (): void => {
  const config = getPropertyConfig();
  const primary = (config?.branding?.primaryColor || '').trim();
  const secondary = (config?.branding?.secondaryColor || '').trim();
  const root = document.documentElement;

  const pOpacity = hasColor(primary) ? '0.1' : '0';
  const sOpacity = hasColor(secondary) ? '0.1' : '0';
  const pRgb = hasColor(primary) ? hexToRgb(primary, '139, 92, 246') : '0, 0, 0';
  const sRgb = hasColor(secondary) ? hexToRgb(secondary, '16, 185, 129') : '0, 0, 0';

  if (hasColor(primary)) root.style.setProperty('--brand-primary', primary);
  else root.style.removeProperty('--brand-primary');
  if (hasColor(secondary)) root.style.setProperty('--brand-secondary', secondary);
  else root.style.removeProperty('--brand-secondary');
  root.style.setProperty('--brand-primary-rgb', pRgb);
  root.style.setProperty('--brand-secondary-rgb', sRgb);
  root.style.setProperty('--brand-primary-opacity', pOpacity);
  root.style.setProperty('--brand-secondary-opacity', sOpacity);
};

/**
 * Syncs brand colors from Property Config (Brand Standards) to CSS variables.
 * When primary/secondary are set in Configuration → Property Profile → Branding,
 * glows and accents use these; when empty, no color/glow is shown.
 */
const BrandColorsSync: React.FC = () => {
  const apply = React.useCallback(() => syncBrandColors(), []);

  useEffect(() => {
    apply();
    const handler = () => apply();
    window.addEventListener(PROPERTY_CONFIG_UPDATED_EVENT, handler);
    return () => window.removeEventListener(PROPERTY_CONFIG_UPDATED_EVENT, handler);
  }, [apply]);

  return null;
};

export default BrandColorsSync;
