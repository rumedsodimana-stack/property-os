import { GoogleGenAI } from "@google/genai";

// Initialize Gemini Client
// NOTE: In a real ICP app, the API Key would be managed via secure enclaves or passed securely.
// For this frontend demo, we assume process.env.API_KEY is available.
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || '' });

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
    const model = "gemini-1.5-flash"; // Updated to stable model
    const systemPrompt = `
      You are the AI Concierge of Hotel Singularity in Manama, Bahrain.
      Guest Context: ${JSON.stringify(guestContext)}
      Tone: Luxury, sophisticated, anticipatory, helpful.
      Tasks:
      1. Answer the guest's request.
      2. If they ask for food, suggest Halal options by default given the location.
      3. Analyze the 'valence' (sentiment) of the user's message from 0 (angry) to 10 (ecstatic).
      4. Detect INTENTS: If the guest is asking for a service (towels, water, fix AC, late checkout, food order), extract it.
      
      Return JSON format: 
      { 
        "response": "string", 
          "valence": number, 
          "intent": { "type": "Housekeeping|Maintenance|FrontDesk|FB|General", "action": "string", "priority": "Normal|High|Urgent", "details": "string" } | null 
      }
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: userMessage,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json"
      }
    });

    const jsonRes = JSON.parse(response.text || '{}');
    return {
      text: jsonRes.response || "At your service.",
      valence: jsonRes.valence || 5,
      intent: jsonRes.intent || null
    };

  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      text: "I apologize, I'm having trouble connecting to the Singularity Core. How may I assist you manually?",
      valence: 5
    };
  }
};
