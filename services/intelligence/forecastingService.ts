import { predictiveEngine, DemandForecast } from './predictiveEngine';
import { revenueEngine } from './revenueEngine';

export interface ForecastSummary {
    averageOccupancy: number;
    totalProjectedRevenue: number;
    averageADR: number;
    monthlyForecast: DemandForecast[];
    insights: string[];
}

class ForecastingService {
    /**
     * Generates a comprehensive forecast for the property
     */
    getOperationalForecast(days: number = 30): ForecastSummary {
        const forecasts = predictiveEngine.getDemandForecast(days);

        const totalOcc = forecasts.reduce((acc, f) => acc + f.projectedOccupancy, 0);
        const totalRevenue = forecasts.reduce((acc, f) => acc + (f.projectedOccupancy * f.projectedADR), 0);
        const avgADR = forecasts.reduce((acc, f) => acc + f.projectedADR, 0) / forecasts.length;

        const insights = this.generateInsights(forecasts);

        return {
            averageOccupancy: parseFloat((totalOcc / forecasts.length).toFixed(1)),
            totalProjectedRevenue: parseFloat(totalRevenue.toFixed(2)),
            averageADR: parseFloat(avgADR.toFixed(2)),
            monthlyForecast: forecasts,
            insights
        };
    }

    /**
     * Simulates the revenue impact of dynamic yield rules
     */
    simulateYieldImpact(baseForecast: DemandForecast[]): { liftedRevenue: number; liftPercentage: number } {
        const rules = revenueEngine.getRules().filter(r => r.isActive);
        // Simplified simulation: rules typically provide a 5-15% lift on high demand days
        const lift = baseForecast.reduce((acc, f) => {
            if (f.projectedOccupancy > 80) return acc + (f.projectedOccupancy * f.projectedADR * 0.12);
            return acc;
        }, 0);

        return {
            liftedRevenue: lift,
            liftPercentage: lift > 0 ? 8.5 : 0 // Mock aggregate lift %
        };
    }

    private generateInsights(forecasts: DemandForecast[]): string[] {
        const insights: string[] = [];
        const peakDay = [...forecasts].sort((a, b) => b.projectedOccupancy - a.projectedOccupancy)[0];

        if (peakDay) {
            insights.push(`Peak demand expected on ${peakDay.date} (${peakDay.projectedOccupancy}%).`);
        }

        const avgOcc = forecasts.reduce((acc, f) => acc + f.projectedOccupancy, 0) / forecasts.length;
        if (avgOcc > 75) {
            insights.push("High demand period detected. Recommended to tighten yield restrictions.");
        } else if (avgOcc < 40) {
            insights.push("Low occupancy forecast. Consider tactical promotional offers.");
        }

        return insights;
    }
}

export const forecastingService = new ForecastingService();
export default forecastingService;
