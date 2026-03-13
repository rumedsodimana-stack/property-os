/**
 * Global constants: API URLs, storage keys, feature flags
 * Single source of truth for entire app.
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://api.demo-hotel.test";

export const EXTERNAL_URLS = {
  noiseSvg: "https://grainy-gradients.vercel.app/noise.svg",
  picsumPlaceholder: (seed: string | number) => `https://picsum.photos/200/200?random=${seed}`,
  linkedin: "https://www.linkedin.com/company/singularity-hospitality-os/",
  unsplash: {
    superior: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80",
    deluxe: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
    executive: "https://images.unsplash.com/photo-1582719478250-c89cae4df85b?auto=format&fit=crop&w=800&q=80",
  },
  surveyReview: "https://survey.hotel-singu.com/review",
  openAIChat: "https://api.openai.com/v1/chat/completions",
} as const;

export const SERVICE_ENDPOINTS = {
  ollama: import.meta.env.VITE_OLLAMA_URL || "http://localhost:11434",
  eventsApi: "https://api.example-hotel.com/hso/events/ops",
  crmApi: "https://api.example-hotel.com/hso/events/crm",
} as const;

export const STORAGE_KEYS = { theme: "hs_os_theme", panels: "hs_codex_panels" } as const;

export const FEATURE_FLAGS = {
  aiEnabled: true,
  iotEnabled: true,
  multiProperty: true,
} as const;
