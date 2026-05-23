'use client';

import { useEffect, useState } from 'react';
import type {
  FloodOverviewResponse,
  FloodPredictionResponse,
  MLHospitalPrediction,
  MLGlobalPrediction,
  MockFloodRoutingResponse
} from './types';

const API_BASE = '/api/backend';

export function useFloodOverview() {
  const [data, setData] = useState<FloodOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/flood/overview`);
        if (!r.ok) throw new Error('not ok');
        const json: FloodOverviewResponse = await r.json();
        if (!cancelled) setData(json);
      } catch {
        /* API unavailable */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading };
}

export function useFloodPrediction() {
  const [data, setData] = useState<FloodPredictionResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/flood/ml-prediction`);
        if (!r.ok) throw new Error('not ok');
        const json: FloodPredictionResponse = await r.json();
        if (!cancelled) setData(json);
      } catch {
        /* API unavailable */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading };
}

/** Fetches ML-based flood risk prediction for a specific hospital. */
export function useMLHospitalPrediction(hospitalId: number | null) {
  const [data, setData] = useState<MLHospitalPrediction | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hospitalId == null) {
      setData(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const r = await fetch(
          `${API_BASE}/flood/ml-prediction/hospital/${hospitalId}`
        );
        if (!r.ok) throw new Error('not ok');
        const json: MLHospitalPrediction = await r.json();
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hospitalId]);

  return { data, loading };
}

/** Fetches ML-based global flood risk prediction for the region. */
export function useMLGlobalPrediction() {
  const [data, setData] = useState<MLGlobalPrediction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/flood/ml-prediction`);
        if (!r.ok) throw new Error('not ok');
        const json: MLGlobalPrediction = await r.json();
        if (!cancelled) setData(json);
      } catch {
        /* API unavailable */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading };
}

/** Fetches ML predictions for a list of hospitals in parallel (one call each). */
export function useMLAllHospitalPredictions(hospitalIds: number[]) {
  const [data, setData] = useState<MLHospitalPrediction[]>([]);
  const [loading, setLoading] = useState(false);

  // Stable key from sorted IDs so we only re-fetch when the set actually changes
  const idsKey = hospitalIds.slice().sort((a, b) => a - b).join(',');

  useEffect(() => {
    if (!idsKey) {
      setData([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const ids = idsKey.split(',').map(Number);

    (async () => {
      try {
        const results = await Promise.all(
          ids.map(async id => {
            try {
              const r = await fetch(
                `${API_BASE}/flood/ml-prediction/hospital/${id}`
              );
              if (!r.ok) return null;
              return (await r.json()) as MLHospitalPrediction;
            } catch {
              return null;
            }
          })
        );
        if (!cancelled) {
          setData(results.filter((r): r is MLHospitalPrediction => r != null));
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [idsKey]);

  return { data, loading };
}

/** Fetches mock flood routing options (demo scenario). */
export function useMockFloodRouting(enabled: boolean) {
  const [data, setData] = useState<MockFloodRoutingResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setData(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/flood/mock-routing-options`);
        if (!r.ok) throw new Error('not ok');
        const json: MockFloodRoutingResponse = await r.json();
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { data, loading };
}
