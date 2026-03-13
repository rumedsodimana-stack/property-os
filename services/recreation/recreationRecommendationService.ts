import { SpaReservation, GymMembershipPlan, ClassSchedule } from "../../types/recreation";
import { AIProvider } from "../intelligence/aiProvider";

/**
 * Lightweight recommendation helpers that keep logic out of UI.
 * Uses existing AIProvider so consumers can opt-in to AI-driven suggestions.
 */
export const recreationRecommendationService = {
    async suggestSpaUpsells(reservation: SpaReservation, context?: Record<string, any>): Promise<string> {
        const ai = new AIProvider();
        const prompt = `Guest spa booking context: ${JSON.stringify(reservation)}. 
Suggest 2-3 concise upsells (add-ons or complementary services) in bullet form. Keep under 60 words.`;
        const res = await ai.executeRequest(prompt, { provider: 'anthropic' });
        return res.content;
    },

    async recommendMembershipPlan(goals: string[], plans: GymMembershipPlan[]): Promise<string> {
        const ai = new AIProvider();
        const prompt = `Given member goals ${goals.join(', ')} and plans ${JSON.stringify(plans)}, recommend the best plan with one-line justification.`;
        const res = await ai.executeRequest(prompt, { provider: 'anthropic' });
        return res.content;
    },

    async forecastClassDemand(schedules: ClassSchedule[], daysAhead = 7): Promise<string> {
        const ai = new AIProvider();
        const prompt = `You are a demand forecaster. Predict high/medium/low demand for the next ${daysAhead} days from class schedules: ${JSON.stringify(schedules)}. Output JSON array [{classId, demand: "high|medium|low"}].`;
        const res = await ai.executeRequest(prompt, { provider: 'anthropic' });
        return res.content;
    }
};
