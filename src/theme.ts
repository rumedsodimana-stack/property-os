/**
 * Paraíso theme — Hotel Singularity OS
 * Light, fresh, user-friendly (Paraíso Tours / Paraíso Ceylon style)
 */

export const colors = {
  /* Paraíso palette */
  paraBg: "#f8fcfb",
  paraSurface: "#ffffff",
  paraCream: "#fefdf9",
  paraCard: "#fefdfb",
  paraAccent: "#20c997",
  paraAccentHover: "#1ab386",
  paraActiveBg: "#e0f2f0",
  paraText: "#1a1a1a",
  paraTextMuted: "#555555",
  paraTextSubtle: "#737373",
  paraIconYellow: "#fef08a",
  paraIconBlue: "#d1fae5",
  paraIconMint: "#ccfbf1",
  paraBorder: "rgba(0,0,0,0.08)",

  /* Semantic */
  zinc950: "#1a1a1a",
  zinc900: "#f8faf9",
  chartBgDark: "#f5faf8",
  zinc800: "#e2e8f0",
  zinc700: "#cbd5e1",
  zinc400: "#64748b",
  zinc200: "#e2e8f0",
  zinc500: "#64748b",
  zinc600: "#475569",
  brandAccent: "#20c997",
  brandAccentRgb: "32, 201, 151",
  opBg: "#f5faf8",
  opSurface: "rgba(255,255,255,0.9)",
  opPanel: "#ffffff",
  opBorder: "rgba(0,0,0,0.08)",
  opText: "#1a1a1a",
  opLightBg: "#f5faf8",
  opLightSurface: "#ffffff",
  opLightPanel: "#f1f5f9",
  opLightBorder: "#e2e8f0",
  opLightText: "#1a1a1a",
  opLightTextMuted: "#555555",
  opLightAccent: "#20c997",
  opLightBorderHex: "#e2e8f0",
  opLightDivider: "#e2e8f0",
  opLightWorkspace: "#f5faf8",
  white: "#FFFFFF",
  violet400: "#34d399",
  violet500: "#20c997",
  emerald500: "#059669",
  blue500: "#0284c7",
  red500: "#ef4444",
  cyan500: "#0d9488",
  pink500: "#db2777",
  green500: "#16a34a",
  orange500: "#ea580c",
  rose500: "#e11d48",
  slate400: "#94A3B8",
  zinc100: "#f4f4f5",
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, "2xl": 48, sidebarWidth: 260, headerHeight: 64, footerHeight: 40 };
export const zIndex = { overlay: 100, sidebar: 110, modal: 140, dropdown: 50 } as const;
export const breakpoints = { sm: 640, md: 768, lg: 1024, xl: 1280, "2xl": 1536 } as const;
export const layout = { minLeftWidth: 220, maxLeftWidth: 480, minRightWidth: 280, maxRightWidth: 560, defaultLeftWidth: 300, defaultRightWidth: 360 };
export const rgba = (rgb: string, alpha: number) => `rgba(${rgb}, ${alpha})`;
