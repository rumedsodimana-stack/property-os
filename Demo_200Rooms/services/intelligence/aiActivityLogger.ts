/**
 * AI Activity Logger - Four-Tier AI Governance System
 * Logs all AI activities for audit, compliance, and cost tracking
 */

import type { AIActivityLog, AITier } from '../../types/ai';

class AIActivityLogger {
    private logs: AIActivityLog[] = [];
    private maxLogsInMemory = 1000;
    private retentionDays: Record<AITier, number> = {
        concierge: 30,
        system_ops: 365,
        automation: 365,
        analytics: 90
    };

    constructor() {
        this.loadLogsFromStorage();
        this.startCleanupInterval();
    }

    /**
     * Log an AI activity
     */
    log(activity: Omit<AIActivityLog, 'id' | 'timestamp'>): void {
        const log: AIActivityLog = {
            id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            ...activity
        };

        this.logs.push(log);

        // Trim logs if exceeding memory limit
        if (this.logs.length > this.maxLogsInMemory) {
            this.logs = this.logs.slice(-this.maxLogsInMemory);
        }

        this.saveToStorage();

        // Console log for development
        console.log(`[AI Activity] ${activity.aiTier} - ${activity.action}`, {
            tokens: activity.details.inputTokens + activity.details.outputTokens,
            cost: activity.details.cost,
            success: activity.details.success
        });
    }

    /**
     * Get logs for a specific tier
     */
    getLogsByTier(tier: AITier, limit: number = 100): AIActivityLog[] {
        return this.logs
            .filter(log => log.aiTier === tier)
            .slice(-limit);
    }

    /**
     * Get logs for a specific time range
     */
    getLogsByTimeRange(startDate: Date, endDate: Date): AIActivityLog[] {
        return this.logs.filter(log => {
            const logDate = new Date(log.timestamp);
            return logDate >= startDate && logDate <= endDate;
        });
    }

    /**
     * Get usage statistics for a tier
     */
    getUsageStats(tier: AITier, days: number = 30): {
        totalRequests: number;
        totalTokens: number;
        totalCost: number;
        avgLatency: number;
        successRate: number;
    } {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);

        const relevantLogs = this.logs.filter(log =>
            log.aiTier === tier && new Date(log.timestamp) >= cutoff
        );

        if (relevantLogs.length === 0) {
            return {
                totalRequests: 0,
                totalTokens: 0,
                totalCost: 0,
                avgLatency: 0,
                successRate: 0
            };
        }

        const stats = relevantLogs.reduce((acc, log) => {
            acc.totalRequests++;
            acc.totalTokens += log.details.inputTokens + log.details.outputTokens;
            acc.totalCost += log.details.cost;
            acc.totalLatency += log.details.latencyMs;
            if (log.details.success) acc.successCount++;
            return acc;
        }, {
            totalRequests: 0,
            totalTokens: 0,
            totalCost: 0,
            totalLatency: 0,
            successCount: 0
        });

        return {
            totalRequests: stats.totalRequests,
            totalTokens: stats.totalTokens,
            totalCost: stats.totalCost,
            avgLatency: stats.totalLatency / stats.totalRequests,
            successRate: (stats.successCount / stats.totalRequests) * 100
        };
    }

    /**
     * Get all usage stats (summary across all tiers)
     */
    getAllUsageStats(days: number = 30) {
        const tiers: AITier[] = ['concierge', 'system_ops', 'automation', 'analytics'];

        return {
            tiers: tiers.map(tier => ({
                tier,
                ...this.getUsageStats(tier, days)
            })),
            overall: this.getUsageStats('concierge', days) // This will be recalculated
        };
    }

    /**
     * Get cost breakdown by tier
     */
    getCostBreakdown(days: number = 30): Record<AITier, number> {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);

        const breakdown: Record<AITier, number> = {
            concierge: 0,
            system_ops: 0,
            automation: 0,
            analytics: 0
        };

        this.logs
            .filter(log => new Date(log.timestamp) >= cutoff)
            .forEach(log => {
                breakdown[log.aiTier] += log.details.cost;
            });

        return breakdown;
    }

    /**
     * Get recent errors
     */
    getRecentErrors(limit: number = 50): AIActivityLog[] {
        return this.logs
            .filter(log => !log.details.success)
            .slice(-limit);
    }

    /**
     * Get logs by user
     */
    getLogsByUser(userId: string, limit: number = 100): AIActivityLog[] {
        return this.logs
            .filter(log => log.details.userId === userId)
            .slice(-limit);
    }

    /**
     * Get logs by guest
     */
    getLogsByGuest(guestId: string, limit: number = 100): AIActivityLog[] {
        return this.logs
            .filter(log => log.details.guestId === guestId)
            .slice(-limit);
    }

    /**
     * Export logs as JSON
     */
    exportLogs(tier?: AITier): string {
        const logsToExport = tier
            ? this.logs.filter(log => log.aiTier === tier)
            : this.logs;

        return JSON.stringify(logsToExport, null, 2);
    }

    /**
     * Clear old logs based on retention policy
     */
    private cleanupOldLogs(): void {
        const now = new Date();

        this.logs = this.logs.filter(log => {
            const logDate = new Date(log.timestamp);
            const retentionMs = this.retentionDays[log.aiTier] * 24 * 60 * 60 * 1000;
            const age = now.getTime() - logDate.getTime();

            return age < retentionMs;
        });

        this.saveToStorage();
        console.log(`[AI Activity Logger] Cleaned up old logs. Remaining: ${this.logs.length}`);
    }

    /**
     * Start automatic cleanup interval (runs daily)
     */
    private startCleanupInterval(): void {
        // Run cleanup daily
        setInterval(() => {
            this.cleanupOldLogs();
        }, 24 * 60 * 60 * 1000);
    }

    /**
     * Load logs from localStorage
     */
    private loadLogsFromStorage(): void {
        try {
            const stored = localStorage.getItem('ai_activity_logs');
            if (stored) {
                this.logs = JSON.parse(stored);
                console.log(`[AI Activity Logger] Loaded ${this.logs.length} logs from storage`);
            }
        } catch (error) {
            console.error('[AI Activity Logger] Failed to load logs:', error);
        }
    }

    /**
     * Save logs to localStorage
     */
    private saveToStorage(): void {
        try {
            localStorage.setItem('ai_activity_logs', JSON.stringify(this.logs));
        } catch (error) {
            console.error('[AI Activity Logger] Failed to save logs:', error);
        }
    }

    /**
     * Get daily usage report
     */
    getDailyReport(date: Date = new Date()): {
        date: string;
        byTier: Record<AITier, {
            requests: number;
            tokens: number;
            cost: number;
        }>;
        total: {
            requests: number;
            tokens: number;
            cost: number;
        };
    } {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const dayLogs = this.getLogsByTimeRange(startOfDay, endOfDay);

        const byTier: Record<AITier, { requests: number; tokens: number; cost: number }> = {
            concierge: { requests: 0, tokens: 0, cost: 0 },
            system_ops: { requests: 0, tokens: 0, cost: 0 },
            automation: { requests: 0, tokens: 0, cost: 0 },
            analytics: { requests: 0, tokens: 0, cost: 0 }
        };

        let totalRequests = 0;
        let totalTokens = 0;
        let totalCost = 0;

        dayLogs.forEach(log => {
            const tokens = log.details.inputTokens + log.details.outputTokens;
            const cost = log.details.cost;

            byTier[log.aiTier].requests++;
            byTier[log.aiTier].tokens += tokens;
            byTier[log.aiTier].cost += cost;

            totalRequests++;
            totalTokens += tokens;
            totalCost += cost;
        });

        return {
            date: date.toISOString().split('T')[0],
            byTier,
            total: {
                requests: totalRequests,
                tokens: totalTokens,
                cost: totalCost
            }
        };
    }
}

// Singleton instance
export const aiActivityLogger = new AIActivityLogger();
export default AIActivityLogger;
