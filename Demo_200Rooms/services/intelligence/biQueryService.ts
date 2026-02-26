import { aiProvider } from './aiProvider';

/**
 * Hotel Singularity OS — BI NLP Query Service
 * Translates natural language questions into ReportEngine configurations.
 */

export interface BIQueryResponse {
    dimension: string;
    metric: string;
    chartType: 'Bar' | 'Line' | 'Pie' | 'Area';
    explanation: string;
    isPredictive?: boolean;
}

export const biQueryService = {
    /**
     * Parse a user's question and return the optimal report configuration.
     * Maps to available dimensions and metrics defined in the target module.
     */
    async translateQuery(
        query: string,
        availableDimensions: { key: string, label: string }[],
        availableMetrics: { key: string, label: string }[]
    ): Promise<BIQueryResponse> {
        const prompt = `
            You are the Hotel Singularity BI Oracle. 
            User Question: "${query}"
            
            Available Dimensions: ${JSON.stringify(availableDimensions)}
            Available Metrics: ${JSON.stringify(availableMetrics)}

            Based on the user question and available fields, determine the most relevant dimension, metric, and chart type (Bar, Line, Pie, Area).
            
            PREDICTIVE ANALYSIS:
            If the user asks for a forecast, prediction, or future trend (e.g., "Where will we be next month?", "Forecast occupancy"), set "isPredictive" to true.

            Return the answer as a JSON object with keys: "dimension", "metric", "chartType", "explanation", and "isPredictive".
            
            Example:
            User Question: "Show me total revenue by outlet"
            Output: {"dimension": "outletId", "metric": "total", "chartType": "Bar", "explanation": "Showing total revenue aggregated by outlet.", "isPredictive": false}

            User Question: "Forecast our occupancy for next week"
            Output: {"dimension": "businessDate", "metric": "id", "chartType": "Line", "explanation": "Projecting guest occupancy based on historical pickup.", "isPredictive": true}

            User Question: "What is the trend of guest count over time?"
            Output: {"dimension": "businessDate", "metric": "guestCount", "chartType": "Line", "explanation": "Tracking guest count over time to identify trends.", "isPredictive": false}
        `;

        try {
            const response = await aiProvider.executeRequest(prompt, { provider: 'gemini' });
            const responseText = response.content;
            // Clean AI response to ensure valid JSON
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Invalid AI response format');
        } catch (error) {
            console.error('BI Query AI Translation Failed:', error);
            // Fallback: Use defaults
            return {
                dimension: availableDimensions[0].key,
                metric: availableMetrics[0].key,
                chartType: 'Bar',
                explanation: "I'm showing the default view as I couldn't perfectly interpret your request."
            };
        }
    }
};
