/**
 * 5-theme system — Hotel Singularity OS
 * Consistent structure, distinct visuals per theme
 */

export type ThemeId = 'paraiso' | 'command' | 'bento' | 'glass' | 'terminal';

export interface ThemeTokens {
  id: ThemeId;
  name: string;
  /* Core palette */
  bg: string;
  surface: string;
  surfaceAlt: string;
  card: string;
  accent: string;
  accentHover: string;
  accentSubtle: string;
  text: string;
  textMuted: string;
  border: string;
  /* Component-specific */
  sidebarBg: string;
  navActiveBg: string;
  inputBg: string;
  /* Typography */
  fontSans: string;
  fontMono: string;
  /* Effects */
  shadow: string;
  radius: string;
  blur?: string;
}

export const THEMES: Record<ThemeId, ThemeTokens> = {
  paraiso: {
    id: 'paraiso',
    name: 'Light',
    bg: '#fafaf9',
    surface: 'rgba(255,255,255,0.6)',
    surfaceAlt: 'rgba(255,255,255,0.4)',
    card: 'rgba(255,255,255,0.4)',
    accent: '#0d9488',
    accentHover: '#0f766e',
    accentSubtle: 'rgba(13,148,136,0.15)',
    text: '#292524',
    textMuted: '#78716c',
    border: 'rgba(255,255,255,0.2)',
    sidebarBg: 'rgba(255,255,255,0.4)',
    navActiveBg: 'rgba(13,148,136,0.15)',
    inputBg: 'rgba(255,255,255,0.4)',
    fontSans: '"DM Sans", system-ui, sans-serif',
    fontMono: '"JetBrains Mono", "Fira Code", monospace',
    shadow: '0 4px 24px rgba(120,113,108,0.15)',
    radius: '1rem',
  },
  command: {
    id: 'command',
    name: 'Dark',
    bg: '#0c0a09',
    surface: 'rgba(255,255,255,0.05)',
    surfaceAlt: 'rgba(255,255,255,0.08)',
    card: 'rgba(255,255,255,0.08)',
    accent: '#2dd4bf',
    accentHover: '#5eead4',
    accentSubtle: 'rgba(45,212,191,0.15)',
    text: '#fafaf9',
    textMuted: '#a8a29e',
    border: 'rgba(255,255,255,0.1)',
    sidebarBg: 'rgba(255,255,255,0.05)',
    navActiveBg: 'rgba(45,212,191,0.15)',
    inputBg: 'rgba(255,255,255,0.05)',
    fontSans: '"DM Sans", system-ui, sans-serif',
    fontMono: '"JetBrains Mono", monospace',
    shadow: '0 4px 24px rgba(0,0,0,0.3)',
    radius: '1rem',
  },
  bento: {
    id: 'bento',
    name: 'Bento',
    bg: '#fafaf9',
    surface: 'rgba(255,255,255,0.5)',
    surfaceAlt: 'rgba(255,255,255,0.35)',
    card: 'rgba(255,255,255,0.4)',
    accent: '#0d9488',
    accentHover: '#0f766e',
    accentSubtle: 'rgba(13,148,136,0.12)',
    text: '#292524',
    textMuted: '#78716c',
    border: 'rgba(255,255,255,0.2)',
    sidebarBg: 'rgba(255,255,255,0.4)',
    navActiveBg: 'rgba(13,148,136,0.12)',
    inputBg: 'rgba(255,255,255,0.4)',
    fontSans: '"DM Sans", system-ui, sans-serif',
    fontMono: '"Geist Mono", monospace',
    shadow: '0 2px 8px rgba(120,113,108,0.08)',
    radius: '1rem',
  },
  glass: {
    id: 'glass',
    name: 'Glassmorphism',
    bg: 'linear-gradient(135deg, #0d9488 0%, #134e4a 100%)',
    surface: 'rgba(255,255,255,0.15)',
    surfaceAlt: 'rgba(255,255,255,0.08)',
    card: 'rgba(255,255,255,0.2)',
    accent: '#2dd4bf',
    accentHover: 'rgba(255,255,255,0.9)',
    accentSubtle: 'rgba(255,255,255,0.2)',
    text: '#ffffff',
    textMuted: 'rgba(255,255,255,0.85)',
    border: 'rgba(255,255,255,0.2)',
    sidebarBg: 'rgba(255,255,255,0.1)',
    navActiveBg: 'rgba(255,255,255,0.2)',
    inputBg: 'rgba(255,255,255,0.12)',
    fontSans: '"DM Sans", system-ui, sans-serif',
    fontMono: '"Geist Mono", monospace',
    shadow: '0 8px 32px rgba(0,0,0,0.2)',
    radius: '1rem',
    blur: '12px',
  },
  terminal: {
    id: 'terminal',
    name: 'Terminal',
    bg: '#0c0a09',
    surface: 'rgba(255,255,255,0.03)',
    surfaceAlt: 'rgba(255,255,255,0.05)',
    card: 'rgba(255,255,255,0.05)',
    accent: '#2dd4bf',
    accentHover: '#5eead4',
    accentSubtle: 'rgba(45,212,191,0.15)',
    text: '#d6d3d1',
    textMuted: '#a8a29e',
    border: 'rgba(255,255,255,0.08)',
    sidebarBg: '#080808',
    navActiveBg: 'rgba(45,212,191,0.15)',
    inputBg: '#0c0a09',
    fontSans: '"JetBrains Mono", "Fira Code", monospace',
    fontMono: '"JetBrains Mono", monospace',
    shadow: 'none',
    radius: '0.5rem',
  },
};
