"use client";

import { useEffect, useMemo, useState } from "react";
import { Brain, X, Sparkles, Shield, Swords, FileText, Loader2, ChevronRight, MapPin, AlertTriangle, Radar, Zap } from "lucide-react";
import { Panel, Button, StatusPill } from "../ui";
import { useStrategAgent } from "../hooks/useStrategAgent";
import type {
  TacticalSnapshot,
  Assessment,
  Plan,
  RedTeamScenario
} from "../strateg/schemas";
import type { CriticalNode, DeployedSystem, Threat, NodeRelation, LogType } from "../types";

interface DeployRecForAction {
  type: "PILICA" | "WRE" | "RADAR" | "PATRIOT";
  lat: number;
  lon: number;
}

interface AttackWaveForAction {
  threatType: "DRONE" | "SHAHED" | "MISSILE";
  targetNodeId: string;
  delaySeconds: number;
}

interface StrategPanelProps {
  isOpen: boolean;
  onClose: () => void;
  // Live state
  nodes: CriticalNode[];
  relations: NodeRelation[];
  deployedSystems: DeployedSystem[];
  threats: Threat[];
  // Helpers
  buildSnapshot: () => TacticalSnapshot;
  captureScreenshot: () => Promise<string | null>;
  // Actions
  onDeployRecommendation: (rec: DeployRecForAction) => void;
  onLaunchRedTeamWave: (wave: AttackWaveForAction) => void;
  onDrawOverlays: (assessment: Assessment, nodes: CriticalNode[]) => void;
  onClearOverlays: () => void;
  onAddLog: (text: string, type?: LogType) => void;
}

const PHASE_LABEL: Record<string, string> = {
  idle: "Gotowy",
  assessing: "Ocena trwa",
  assessed: "Ocena gotowa",
  planning: "Tworzy plan",
  planned: "Plan gotowy",
  deploying: "Rozstawia",
  deployed: "Plan rozstawiony",
  redteaming: "Red team",
  redteamed: "Atak gotowy",
  running: "Atak trwa",
  complete: "Atak zakończony",
  writingAar: "Tworzy raport",
  done: "Raport gotowy",
  error: "Błąd"
};

function PhaseDot({ active, complete, label, num }: { active: boolean; complete: boolean; label: string; num: number }) {
  return (
    <div className="flex flex-col items-center gap-1.5 flex-1">
      <div
        className={[
          "w-7 h-7 rounded-full border flex items-center justify-center text-caption font-medium transition-all",
          complete
            ? "bg-accent text-(--text-on-accent) border-accent"
            : active
            ? "bg-accent-soft text-accent border-accent"
            : "bg-surface-data text-muted border-subtle"
        ].join(" ")}
      >
        {num}
      </div>
      <span className={`text-micro ${active ? "text-accent" : complete ? "text-primary" : "text-muted"}`}>{label}</span>
    </div>
  );
}

export function StrategPanel({
  isOpen,
  onClose,
  nodes,
  relations: _relations,
  deployedSystems,
  threats,
  buildSnapshot,
  captureScreenshot,
  onDeployRecommendation,
  onLaunchRedTeamWave,
  onDrawOverlays,
  onClearOverlays,
  onAddLog
}: StrategPanelProps) {
  const agent = useStrategAgent({ buildSnapshot, captureScreenshot });
  const { state, runAssessment, runPlan, runRedTeam, runAar, setPhase, reset } = agent;

  const [appliedDeployIds, setAppliedDeployIds] = useState<Set<string>>(new Set());
  const [scenarioStartedAt, setScenarioStartedAt] = useState<number | null>(null);
  const [initialNodeHealth, setInitialNodeHealth] = useState<Map<string, number> | null>(null);

  // When assessment completes — draw overlays
  useEffect(() => {
    if (state.phase === "assessed" && state.assessment?.vulnerabilities && state.assessment?.predictedVectors) {
      onDrawOverlays(state.assessment as Assessment, nodes);
    }
  }, [state.phase, state.assessment, nodes, onDrawOverlays]);

  // Track scenario run completion: when no FLYING threats remain AND we've spawned all waves.
  // Polls every 1s so we don't depend on `threats` changing (waves can be instant-killed,
  // leaving threats array static after the last interception).
  useEffect(() => {
    if (state.phase !== "running" || scenarioStartedAt === null) return;
    const waves = state.redTeam?.waves || [];
    if (waves.length === 0) return;
    const maxDelay = Math.max(...waves.map(w => (w?.delaySeconds ?? 0)));
    const completeAfterMs = (maxDelay + 1.5) * 1000 + 2000;

    const tick = () => {
      const flying = threats.filter(t => t.status === "FLYING").length;
      const elapsedMs = Date.now() - scenarioStartedAt;
      if (elapsedMs >= completeAfterMs && flying === 0) {
        setPhase("complete");
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [threats, state.phase, state.redTeam, scenarioStartedAt, setPhase]);

  const phaseStepIndex = useMemo(() => {
    switch (state.phase) {
      case "idle":
        return 0;
      case "assessing":
      case "assessed":
        return 1;
      case "planning":
      case "planned":
      case "deploying":
      case "deployed":
        return 2;
      case "redteaming":
      case "redteamed":
      case "running":
      case "complete":
      case "writingAar":
      case "done":
        return 3;
      default:
        return 0;
    }
  }, [state.phase]);

  if (!isOpen) return null;

  const handleStartAssess = async () => {
    onClearOverlays();
    onAddLog("STRATEG AI: Inicjuję ocenę sytuacyjną z visionem mapy.", "info");
    await runAssessment();
  };

  const handleStartPlan = async () => {
    if (!state.assessment?.summary) return;
    onAddLog("STRATEG AI: Generuję plan rozstawienia obrony.", "info");
    await runPlan(state.assessment as Assessment);
  };

  const handleDeployRec = (idx: number) => {
    const rec = state.plan?.deployments?.[idx];
    if (!rec || !rec.type || rec.lat == null || rec.lon == null) return;
    onDeployRecommendation({ type: rec.type, lat: rec.lat, lon: rec.lon });
    setAppliedDeployIds(prev => new Set([...prev, rec.id || `idx-${idx}`]));
    onAddLog(`STRATEG AI: Rozstawiono ${rec.type} wg rekomendacji #${idx + 1}.`, "success");
  };

  const handleDeployAll = () => {
    const deps = state.plan?.deployments || [];
    deps.forEach((rec, idx) => {
      if (!rec || !rec.type || rec.lat == null || rec.lon == null) return;
      const key = rec.id || `idx-${idx}`;
      if (appliedDeployIds.has(key)) return;
      setTimeout(() => {
        onDeployRecommendation({ type: rec.type!, lat: rec.lat!, lon: rec.lon! });
        setAppliedDeployIds(prev => new Set([...prev, key]));
      }, idx * 350); // sequential animation
    });
    onAddLog(`STRATEG AI: Realizuję cały plan — ${deps.length} pozycji bojowych.`, "success");
    setTimeout(() => setPhase("deployed"), deps.length * 350 + 200);
  };

  const handleStartRedTeam = async () => {
    if (!state.plan?.doctrine) return;
    onAddLog("STRATEG AI: Przeciwnik analizuje obronę. Generuję dopasowany atak.", "warning");
    await runRedTeam(state.plan as Plan);
  };

  const handleLaunchRedTeam = () => {
    const scenario = state.redTeam as RedTeamScenario;
    if (!scenario?.waves) return;

    // Snapshot initial state for scenario summary
    const healthMap = new Map<string, number>();
    nodes.forEach(n => healthMap.set(n.id, n.health));
    setInitialNodeHealth(healthMap);

    const validWaves = scenario.waves.filter(
      w => w && w.threatType && w.targetNodeId
    );
    onAddLog(
      `STRATEG AI · RED TEAM: "${scenario.scenarioName}" — start (${validWaves.length} fal).`,
      "warning"
    );
    if (validWaves.length === 0) {
      onAddLog("STRATEG AI · RED TEAM: scenariusz pusty — brak fal do uruchomienia.", "error");
      return;
    }
    setPhase("running");
    setScenarioStartedAt(Date.now());

    // Compress LLM's 0-60s delays into a tight demo window: first wave at 0s,
    // each subsequent wave staggered by ~1.2s (in stable LLM-given order).
    // Keeps the "saturation feel" without forcing the operator to wait a minute.
    const ordered = [...validWaves].sort(
      (a, b) => (a.delaySeconds ?? 0) - (b.delaySeconds ?? 0)
    );
    ordered.forEach((wave, idx) => {
      const delayMs = idx * 1200;
      setTimeout(() => {
        onLaunchRedTeamWave({
          threatType: wave.threatType,
          targetNodeId: wave.targetNodeId,
          delaySeconds: wave.delaySeconds
        });
      }, delayMs);
    });
  };

  const handleWriteAar = async () => {
    if (!initialNodeHealth || !state.redTeam) return;
    const nodesLost = nodes.filter(n => n.status === "DESTROYED").map(n => n.id);
    const nodesDegraded = nodes
      .filter(n => n.status === "DEGRADED" && (initialNodeHealth.get(n.id) ?? 100) > n.health)
      .map(n => n.id);
    const totalWaves = state.redTeam.waves?.length || 0;
    const impacted = threats.filter(t => t.status === "IMPACTED").length;
    const intercepted = threats.filter(t => t.status === "INTERCEPTED" || t.status === "JAMMED").length;
    const summary = {
      scenarioName: state.redTeam.scenarioName || "Red team",
      durationSeconds: scenarioStartedAt ? Math.round((Date.now() - scenarioStartedAt) / 1000) : 0,
      nodesLost,
      nodesDegraded,
      threatsLaunched: totalWaves,
      threatsIntercepted: intercepted,
      threatsImpacted: impacted
    };
    onAddLog("STRATEG AI: Generuję After-Action Report.", "info");
    await runAar(summary);
  };

  const handleReset = () => {
    onClearOverlays();
    setAppliedDeployIds(new Set());
    setScenarioStartedAt(null);
    setInitialNodeHealth(null);
    reset();
  };

  const activeFlying = threats.filter(t => t.status === "FLYING").length;

  return (
    <div className="fixed right-3 top-32 bottom-24 w-[460px] z-50 flex flex-col anim-slide-left">
      <Panel variant="floating" rounded="xl" className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-subtle">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-9 h-9 rounded-(--r-md) bg-(--text-1) text-(--canvas) flex items-center justify-center shrink-0">
                <Brain className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-micro text-muted">Wsparcie decyzyjne · GPT-4o vision</span>
                <h3 className="text-title text-primary truncate">STRATEG AI</h3>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <StatusPill
                tone={state.phase === "error" ? "error" : state.phase === "idle" ? "neutral" : "accent"}
                size="xs"
                dot
                pulse={state.phase.endsWith("ing")}
              >
                {PHASE_LABEL[state.phase] || state.phase}
              </StatusPill>
              <button
                onClick={onClose}
                aria-label="Zamknij"
                className="p-1.5 rounded-(--r-sm) text-muted hover:text-primary hover:bg-surface-hover cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Phase steps */}
          <div className="flex items-center gap-1 mt-4">
            <PhaseDot num={1} label="Ocena" active={phaseStepIndex === 0 || state.phase === "assessing"} complete={phaseStepIndex > 0 || state.phase === "assessed"} />
            <div className="h-px flex-1 bg-subtle" />
            <PhaseDot num={2} label="Plan" active={phaseStepIndex === 1 || state.phase === "planning"} complete={phaseStepIndex > 1 || state.phase === "planned"} />
            <div className="h-px flex-1 bg-subtle" />
            <PhaseDot num={3} label="Rozstaw." active={state.phase === "deploying"} complete={state.phase === "deployed" || phaseStepIndex > 2} />
            <div className="h-px flex-1 bg-subtle" />
            <PhaseDot num={4} label="Red team" active={["redteaming", "redteamed", "running", "complete", "writingAar"].includes(state.phase)} complete={state.phase === "done"} />
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 min-h-0 overflow-y-auto scroll-thin px-5 py-4">
          {state.phase === "error" && (
            <div className="px-3 py-2.5 mb-3 rounded-(--r-md) bg-error-soft border border-error/40">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-error shrink-0 mt-0.5" />
                <div className="flex flex-col min-w-0">
                  <span className="text-caption text-error font-medium">Błąd</span>
                  <span className="text-caption text-error/80 break-words">{state.error}</span>
                </div>
              </div>
            </div>
          )}

          {/* ---------- PHASE 1: ASSESSMENT ---------- */}
          {(state.phase === "idle" || state.phase === "assessing" || state.phase === "assessed" || (phaseStepIndex >= 1 && state.assessment)) && (
            <Section
              icon={<Sparkles className="w-3.5 h-3.5" />}
              title="1 · Ocena sytuacyjna"
              subtitle="Vision + dane snapshot → identyfikacja wrażliwości i wektorów ataku"
            >
              {state.phase === "idle" && (
                <Button variant="primary" size="md" fullWidth icon={<Sparkles className="w-4 h-4" />} onClick={handleStartAssess}>
                  Wykonaj ocenę
                </Button>
              )}

              {state.phase === "assessing" && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-(--r-md) bg-accent-soft">
                  <Loader2 className="w-4 h-4 text-accent animate-spin" />
                  <span className="text-caption text-accent">AI analizuje obecną dyslokację...</span>
                </div>
              )}

              {state.assessment?.summary && (
                <div className="mt-3 px-4 py-3 rounded-(--r-md) bg-surface-data">
                  <span className="text-micro text-muted">Brief operacyjny</span>
                  <p className="text-body text-primary leading-relaxed mt-1.5 whitespace-pre-wrap">
                    {state.assessment.summary}
                  </p>
                  {state.assessment.keyFinding && (
                    <div className="mt-3 pt-3 border-t border-subtle">
                      <span className="text-micro text-muted">Kluczowe odkrycie</span>
                      <p className="text-caption text-warn mt-1 font-medium">{state.assessment.keyFinding}</p>
                    </div>
                  )}
                </div>
              )}

              {state.assessment?.vulnerabilities && state.assessment.vulnerabilities.length > 0 && (
                <div className="mt-3">
                  <span className="text-micro text-muted">Wrażliwości (ranking)</span>
                  <div className="flex flex-col gap-1.5 mt-1.5">
                    {state.assessment.vulnerabilities.map((v, i) => {
                      if (!v?.nodeId) return null;
                      const node = nodes.find(n => n.id === v.nodeId);
                      return (
                        <div key={i} className="px-3 py-2 rounded-(--r-sm) bg-surface-data flex items-start gap-2.5">
                          <div className="w-6 h-6 rounded-full bg-error-soft text-error flex items-center justify-center text-micro font-medium shrink-0">
                            {v.rank ?? i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-caption text-primary font-medium truncate">
                                {node?.name || v.nodeId}
                              </span>
                              <span className="text-micro text-error font-medium tabular-nums">{Math.round(v.riskScore ?? 0)}</span>
                            </div>
                            <p className="text-caption text-secondary leading-relaxed mt-0.5">{v.reasoning}</p>
                            {v.cascadeImpact && v.cascadeImpact.length > 0 && (
                              <div className="text-micro text-muted mt-1">
                                Kaskada: {v.cascadeImpact.join(" → ")}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {state.assessment?.predictedVectors && state.assessment.predictedVectors.length > 0 && (
                <div className="mt-3">
                  <span className="text-micro text-muted">Przewidywane wektory ataku</span>
                  <div className="flex flex-col gap-1.5 mt-1.5">
                    {state.assessment.predictedVectors.map((v, i) => {
                      if (!v?.targetNodeId) return null;
                      const node = nodes.find(n => n.id === v.targetNodeId);
                      return (
                        <div key={i} className="px-3 py-2 rounded-(--r-sm) bg-surface-data">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-data text-primary">
                              {v.threatType} → {node?.name || v.targetNodeId}
                            </span>
                            <span className="text-micro text-warn tabular-nums">{v.likelihood ?? 0}%</span>
                          </div>
                          <div className="text-micro text-muted mt-0.5">
                            Origin: {v.approachFromLat?.toFixed(3)}°N · {v.approachFromLon?.toFixed(3)}°E · path={v.pathType}
                          </div>
                          <p className="text-caption text-secondary leading-relaxed mt-1">{v.reasoning}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {state.phase === "assessed" && (
                <Button variant="primary" size="md" fullWidth className="mt-4" iconRight={<ChevronRight className="w-4 h-4" />} onClick={handleStartPlan}>
                  Generuj plan obrony
                </Button>
              )}
            </Section>
          )}

          {/* ---------- PHASE 2/3: PLAN ---------- */}
          {(["planning", "planned", "deploying", "deployed"].includes(state.phase) || (phaseStepIndex >= 2 && state.plan)) && (
            <Section
              icon={<Shield className="w-3.5 h-3.5" />}
              title="2 · Plan obrony"
              subtitle="Warstwowa konfiguracja systemów + playbooki"
            >
              {state.phase === "planning" && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-(--r-md) bg-accent-soft">
                  <Loader2 className="w-4 h-4 text-accent animate-spin" />
                  <span className="text-caption text-accent">Optymalizuję pokrycie systemów obronnych...</span>
                </div>
              )}

              {state.plan?.doctrine && (
                <div className="px-4 py-3 rounded-(--r-md) bg-(--text-1) text-(--canvas)">
                  <span className="text-micro opacity-70">Doktryna</span>
                  <p className="text-body mt-1 leading-relaxed">{state.plan.doctrine}</p>
                </div>
              )}

              {state.plan?.deployments && state.plan.deployments.length > 0 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-micro text-muted">Rekomendowane pozycje ({state.plan.deployments.length})</span>
                    {state.phase === "planned" && (
                      <Button variant="ghost" size="sm" onClick={handleDeployAll}>
                        Rozstaw wszystko
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {state.plan.deployments.map((rec, i) => {
                      if (!rec?.type) return null;
                      const key = rec.id || `idx-${i}`;
                      const applied = appliedDeployIds.has(key);
                      return (
                        <div key={i} className={`px-3 py-2 rounded-(--r-sm) flex items-start gap-2.5 transition-colors ${applied ? "bg-ok-soft border border-ok/30" : "bg-surface-data"}`}>
                          <div className="w-6 h-6 rounded-full bg-accent-soft text-accent flex items-center justify-center shrink-0">
                            <MapPin className="w-3 h-3" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-data text-primary font-medium">{rec.type}</span>
                              <span className="text-micro text-muted tabular-nums">
                                {rec.lat?.toFixed(4)}°N · {rec.lon?.toFixed(4)}°E
                              </span>
                            </div>
                            <p className="text-caption text-secondary leading-relaxed mt-0.5">{rec.rationale}</p>
                            {rec.coversNodes && rec.coversNodes.length > 0 && (
                              <div className="text-micro text-muted mt-1">Pokrywa: {rec.coversNodes.join(" · ")}</div>
                            )}
                          </div>
                          {!applied && state.phase !== "planning" && rec.lat != null && rec.lon != null && (
                            <button
                              onClick={() => handleDeployRec(i)}
                              className="text-micro text-accent hover:underline cursor-pointer shrink-0 mt-0.5"
                            >
                              Rozstaw
                            </button>
                          )}
                          {applied && (
                            <StatusPill tone="ok" size="xs" dot>
                              gotowe
                            </StatusPill>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {state.plan?.playbooks && state.plan.playbooks.length > 0 && (
                <div className="mt-3">
                  <span className="text-micro text-muted">Playbooki (warunkowo)</span>
                  <div className="flex flex-col gap-1.5 mt-1.5">
                    {state.plan.playbooks.map((p, i) => p?.id && (
                      <div key={i} className="px-3 py-2 rounded-(--r-sm) bg-surface-data">
                        <span className="text-data text-primary">{p.id}</span>
                        <div className="text-micro text-muted mt-0.5">Trigger: {p.when}</div>
                        <p className="text-caption text-secondary mt-0.5">{p.rationale}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {state.plan?.layeringStrategy && (
                <div className="mt-3 px-4 py-3 rounded-(--r-md) bg-info-soft border border-info/20">
                  <span className="text-micro text-info font-medium">Strategia warstwowa</span>
                  <p className="text-caption text-secondary mt-1 leading-relaxed">{state.plan.layeringStrategy}</p>
                </div>
              )}

              {state.plan?.residualRisk && (
                <div className="mt-2 px-4 py-3 rounded-(--r-md) bg-warn-soft border border-warn/20">
                  <span className="text-micro text-warn font-medium">Ryzyko rezydualne</span>
                  <p className="text-caption text-secondary mt-1 leading-relaxed">{state.plan.residualRisk}</p>
                </div>
              )}

              {state.phase === "deployed" && (
                <Button variant="primary" size="md" fullWidth className="mt-4" icon={<Swords className="w-4 h-4" />} onClick={handleStartRedTeam}>
                  Testuj plan przeciw AI red teamowi
                </Button>
              )}
            </Section>
          )}

          {/* ---------- PHASE 4: RED TEAM + AAR ---------- */}
          {(["redteaming", "redteamed", "running", "complete", "writingAar", "done"].includes(state.phase) || state.redTeam) && (
            <Section
              icon={<Swords className="w-3.5 h-3.5" />}
              title="3 · Red team adversarialny"
              subtitle="AI przeciwnik atakuje twój plan"
            >
              {state.phase === "redteaming" && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-(--r-md) bg-error-soft">
                  <Loader2 className="w-4 h-4 text-error animate-spin" />
                  <span className="text-caption text-error">Przeciwnik analizuje luki w obronie...</span>
                </div>
              )}

              {state.redTeam?.scenarioName && (
                <div className="px-4 py-3 rounded-(--r-md) bg-error-soft border border-error/20">
                  <span className="text-micro text-error font-medium">Scenariusz</span>
                  <p className="text-heading text-primary mt-1">{state.redTeam.scenarioName}</p>
                  {state.redTeam.doctrine && (
                    <p className="text-caption text-secondary leading-relaxed mt-2">{state.redTeam.doctrine}</p>
                  )}
                  {state.redTeam.exploitsGap && (
                    <div className="mt-2.5 pt-2.5 border-t border-error/15">
                      <span className="text-micro text-error">Wykorzystywana luka</span>
                      <p className="text-caption text-primary mt-1 leading-relaxed">{state.redTeam.exploitsGap}</p>
                    </div>
                  )}
                </div>
              )}

              {state.redTeam?.waves && state.redTeam.waves.length > 0 && (
                <div className="mt-3">
                  <span className="text-micro text-muted">Fale ataku ({state.redTeam.waves.length})</span>
                  <div className="flex flex-col gap-1.5 mt-1.5">
                    {state.redTeam.waves.map((w, i) => {
                      if (!w?.threatType) return null;
                      const node = nodes.find(n => n.id === w.targetNodeId);
                      return (
                        <div key={i} className="px-3 py-2 rounded-(--r-sm) bg-surface-data flex items-start gap-2.5">
                          <span className="text-data text-error tabular-nums shrink-0">T+{w.delaySeconds ?? 0}s</span>
                          <div className="flex-1 min-w-0">
                            <span className="text-data text-primary">{w.threatType} → {node?.name || w.targetNodeId}</span>
                            <p className="text-caption text-secondary leading-relaxed mt-0.5">{w.rationale}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {state.phase === "redteamed" && (
                <Button variant="danger" size="md" fullWidth className="mt-4" icon={<Swords className="w-4 h-4" />} onClick={handleLaunchRedTeam}>
                  Uruchom atak red teamu
                </Button>
              )}

              {state.phase === "running" && (
                <div className="mt-4 flex items-center gap-2 px-3 py-2.5 rounded-(--r-md) bg-error-soft border border-error/30">
                  <Radar className="w-4 h-4 text-error animate-pulse" />
                  <div className="flex flex-col">
                    <span className="text-caption text-error font-medium">Atak w toku</span>
                    <span className="text-micro text-error/80">{activeFlying} aktywnych ech · {threats.filter(t => t.status === "IMPACTED").length} impaktów</span>
                  </div>
                </div>
              )}

              {state.phase === "complete" && (
                <Button variant="primary" size="md" fullWidth className="mt-4" icon={<FileText className="w-4 h-4" />} onClick={handleWriteAar}>
                  Wygeneruj raport poscenariuszowy
                </Button>
              )}
            </Section>
          )}

          {/* ---------- AAR ---------- */}
          {(state.phase === "writingAar" || state.phase === "done") && (
            <Section
              icon={<FileText className="w-3.5 h-3.5" />}
              title="4 · After-Action Report"
              subtitle="Profesjonalna ocena scenariusza"
            >
              {state.phase === "writingAar" && state.aarText.length === 0 && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-(--r-md) bg-accent-soft">
                  <Loader2 className="w-4 h-4 text-accent animate-spin" />
                  <span className="text-caption text-accent">Sztab spisuje wnioski operacyjne...</span>
                </div>
              )}
              {state.aarText.length > 0 && (
                <div className="px-4 py-3 rounded-(--r-md) bg-surface-data text-caption text-primary leading-relaxed whitespace-pre-wrap font-(--font-sans)">
                  {state.aarText}
                  {state.phase === "writingAar" && (
                    <span className="inline-block w-1.5 h-3.5 bg-accent ml-0.5 anim-blink" />
                  )}
                </div>
              )}
            </Section>
          )}

          {/* Helpful empty hint */}
          {state.phase === "idle" && (
            <div className="mt-6 px-4 py-3 rounded-(--r-md) bg-surface-data">
              <div className="flex items-start gap-2.5">
                <Zap className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-caption text-primary font-medium">Jak to działa</span>
                  <p className="text-caption text-secondary leading-relaxed mt-1">
                    AI patrzy na obecny render mapy 3D, analizuje wrażliwości i przewiduje wektory ataku.
                    Następnie proponuje plan obrony, który możesz rozstawić jednym kliknięciem.
                    Na końcu AI wciela się w przeciwnika i atakuje twój własny plan, generując raport poscenariuszowy.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-subtle bg-surface-1 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-micro text-muted">
            <span>{deployedSystems.length} systemów</span>
            <span>·</span>
            <span>{threats.length} zagrożeń</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleReset}>
            Reset analizy
          </Button>
        </div>
      </Panel>
    </div>
  );
}

function Section({
  icon,
  title,
  subtitle,
  children
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5 last:mb-0">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-muted">{icon}</span>
        <span className="text-micro text-muted">{subtitle}</span>
      </div>
      <h4 className="text-heading text-primary mb-2.5">{title}</h4>
      <div>{children}</div>
    </div>
  );
}
