"use client";

import { useCallback, useRef, useState } from "react";
import { parsePartialJson } from "ai";
import type {
  TacticalSnapshot,
  Assessment,
  Plan,
  RedTeamScenario
} from "../strateg/schemas";

export type StrategPhase =
  | "idle"
  | "assessing"
  | "assessed"
  | "planning"
  | "planned"
  | "deploying"
  | "deployed"
  | "redteaming"
  | "redteamed"
  | "running"
  | "complete"
  | "writingAar"
  | "done"
  | "error";

export interface ScenarioRunSummary {
  scenarioName: string;
  durationSeconds: number;
  nodesLost: string[];
  nodesDegraded: string[];
  threatsLaunched: number;
  threatsIntercepted: number;
  threatsImpacted: number;
}

export interface StrategAgentState {
  phase: StrategPhase;
  assessment: Partial<Assessment> | null;
  plan: Partial<Plan> | null;
  redTeam: Partial<RedTeamScenario> | null;
  aarText: string;
  error: string | null;
}

interface UseStrategAgentArgs {
  buildSnapshot: () => TacticalSnapshot;
  captureScreenshot: () => Promise<string | null>;
}

const initialState: StrategAgentState = {
  phase: "idle",
  assessment: null,
  plan: null,
  redTeam: null,
  aarText: "",
  error: null
};

async function streamStructured<T>(
  url: string,
  payload: unknown,
  signal: AbortSignal,
  onPartial: (partial: Partial<T>) => void
): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    signal,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
    } catch {}
    throw new Error(msg);
  }
  if (!res.body) throw new Error("Empty response body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const result = await parsePartialJson(buffer);
    if (result.value !== undefined && (result.state === "successful-parse" || result.state === "repaired-parse")) {
      onPartial(result.value as Partial<T>);
    }
  }

  // Final parse
  const finalParsed = await parsePartialJson(buffer);
  if (finalParsed.value === undefined) {
    throw new Error("Failed to parse final JSON response");
  }
  return finalParsed.value as T;
}

async function streamPlainText(
  url: string,
  payload: unknown,
  signal: AbortSignal,
  onDelta: (chunk: string, full: string) => void
): Promise<string> {
  const res = await fetch(url, {
    method: "POST",
    signal,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
    } catch {}
    throw new Error(msg);
  }
  if (!res.body) throw new Error("Empty response body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    full += chunk;
    onDelta(chunk, full);
  }
  return full;
}

export function useStrategAgent({ buildSnapshot, captureScreenshot }: UseStrategAgentArgs) {
  const [state, setState] = useState<StrategAgentState>(initialState);
  const abortRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const reset = useCallback(() => {
    cancel();
    setState(initialState);
  }, [cancel]);

  const setPhase = useCallback((phase: StrategPhase) => {
    setState(s => ({ ...s, phase }));
  }, []);

  const runAssessment = useCallback(async () => {
    cancel();
    const ac = new AbortController();
    abortRef.current = ac;

    setState(s => ({ ...s, phase: "assessing", assessment: {}, error: null }));

    try {
      const snapshot = buildSnapshot();
      const imageBase64 = await captureScreenshot();
      const final = await streamStructured<Assessment>(
        "/api/strateg/assess",
        { snapshot, imageBase64 },
        ac.signal,
        partial => setState(s => ({ ...s, assessment: partial }))
      );
      setState(s => ({ ...s, assessment: final, phase: "assessed" }));
      return final;
    } catch (e: unknown) {
      if (ac.signal.aborted) return null;
      const msg = e instanceof Error ? e.message : "Unknown error";
      setState(s => ({ ...s, phase: "error", error: msg }));
      return null;
    }
  }, [buildSnapshot, captureScreenshot, cancel]);

  const runPlan = useCallback(async (assessment: Assessment) => {
    cancel();
    const ac = new AbortController();
    abortRef.current = ac;

    setState(s => ({ ...s, phase: "planning", plan: {}, error: null }));

    try {
      const snapshot = buildSnapshot();
      const final = await streamStructured<Plan>(
        "/api/strateg/plan",
        { snapshot, assessment },
        ac.signal,
        partial => setState(s => ({ ...s, plan: partial }))
      );
      setState(s => ({ ...s, plan: final, phase: "planned" }));
      return final;
    } catch (e: unknown) {
      if (ac.signal.aborted) return null;
      const msg = e instanceof Error ? e.message : "Unknown error";
      setState(s => ({ ...s, phase: "error", error: msg }));
      return null;
    }
  }, [buildSnapshot, cancel]);

  const runRedTeam = useCallback(async (plan: Plan) => {
    cancel();
    const ac = new AbortController();
    abortRef.current = ac;

    setState(s => ({ ...s, phase: "redteaming", redTeam: {}, error: null }));

    try {
      const snapshot = buildSnapshot();
      const final = await streamStructured<RedTeamScenario>(
        "/api/strateg/redteam",
        { snapshot, plan },
        ac.signal,
        partial => setState(s => ({ ...s, redTeam: partial }))
      );
      setState(s => ({ ...s, redTeam: final, phase: "redteamed" }));
      return final;
    } catch (e: unknown) {
      if (ac.signal.aborted) return null;
      const msg = e instanceof Error ? e.message : "Unknown error";
      setState(s => ({ ...s, phase: "error", error: msg }));
      return null;
    }
  }, [buildSnapshot, cancel]);

  const runAar = useCallback(async (run: ScenarioRunSummary) => {
    cancel();
    const ac = new AbortController();
    abortRef.current = ac;

    setState(s => ({ ...s, phase: "writingAar", aarText: "", error: null }));

    try {
      const snapshot = buildSnapshot();
      const final = await streamPlainText(
        "/api/strateg/aar",
        { snapshot, scenarioRun: run },
        ac.signal,
        (_chunk, full) => setState(s => ({ ...s, aarText: full }))
      );
      setState(s => ({ ...s, aarText: final, phase: "done" }));
      return final;
    } catch (e: unknown) {
      if (ac.signal.aborted) return null;
      const msg = e instanceof Error ? e.message : "Unknown error";
      setState(s => ({ ...s, phase: "error", error: msg }));
      return null;
    }
  }, [buildSnapshot, cancel]);

  return {
    state,
    runAssessment,
    runPlan,
    runRedTeam,
    runAar,
    setPhase,
    cancel,
    reset
  };
}
