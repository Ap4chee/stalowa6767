export interface CriticalNode {
  id: string;
  name: string;
  lat: number;
  lon: number;
  type: "industrial" | "power" | "water" | "electrical" | "logistic" | "transit" | "hq";
  description: string;
  health: number;
  status: "OPERATIONAL" | "DEGRADED" | "DESTROYED";
  backupPower: boolean;
  notes: string;
}

export interface WeaponSystem {
  type: "PILICA" | "WRE" | "RADAR" | "PATRIOT";
  name: string;
  range: number;
  color: string;
  colorHex: string;
  description: string;
  threatsCovered: string[];
}

export interface DeployedSystem {
  id: string;
  type: "PILICA" | "WRE" | "RADAR" | "PATRIOT";
  name: string;
  lat: number;
  lon: number;
  radius: number;
  color: string;
}

export interface ThreatType {
  type: "DRONE" | "SHAHED" | "MISSILE";
  name: string;
  speed: number;
  alt: number;
  description: string;
  immuneToWRE: boolean;
}

export interface Threat {
  id: string;
  type: "DRONE" | "SHAHED" | "MISSILE";
  name: string;
  startLat: number;
  startLon: number;
  lat: number;
  lon: number;
  alt: number;
  targetId: string;
  pathType: "DIRECT" | "RIVER";
  progress: number;
  status: "FLYING" | "JAMMED" | "INTERCEPTED" | "IMPACTED";
  health: number;
}

export interface LogEntry {
  timestamp: string;
  text: string;
  type: "info" | "success" | "warning" | "error" | "combat";
}

export interface HoveredCoords {
  lat: number;
  lon: number;
  alt: number;
  az: number;
}

export type WeaponType = "PILICA" | "WRE" | "RADAR" | "PATRIOT";
export type ThreatTypeName = "DRONE" | "SHAHED" | "MISSILE";
export type NodeStatus = "OPERATIONAL" | "DEGRADED" | "DESTROYED";
export type LogType = "info" | "success" | "warning" | "error" | "combat";
export type SidebarTab = "details" | "cascades" | "playbooks";

export interface SimState {
  deployedSystems: DeployedSystem[];
  threats: Threat[];
  simSpeed: number;
  nodes: CriticalNode[];
  selectedWeapon: WeaponType | null;
}
