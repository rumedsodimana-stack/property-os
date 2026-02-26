// beoCopilotService.ts - Standalone AI service for BEO parsing
import { aiProvider } from '../intelligence/aiProvider';
import { BanquetEvent, BEOAgendaItem } from '../../types';

/**
 * Parses a raw email or notes string into a structured Partial<BanquetEvent>
 * using the Gemini AI model.
 */
export async function parseBeoText(rawText: string): Promise<Partial<BanquetEvent>> {
    const prompt = `
You are an expert Hotel Revenue and Catering Manager. We are building the "Best BEO System in the World".
A user has pasted raw text (emails, notes, phone call transcript) from a client wanting to book an event.
Your job is to extract the details and structure them into a JSON object that matches our BanquetEvent schema.

Raw Text from Client:
"""
${rawText}
"""

Instructions for extraction:
1. return ONLY a valid JSON object. No markdown block formatting, no extra dialogue.
2. The JSON object should contain the following fields if you can deduce them:
   - name: The name or title of the event (string)
   - clientName: The name of the client or company (string)
   - type: Must be EXACTLY one of 'Wedding', 'Conference', 'Gala', 'Meeting'. Guess based on context. Default to 'Meeting'.
   - pax: The number of attendees (number). Default to 50 if unknown.
   - setupStyle: Must be EXACTLY one of 'Classroom', 'Theater', 'Banquet', 'U-Shape', 'Custom'. Guess based on event type.
   - agenda: An array of objects.
     - timeStart: "HH:mm" format. Make logical guesses if times are vague (e.g. "Morning Coffee" -> "09:00").
     - timeEnd: "HH:mm" format.
     - title: short string
     - departmentResponsibility: Must be 'Banquet', 'AV', 'Kitchen', 'FrontDesk', or 'All'.

Output purely the raw JSON.
    `;

    try {
        const response = await aiProvider.executeRequest(prompt, {
            provider: 'anthropic',
            model: 'claude-3-5-sonnet-20241022',
            temperature: 0.1
        });

        let jsonStr = response.content.trim();
        if (jsonStr.startsWith('\`\`\`json')) {
            jsonStr = jsonStr.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
        } else if (jsonStr.startsWith('\`\`\`')) {
            jsonStr = jsonStr.replace(/\`\`\`/g, '').trim();
        }

        const parsed: Partial<BanquetEvent> = JSON.parse(jsonStr);
        // Ensure defaults just in case AI failed to provide them
        parsed.isAIGenerated = true;

        return parsed;

    } catch (error) {
        console.error("BEO Copilot Parsing Error:", error);
        throw new Error("The AI failed to parse the text into a valid BEO structure.");
    }
}
