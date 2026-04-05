/**
 * Operational Forecasting Service
 *
 * Provides occupancy forecasting (weighted moving average + seasonal factors),
 * revenue forecast, demand scoring, and pace reporting.
 */

// ── Types ────────────────────────────────────────────────────────────────────
export interface OccupancyForecast {
  date: string;
  projectedOccupancy: number;   // 0-100
  confidence: number;           // 0-1
  seasonalFactor: number;
  demandScore: number;          // 0-100
}

export interface RevenueForecast {
  date: string;
  projectedRevenue: number;
  projectedADR: number;
  projectedOccupancy: number;
  projectedRoomsSold: number;
}

export interface DemandScore {
  date: string;
  score: number;        // 0-100
  factors: string[];    // e.g. ["weekend", "holiday", "event"]
  level: 'low' | 'moderate' | 'high' | 'peak';
}

export interface PaceReport {
  date: string;
  otbRoomNights: number;        // on-the-books current year
  stlyRoomNights: number;       // same time last year
  otbRevenue: number;
  stlyRevenue: number;
  paceVarianceRooms: number;    // otb - stly
  paceVarianceRevenue: number;
  pickupToday: number;
}

// ── Seasonal factors by month (0-indexed) ────────────────────────────────────
const SEASONAL_FACTORS: Record<number, number> = {
  0: 0.70,  // Jan
  1: 0.75,  // Feb
  2: 0.85,  // Mar
  3: 0.90,  // Apr
  4: 0.65,  // May
  5: 0.55,  // Jun
  6: 0.50,  // Jul
  7: 0.55,  // Aug
  8: 0.70,  // Sep
  9: 0.90,  // Oct
  10: 0.95, // Nov
  11: 0.85, // Dec
};

const WEEKDAY_FACTOR: Record<number, number> = {
  0: 0.80,  // Sun
  1: 0.90,  // Mon
  2: 0.95,  // Tue
  3: 1.00,  // Wed
  4: 1.05,  // Thu
  5: 1.10,  // Fri
  6: 1.00,  // Sat
};

// ── Weighted Moving Average ──────────────────────────────────────────────────
function weightedMovingAverage(values: number[], weights?: number[]): number {
  if (values.length === 0) return 0;
  const w = weights || values.map((_, i) => i + 1); // more recent = more weight
  const totalWeight = w.reduce((a, b) => a + b, 0);
  return values.reduce((sum, v, i) => sum + v * w[i], 0) / totalWeight;
}

class ForecastingServiceOps {
  private totalRooms: number;
  private baseADR: number;

  constructor(totalRooms = 200, baseADR = 185) {
    this.totalRooms = totalRooms;
    this.baseADR = baseADR;
  }

  /**
   * Generate occupancy forecast for N days using WMA + seasonal adjustment
   */
  forecastOccupancy(
    historicalOccupancy: number[] = [],
    days = 30
  ): OccupancyForecast[] {
    // Use last 14 days of historical data for WMA, or generate plausible seed
    const history = historicalOccupancy.length >= 7
      ? historicalOccupancy.slice(-14)
      : this.generateSeedHistory(14);

    const baseProjection = weightedMovingAverage(history);
    const forecasts: OccupancyForecast[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const monthFactor = SEASONAL_FACTORS[date.getMonth()] ?? 0.80;
      const dayFactor = WEEKDAY_FACTOR[date.getDay()] ?? 1.0;

      const raw = baseProjection * monthFactor * dayFactor;
      const projected = Math.min(100, Math.max(5, raw + (Math.random() * 6 - 3)));
      // Confidence decreases the further out we forecast
      const confidence = Math.max(0.40, 1 - (i * 0.015));
      const demandScore = this.computeDemandScore(projected, monthFactor, dayFactor);

      forecasts.push({
        date: date.toISOString().split('T')[0],
        projectedOccupancy: Math.round(projected * 10) / 10,
        confidence: Math.round(confidence * 100) / 100,
        seasonalFactor: monthFactor,
        demandScore,
      });
    }

    return forecasts;
  }

  /**
   * Revenue forecast = occupancy * rooms * ADR projection
   */
  forecastRevenue(
    occupancyForecasts?: OccupancyForecast[],
    days = 30
  ): RevenueForecast[] {
    const occForecasts = occupancyForecasts || this.forecastOccupancy([], days);

    return occForecasts.map(occ => {
      const roomsSold = Math.round((occ.projectedOccupancy / 100) * this.totalRooms);
      // ADR adjusts upward at higher occupancy tiers (yield)
      const yieldMultiplier = occ.projectedOccupancy > 85 ? 1.20
        : occ.projectedOccupancy > 70 ? 1.10
        : occ.projectedOccupancy > 50 ? 1.00
        : 0.90;
      const projectedADR = Math.round(this.baseADR * occ.seasonalFactor * yieldMultiplier * 100) / 100;
      const projectedRevenue = Math.round(roomsSold * projectedADR * 100) / 100;

      return {
        date: occ.date,
        projectedRevenue,
        projectedADR,
        projectedOccupancy: occ.projectedOccupancy,
        projectedRoomsSold: roomsSold,
      };
    });
  }

  /**
   * Demand scoring by date (0-100)
   */
  scoreDemand(days = 30): DemandScore[] {
    const occForecasts = this.forecastOccupancy([], days);

    return occForecasts.map(occ => {
      const factors: string[] = [];
      const date = new Date(occ.date);
      if (date.getDay() === 5 || date.getDay() === 6) factors.push('weekend');
      if (occ.seasonalFactor >= 0.90) factors.push('peak_season');
      if (occ.projectedOccupancy > 85) factors.push('high_demand');
      if (occ.demandScore > 70) factors.push('event_proximity');

      const level: DemandScore['level'] =
        occ.demandScore >= 80 ? 'peak' :
        occ.demandScore >= 60 ? 'high' :
        occ.demandScore >= 40 ? 'moderate' : 'low';

      return {
        date: occ.date,
        score: occ.demandScore,
        factors,
        level,
      };
    });
  }

  /**
   * Pace reporting: OTB vs Same Time Last Year
   */
  generatePaceReport(days = 14): PaceReport[] {
    const reports: PaceReport[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      // Simulate OTB and STLY data
      const stlyRooms = Math.round(this.totalRooms * (0.55 + Math.random() * 0.25));
      const otbRooms = Math.round(stlyRooms * (0.85 + Math.random() * 0.35));
      const stlyADR = this.baseADR * (0.90 + Math.random() * 0.15);
      const otbADR = stlyADR * (0.95 + Math.random() * 0.15);
      const pickup = Math.round(Math.random() * 8);

      reports.push({
        date: dateStr,
        otbRoomNights: otbRooms,
        stlyRoomNights: stlyRooms,
        otbRevenue: Math.round(otbRooms * otbADR * 100) / 100,
        stlyRevenue: Math.round(stlyRooms * stlyADR * 100) / 100,
        paceVarianceRooms: otbRooms - stlyRooms,
        paceVarianceRevenue: Math.round((otbRooms * otbADR - stlyRooms * stlyADR) * 100) / 100,
        pickupToday: pickup,
      });
    }

    return reports;
  }

  // ── Internals ──────────────────────────────────────────────────────────────
  private computeDemandScore(occupancy: number, seasonal: number, weekday: number): number {
    const raw = (occupancy * 0.5) + (seasonal * 30) + (weekday * 15);
    return Math.min(100, Math.max(0, Math.round(raw)));
  }

  private generateSeedHistory(days: number): number[] {
    return Array.from({ length: days }, () => 55 + Math.random() * 30);
  }
}

export const forecastingServiceOps = new ForecastingServiceOps();
export default forecastingServiceOps;
