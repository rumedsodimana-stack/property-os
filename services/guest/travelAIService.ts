
import { GoogleGenAI, Type, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

export const getTravelRecommendations = async (destination: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide 3 unique travel recommendations for ${destination}. Include a hidden gem, a dining spot, and a social activity. Return as JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              category: { type: Type.STRING }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Gemini Error:", error);
    return [];
  }
};

export const matchTravelPartner = async (interests: string, destination: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Simulate 2 travel partner profiles that would match someone interested in "${interests}" traveling to "${destination}". Return name, bio, and compatibility reason in JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              bio: { type: Type.STRING },
              reason: { type: Type.STRING }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Gemini Error:", error);
    return [];
  }
};

export const generateItinerary = async (destination: string, interests: string, budget: string, duration: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a detailed day-by-day travel itinerary for a ${duration} trip to ${destination}. The traveler is interested in ${interests} and has a ${budget} budget. Include specific activities, accommodation suggestions, and estimated costs for EVERY item in USD. 
      Also provide a total budget summary. Return as JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            totalEstimatedBudget: { type: Type.NUMBER, description: "Total trip cost in USD" },
            currency: { type: Type.STRING, description: "USD" },
            budgetBreakdown: {
              type: Type.OBJECT,
              properties: {
                accommodation: { type: Type.NUMBER },
                food: { type: Type.NUMBER },
                activities: { type: Type.NUMBER },
                transport: { type: Type.NUMBER }
              }
            },
            days: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.NUMBER },
                  title: { type: Type.STRING },
                  items: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        time: { type: Type.STRING },
                        activity: { type: Type.STRING },
                        description: { type: Type.STRING },
                        category: { type: Type.STRING },
                        estimatedCost: { type: Type.NUMBER, description: "Estimated cost for this item in USD" }
                      },
                      required: ["time", "activity", "description", "category", "estimatedCost"]
                    }
                  }
                },
                required: ["day", "title", "items"]
              }
            }
          },
          required: ["totalEstimatedBudget", "days", "budgetBreakdown"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Itinerary Error:", error);
    return {};
  }
};

export const refineItinerary = async (currentData: any, request: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Here is the current travel data: ${JSON.stringify(currentData)}. 
      The user wants to make the following changes: "${request}". 
      Please update the itinerary and budget estimates accordingly while maintaining the JSON structure.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            totalEstimatedBudget: { type: Type.NUMBER },
            currency: { type: Type.STRING },
            budgetBreakdown: {
              type: Type.OBJECT,
              properties: {
                accommodation: { type: Type.NUMBER },
                food: { type: Type.NUMBER },
                activities: { type: Type.NUMBER },
                transport: { type: Type.NUMBER }
              }
            },
            days: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.NUMBER },
                  title: { type: Type.STRING },
                  items: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        time: { type: Type.STRING },
                        activity: { type: Type.STRING },
                        description: { type: Type.STRING },
                        category: { type: Type.STRING },
                        estimatedCost: { type: Type.NUMBER }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Refine Error:", error);
    return currentData;
  }
};

export const generateItinerarySpeech = async (text: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Summarize this itinerary and total budget enthusiastically: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};

export const summarizeReviews = async (reviews: {text: string, rating: number}[]) => {
  try {
    const reviewText = reviews.map(r => `Rating: ${r.rating}/5 - ${r.text}`).join('\n');
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze these reviews for a travel provider and provide a 2-sentence summary of overall sentiment. Focus on what guests love and what they mention could be better.
      Reviews:
      ${reviewText}`,
    });
    return response.text;
  } catch (error) {
    console.error("Review Summary Error:", error);
    return "Community reviews are generally positive across the board.";
  }
};
