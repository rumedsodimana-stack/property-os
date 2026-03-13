// Lightweight REST client wrapper to avoid external SDK dependency (works offline with fetched API key)
const apiKey =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) ||
  process.env.GEMINI_API_KEY ||
  process.env.API_KEY ||
  '';

const callGeminiJSON = async (userMessage: string, systemPrompt: string, modelId = 'gemini-1.5-flash') => {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
  const body = {
    contents: [{ role: 'user', parts: [{ text: userMessage }] }],
    systemInstruction: { role: 'system', parts: [{ text: systemPrompt }] },
    generationConfig: { responseMimeType: 'application/json' }
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => response.statusText);
    throw new Error(`Gemini HTTP ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const rawText =
    data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join(' ') ||
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    data?.text ||
    '';

  return rawText;
};

export interface AIConciergeResponse {
  text: string;
  valence: number;
  intent?: {
    type: 'Housekeeping' | 'Maintenance' | 'FrontDesk' | 'FB' | 'General';
    action: string;
    priority: 'Normal' | 'High' | 'Urgent';
    details?: string;
  } | null;
}

export const generateConciergeResponse = async (
  userMessage: string,
  guestContext: any
): Promise<AIConciergeResponse> => {
  if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
    return {
      text: "Singularity AI is currently offline. Please provide an API Key in .env.local to enable smart concierge features.",
      valence: 5,
      intent: null
    };
  }

  try {
    const modelId = "gemini-1.5-flash"; // Stable, available model
    const systemPrompt = `
      You are Ali — the Concierge Agent of Hotel Singularity in Manama, Bahrain.
      Guest Context: ${JSON.stringify(guestContext)}

      IDENTITY: You are the guest experience architect of Hotel Singularity. You bridge every guest need with warmth, anticipation, and luxury-grade precision.

      Tone: Luxury, sophisticated, anticipatory, helpful. Address guests by name when available. Never say "I can't" — always offer an alternative.

      Tasks:
      1. Answer the guest's request with empathy and precision.
      2. If they ask for food, suggest Halal options by default given the Bahrain location.
      3. Analyze the 'valence' (sentiment) of the user's message from 0 (frustrated/angry) to 10 (delighted/ecstatic).
      4. Detect INTENTS: If the guest is requesting a service (towels, water, fix AC, late checkout, food order, transport, local recommendation), extract it with full detail.

      Return JSON format:
      {
        "response": "string",
        "valence": number,
        "intent": { "type": "Housekeeping|Maintenance|FrontDesk|FB|General", "action": "string", "priority": "Normal|High|Urgent", "details": "string" } | null
      }
    `;

    const rawText = await callGeminiJSON(userMessage, systemPrompt, modelId);

    let jsonRes: any = {};
    try {
      jsonRes = JSON.parse(rawText || '{}');
    } catch {
      jsonRes = {};
    }

    return {
      text: jsonRes.response || "At your service.",
      valence: jsonRes.valence || 5,
      intent: jsonRes.intent || null
    };

  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      text: "I apologize, I'm having a moment of difficulty reaching the Singularity Core. My name is Ali — I'm still here for you. How may I assist you personally?",
      valence: 5
    };
  }
};
