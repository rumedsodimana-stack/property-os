import defaultAIAgentBrain from '../../docs/brand/default_ai_agent_brain.md?raw';

export const AI_EXECUTION_CHARTER = defaultAIAgentBrain.trim();
const BRAND_BRAIN_STORAGE_KEY = 'brand_ai_agent_brain_v1';
const MAX_CUSTOM_BRAIN_CHARS = 16000;

export function getCustomBrandAIBrain(): string {
  try {
    const value = localStorage.getItem(BRAND_BRAIN_STORAGE_KEY);
    if (!value) return '';
    return value.slice(0, MAX_CUSTOM_BRAIN_CHARS).trim();
  } catch {
    return '';
  }
}

export function setCustomBrandAIBrain(content: string): void {
  const normalized = (content || '').trim().slice(0, MAX_CUSTOM_BRAIN_CHARS);
  try {
    if (!normalized) {
      localStorage.removeItem(BRAND_BRAIN_STORAGE_KEY);
      return;
    }
    localStorage.setItem(BRAND_BRAIN_STORAGE_KEY, normalized);
  } catch {
    // Ignore storage failures to avoid breaking chat runtime.
  }
}

export function composeOperatingPrompt(basePrompt: string): string {
  const trimmedBase = (basePrompt || '').trim();
  const customBrandBrain = getCustomBrandAIBrain();
  return [
    AI_EXECUTION_CHARTER,
    customBrandBrain ? `CLIENT BRAND AI BRAIN (CUSTOM)\n${customBrandBrain}` : '',
    `ROLE CONTEXT\n${trimmedBase}`
  ].filter(Boolean).join('\n\n').trim();
}
