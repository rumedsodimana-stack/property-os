/**
 * useProactiveInsights — AI-Native Architecture hook
 *
 * Subscribes to the Smart Data Pipeline and returns the latest
 * AI insights relevant to the current operational module.
 */

import { useState, useEffect, useCallback } from 'react';
import { pipeline, PipelineInsight } from '../services/intelligence/smartDataPipeline';

interface UseProactiveInsightsOptions {
  maxInsights?: number;
  autoRefreshMs?: number;
}

interface UseProactiveInsightsResult {
  insights: PipelineInsight[];
  loading: boolean;
  refresh: () => void;
}

export function useProactiveInsights(
  module: string,
  options: UseProactiveInsightsOptions = {}
): UseProactiveInsightsResult {
  const { maxInsights = 3, autoRefreshMs = 600_000 } = options;

  const getInsights = useCallback(
    () => pipeline.getRecentInsights(module, maxInsights),
    [module, maxInsights]
  );

  const [insights, setInsights] = useState<PipelineInsight[]>(getInsights);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(() => {
    setLoading(true);
    // Small delay to give the pipeline time to process any queued events
    setTimeout(() => {
      setInsights(getInsights());
      setLoading(false);
    }, 200);
  }, [getInsights]);

  // Subscribe to new pipeline insights in real-time
  useEffect(() => {
    const unsubscribe = pipeline.subscribe((insight) => {
      if (insight.module === module) {
        setInsights(prev => {
          const updated = [insight, ...prev].slice(0, maxInsights);
          return updated;
        });
      }
    });
    return unsubscribe;
  }, [module, maxInsights]);

  // Auto-refresh on interval
  useEffect(() => {
    if (!autoRefreshMs) return;
    const timer = setInterval(refresh, autoRefreshMs);
    return () => clearInterval(timer);
  }, [refresh, autoRefreshMs]);

  return { insights, loading, refresh };
}
