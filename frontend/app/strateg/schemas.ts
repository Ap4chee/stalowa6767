import { z } from "zod";

// ---------- Snapshot sent from client → API ----------

export const NodeSnapshotSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["industrial", "power", "water", "electrical", "logistic", "transit", "hq"]),
  lat: z.number(),
  lon: z.number(),
  description: z.string(),
  health: z.number(),
  status: z.enum(["OPERATIONAL", "DEGRADED", "DESTROYED"]),
  backupPower: z.boolean(),
  notes: z.string()
});

export const RelationSnapshotSchema = z.object({
  source: z.string(),
  target: z.string(),
  label: z.string()
});

export const DeployedSystemSnapshotSchema = z.object({
  id: z.string(),
  type: z.enum(["PILICA", "WRE", "RADAR", "PATRIOT"]),
  name: z.string(),
  lat: z.number(),
  lon: z.number(),
  radius: z.number(),
  status: z.enum(["OPERATIONAL", "RELOCATING"]).optional()
});

export const ThreatSnapshotSchema = z.object({
  id: z.string(),
  type: z.enum(["DRONE", "SHAHED", "MISSILE"]),
  name: z.string(),
  lat: z.number(),
  lon: z.number(),
  alt: z.number(),
  targetId: z.string(),
  status: z.enum(["FLYING", "JAMMED", "INTERCEPTED", "IMPACTED"])
});

export const TacticalSnapshotSchema = z.object({
  city: z.object({
    name: z.string(),
    lat: z.number(),
    lon: z.number()
  }),
  nodes: z.array(NodeSnapshotSchema),
  relations: z.array(RelationSnapshotSchema),
  deployedSystems: z.array(DeployedSystemSnapshotSchema),
  threats: z.array(ThreatSnapshotSchema),
  notes: z.string().optional()
});

export type TacticalSnapshot = z.infer<typeof TacticalSnapshotSchema>;

// ---------- Stage 1: Assessment (vision) ----------

export const VulnerabilitySchema = z.object({
  nodeId: z.string().describe("ID of the critical node, e.g. OBJ_01"),
  rank: z.number().int().min(1).describe("Priority rank, 1 = highest risk"),
  riskScore: z.number().min(0).max(100).describe("Risk score 0-100"),
  reasoning: z.string().describe("Short Polish-language explanation (1-2 sentences) why this node is exposed"),
  cascadeImpact: z.array(z.string()).describe("Node IDs that would degrade/fall if this node falls (cascade chain)")
});

export const PredictedVectorSchema = z.object({
  id: z.string().describe("Unique short id, e.g. VEC_01"),
  threatType: z.enum(["DRONE", "SHAHED", "MISSILE"]),
  approachFromLat: z.number().describe("Origin latitude (typically east of Stalowa Wola, lat 50.4-50.7)"),
  approachFromLon: z.number().describe("Origin longitude (typically east, lon 22.10-22.30)"),
  targetNodeId: z.string().describe("Target critical node ID"),
  pathType: z.enum(["DIRECT", "RIVER"]).describe("DIRECT for drones/missiles, RIVER for SHAHED following San corridor"),
  likelihood: z.number().min(0).max(100).describe("Probability score 0-100"),
  reasoning: z.string().describe("1-2 sentence Polish-language tactical reasoning")
});

export const AssessmentSchema = z.object({
  summary: z.string().describe("3-5 sentence Polish-language tactical summary written like an intelligence briefing. Direct, no fluff."),
  vulnerabilities: z.array(VulnerabilitySchema).min(1).max(7),
  predictedVectors: z.array(PredictedVectorSchema).min(1).max(6),
  keyFinding: z.string().describe("ONE-line headline finding in Polish, e.g. 'Korytarz Sanu daje Shahedom niewidoczne podejście na elektrownię.'")
});

export type Assessment = z.infer<typeof AssessmentSchema>;

// ---------- Stage 2/3: Defense Plan ----------

export const DeploymentRecSchema = z.object({
  id: z.string().describe("Short ID, e.g. DEP_01"),
  type: z.enum(["PILICA", "WRE", "RADAR", "PATRIOT"]),
  lat: z.number().describe("Latitude near Stalowa Wola (50.50-50.62)"),
  lon: z.number().describe("Longitude near Stalowa Wola (22.00-22.15)"),
  rationale: z.string().describe("1-2 sentence Polish rationale: which threat it counters, which node it covers"),
  coversNodes: z.array(z.string()).describe("Node IDs this deployment covers within range")
});

export const PlaybookRecSchema = z.object({
  id: z.enum(["SIREN", "ALERT_SMS", "BACKUP_GEN"]),
  when: z.string().describe("Trigger condition in Polish, e.g. 'Po wykryciu echa Shaheda nad korytarzem Sanu'"),
  rationale: z.string().describe("1 sentence Polish rationale")
});

export const PlanSchema = z.object({
  doctrine: z.string().describe("ONE-line Polish doctrine for the plan, e.g. 'Warstwowa obrona z priorytetem ochrony elektrowni i CZK'"),
  deployments: z.array(DeploymentRecSchema).min(2).max(6).describe("Concrete deployment recommendations"),
  playbooks: z.array(PlaybookRecSchema).max(3).describe("Civilian protection playbooks to pre-arm"),
  layeringStrategy: z.string().describe("2-3 sentence Polish summary of how the layers (RADAR detect → WRE jam → PILICA close → PATRIOT long) work together"),
  residualRisk: z.string().describe("1-2 sentence Polish summary of what remains uncovered and why")
});

export type Plan = z.infer<typeof PlanSchema>;

// ---------- Stage 4: Red Team adversarial scenario ----------

export const AttackWaveSchema = z.object({
  threatType: z.enum(["DRONE", "SHAHED", "MISSILE"]),
  targetNodeId: z.string().describe("Target node ID from the snapshot"),
  delaySeconds: z.number().int().min(0).max(60).describe("Delay in seconds from scenario start (0-60)"),
  rationale: z.string().describe("1 sentence Polish: what this wave is designed to exploit")
});

export const RedTeamScenarioSchema = z.object({
  scenarioName: z.string().describe("Polish scenario name, e.g. 'Rój saturacyjny korytarzem Sanu'"),
  doctrine: z.string().describe("2-3 sentence Polish enemy doctrine: how they fight, why this approach"),
  exploitsGap: z.string().describe("1-2 sentence Polish: which specific gap in the defender's plan this attack targets"),
  waves: z.array(AttackWaveSchema).min(2).max(6).describe("Sequence of attack waves, ordered by delaySeconds")
});

export type RedTeamScenario = z.infer<typeof RedTeamScenarioSchema>;

// ---------- Stage 4: AAR (text only, no schema) ----------

export const AarRequestSchema = z.object({
  snapshot: TacticalSnapshotSchema,
  scenarioRun: z.object({
    scenarioName: z.string(),
    durationSeconds: z.number(),
    nodesLost: z.array(z.string()),
    nodesDegraded: z.array(z.string()),
    threatsLaunched: z.number(),
    threatsIntercepted: z.number(),
    threatsImpacted: z.number()
  })
});

export type AarRequest = z.infer<typeof AarRequestSchema>;
