import { useEffect, useRef, useState, useCallback, MutableRefObject } from "react";
import { CriticalNode, DeployedSystem, HoveredCoords, LogType, SimState, Threat, NodeRelation, WeaponType } from "../types";
import { WEAPONS } from "../data/weapons";
import { THREAT_TYPES } from "../data/threats";
import { INITIAL_NODES, NODE_COLORS } from "../data/nodes";
import { SAN_RIVER_COORDS } from "../data/river";
import {
  spawnImpactExplosion,
  spawnInterceptBurst,
  spawnFallingDrone,
  disposeEffect,
  type ActiveEffect
} from "./cesiumEffects";

export type CombatEvent =
  | { kind: "impact"; threatType: "DRONE" | "SHAHED" | "MISSILE"; nodeId: string; lon: number; lat: number }
  | { kind: "intercept"; systemType: "PILICA" | "PATRIOT" | "WRE" | "RADAR"; threatType: "DRONE" | "SHAHED" | "MISSILE"; lon: number; lat: number };

// Stalowa Wola sits on the Sandomierz Basin at ~155 m above the WGS84 ellipsoid.
// All Cesium entity altitudes (nodes, deployed systems, threats, relation curves)
// are offset by this constant so they land on the photorealistic 3D tile surface
// instead of sinking below it. Buildings/terrain in Google Photorealistic 3D Tiles
// are positioned at real-world elevations.
const GROUND_ALT = 155;

// Cache so we don't redraw the same badge canvas every render — keyed on color+label.
const _badgeCache: Record<string, string> = {};

// Render a soft-SaaS pin badge to a data URL Cesium can use as a billboard image.
// White ring + colored fill + dark "01" code in white. Drop shadow for readability
// over busy satellite/photoreal backgrounds. Always pixel-sized → readable at any zoom.
function makeBadgeImage(color: string, label: string, sizePx = 96): string {
  const key = `${color}|${label}|${sizePx}`;
  if (_badgeCache[key]) return _badgeCache[key];
  if (typeof document === "undefined") return "";
  const canvas = document.createElement("canvas");
  canvas.width = sizePx;
  canvas.height = sizePx;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const cx = sizePx / 2;
  const cy = sizePx / 2;
  // Outer drop-shadow disc
  ctx.shadowColor = "rgba(15,23,42,0.4)";
  ctx.shadowBlur = sizePx * 0.12;
  ctx.shadowOffsetY = sizePx * 0.04;
  ctx.beginPath();
  ctx.arc(cx, cy, sizePx * 0.4, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  // Inner colored disc (no shadow)
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.beginPath();
  ctx.arc(cx, cy, sizePx * 0.33, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  // Label centered
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 ${Math.round(sizePx * 0.34)}px Inter, system-ui, -apple-system, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, cx, cy + sizePx * 0.02);
  const url = canvas.toDataURL("image/png");
  _badgeCache[key] = url;
  return url;
}

interface MapLayersState {
  baseMap: boolean;
  nodes: boolean;
  relations: boolean;
  domes: boolean;
  threats: boolean;
  tacticalZones: boolean;
  hydrology: boolean;
}

interface UseCesiumViewerOptions {
  containerRef: MutableRefObject<HTMLDivElement | null>;
  simStateRef: MutableRefObject<SimState>;
  centerLat: number;
  centerLon: number;
  onAddLog: (text: string, type: LogType) => void;
  setDeployedSystems: (fn: (prev: DeployedSystem[]) => DeployedSystem[]) => void;
  setThreats: (fn: (prev: Threat[]) => Threat[]) => void;
  setNodes: (fn: (prev: CriticalNode[]) => CriticalNode[]) => void;
  setSelectedWeapon: (val: string | null) => void;
  setHoveredCoords: (val: HoveredCoords) => void;
  setSelectedNode?: (node: CriticalNode | null) => void;
  setSelectedSystem?: (sys: DeployedSystem | null) => void;
  theme?: "light" | "dark";
  mapLayers: MapLayersState;
  nodes: CriticalNode[];
  relations: NodeRelation[];
  baseMapType?: "standard" | "satellite" | "topo";
  sceneMode?: "3d" | "2d";
  onConfirmRelocationPosition?: (sysId: string, lat: number, lon: number) => void;
  effectsEnabled?: boolean;
  onCombatEvent?: (event: CombatEvent) => void;
  selectedWeapon?: WeaponType | null;
}

export function useCesiumViewer({
  containerRef,
  simStateRef,
  centerLat,
  centerLon,
  onAddLog,
  setDeployedSystems,
  setThreats,
  setNodes,
  setSelectedWeapon,
  setHoveredCoords,
  setSelectedNode,
  setSelectedSystem,
  theme = "light",
  mapLayers,
  nodes,
  relations,
  baseMapType = "standard",
  sceneMode = "3d",
  onConfirmRelocationPosition,
  effectsEnabled = true,
  onCombatEvent,
  selectedWeapon = null
}: UseCesiumViewerOptions) {
  const viewerRef = useRef<any>(null);
  const nodeEntitiesRef = useRef<{ [id: string]: any }>({});
  const nodeBodyEntitiesRef = useRef<{ [id: string]: any[] }>({});
  const photorealTilesetRef = useRef<any>(null);
  const domeEntitiesRef = useRef<{ [id: string]: any[] }>({});
  const threatEntitiesRef = useRef<{ [id: string]: any }>({});
  const threatTrailEntitiesRef = useRef<{ [id: string]: any }>({});
  const threatTrailPositionsRef = useRef<{ [id: string]: any[] }>({});
  const threatPrevPosRef = useRef<{ [id: string]: { lon: number; lat: number; alt: number } }>({});
  const laserLinesRef = useRef<any>(null);
  const relocationDragStateRef = useRef<{ active: boolean; sysId: string } | null>(null);
  const deployPreviewStateRef = useRef<{ active: boolean; type: WeaponType } | null>(null);
  const lastCursorLatLonRef = useRef<{ lat: number; lon: number } | null>(null);
  const [isCesiumLoaded, setIsCesiumLoaded] = useState(false);
  const [isZoomedOut, setIsZoomedOut] = useState(false);
  const onConfirmRelocationPositionRef = useRef(onConfirmRelocationPosition);

  // Combat effects: list of active per-frame effects + latest prop refs.
  // No camera shake / no screen overlay — effects stay confined to the 3D scene.
  const effectsRef = useRef<ActiveEffect[]>([]);
  const effectsEnabledRef = useRef(effectsEnabled);
  const onCombatEventRef = useRef(onCombatEvent);

  useEffect(() => {
    effectsEnabledRef.current = effectsEnabled;
  }, [effectsEnabled]);

  useEffect(() => {
    onCombatEventRef.current = onCombatEvent;
  }, [onCombatEvent]);

  useEffect(() => {
    onConfirmRelocationPositionRef.current = onConfirmRelocationPosition;
  }, [onConfirmRelocationPosition]);
  const clusterEntityRef = useRef<any>(null);

  // Layer groups refs to easily toggle visibility
  const nodeEntitiesGroupRef = useRef<any[]>([]);
  const relationEntitiesGroupRef = useRef<any[]>([]);
  const hydrologyEntitiesGroupRef = useRef<any[]>([]);
  const tacticalZoneEntitiesGroupRef = useRef<any[]>([]);

  const flyToNode = useCallback((lat: number, lon: number, name: string) => {
    const viewer = viewerRef.current;
    const Cesium = (window as any).Cesium;
    if (viewer && Cesium) {
      // Subtle cinematic orbital approach: come in from the south-east at low altitude
      const approachHeading = Cesium.Math.toRadians(-25.0);
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(lon + 0.006, lat - 0.010, GROUND_ALT + 850),
        orientation: {
          heading: approachHeading,
          pitch: Cesium.Math.toRadians(-32.0),
          roll: 0.0
        },
        duration: 2.4,
        easingFunction: Cesium.EasingFunction?.QUARTIC_IN_OUT
      });
      onAddLog(`KAMERA: Skupiono widok 3D na ${name}`, "info");
    }
  }, [onAddLog]);

  const resetViewer = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    Object.keys(domeEntitiesRef.current).forEach((key) => {
      const ents = domeEntitiesRef.current[key];
      if (Array.isArray(ents)) {
        ents.forEach(ent => viewer.entities.remove(ent));
      } else {
        viewer.entities.remove(ents);
      }
    });
    domeEntitiesRef.current = {};

    Object.keys(threatEntitiesRef.current).forEach((key) => {
      viewer.entities.remove(threatEntitiesRef.current[key]);
    });
    threatEntitiesRef.current = {};

    Object.keys(threatTrailEntitiesRef.current).forEach((key) => {
      viewer.entities.remove(threatTrailEntitiesRef.current[key]);
    });
    threatTrailEntitiesRef.current = {};
    threatTrailPositionsRef.current = {};
    threatPrevPosRef.current = {};

    if (laserLinesRef.current && typeof laserLinesRef.current.removeAll === "function") {
      laserLinesRef.current.removeAll();
    }

    // Cleanup any in-flight combat effects
    effectsRef.current.forEach((eff) => disposeEffect(viewer, eff));
    effectsRef.current = [];

    const Cesium = (window as any).Cesium;
    INITIAL_NODES.forEach((node) => {
      const entity = nodeEntitiesRef.current[node.id];
      if (entity && Cesium) {
        entity.point.color = Cesium.Color.fromCssColorString("#22c55e");
      }
    });
  }, []);

  const removeDeployedSystem = useCallback((sysId: string) => {
    const viewer = viewerRef.current;
    const Cesium = (window as any).Cesium;
    if (!viewer || !Cesium) return;

    const idsToRemove = [sysId, `${sysId}_tower`, `${sysId}_model`, `${sysId}_beacon`, `${sysId}_label`];
    idsToRemove.forEach(id => {
      const ent = viewer.entities.getById(id);
      if (ent) viewer.entities.remove(ent);
    });

    if (domeEntitiesRef.current[sysId]) {
      const ents = domeEntitiesRef.current[sysId];
      if (Array.isArray(ents)) {
        ents.forEach(ent => viewer.entities.remove(ent));
      } else {
        viewer.entities.remove(ents);
      }
      delete domeEntitiesRef.current[sysId];
    }
  }, []);

  const cancelRelocationDrag = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    relocationDragStateRef.current = null;

    const ids = ["sys_reloc_ghost_model", "sys_reloc_ghost_dome", "sys_reloc_ghost_label"];
    ids.forEach(id => {
      const ent = viewer.entities.getById(id);
      if (ent) viewer.entities.remove(ent);
    });
  }, []);

  const startRelocationDrag = useCallback((sysId: string) => {
    const viewer = viewerRef.current;
    const Cesium = (window as any).Cesium;
    if (!viewer || !Cesium) return;

    // Clear any previous ghost
    cancelRelocationDrag();

    const sys = simStateRef.current.deployedSystems.find((s: DeployedSystem) => s.id === sysId);
    if (!sys) return;

    relocationDragStateRef.current = {
      active: true,
      sysId
    };

    // Create the ghost label
    viewer.entities.add({
      id: "sys_reloc_ghost_label",
      position: Cesium.Cartesian3.fromDegrees(sys.lon, sys.lat, GROUND_ALT + 120),
      label: {
        text: "Nowa pozycja baterii\nPrzesuń kursorem",
        font: "500 28px 'Inter', system-ui, -apple-system, sans-serif",
        fillColor: Cesium.Color.fromCssColorString("#0b1220"),
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 5,
        showBackground: false,
        scale: 0.4,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    });

    // Create the ghost dome (subtle neutral grid)
    viewer.entities.add({
      id: "sys_reloc_ghost_dome",
      position: Cesium.Cartesian3.fromDegrees(sys.lon, sys.lat, GROUND_ALT),
      ellipsoid: {
        radii: new Cesium.Cartesian3(sys.radius, sys.radius, sys.radius),
        material: new Cesium.GridMaterialProperty({
          color: Cesium.Color.fromCssColorString("#94a3b8").withAlpha(0.45),
          cellAlpha: 0.0,
          lineCount: new Cesium.Cartesian2(6, 6),
          thickness: new Cesium.Cartesian2(1.0, 1.0)
        }),
        outline: false,
        minimumCone: 0,
        maximumCone: Cesium.Math.PI_OVER_TWO
      }
    });

    // Create the ghost 3D model (grayed-out silhouetted)
    if (sys.type === "PATRIOT") {
      viewer.entities.add({
        id: "sys_reloc_ghost_model",
        position: Cesium.Cartesian3.fromDegrees(sys.lon, sys.lat, GROUND_ALT),
        model: {
          uri: "/3d_models/patriot.glb",
          scale: 25,
          minimumPixelSize: 64,
          maximumScale: 50,
          color: Cesium.Color.fromCssColorString("#94a3b8").withAlpha(0.6),
          silhouetteColor: Cesium.Color.fromCssColorString("#cbd5e1"),
          silhouetteSize: 1.0,
          colorBlendMode: Cesium.ColorBlendMode.MIX,
          colorBlendAmount: 0.8
        }
      });
    } else if (sys.type === "PILICA") {
      viewer.entities.add({
        id: "sys_reloc_ghost_model",
        position: Cesium.Cartesian3.fromDegrees(sys.lon, sys.lat, GROUND_ALT),
        model: {
          uri: "/3d_models/pilica.glb",
          scale: 30,
          minimumPixelSize: 64,
          color: Cesium.Color.fromCssColorString("#94a3b8").withAlpha(0.6),
          silhouetteColor: Cesium.Color.fromCssColorString("#cbd5e1"),
          silhouetteSize: 1.0,
          colorBlendMode: Cesium.ColorBlendMode.MIX,
          colorBlendAmount: 0.8
        }
      });
    } else {
      // Default cube tower for Radar or WRE
      viewer.entities.add({
        id: "sys_reloc_ghost_model",
        position: Cesium.Cartesian3.fromDegrees(sys.lon, sys.lat, GROUND_ALT + 25),
        box: {
          dimensions: new Cesium.Cartesian3(30, 30, 50),
          material: Cesium.Color.fromCssColorString("#94a3b8").withAlpha(0.4)
        }
      });
    }
  }, [cancelRelocationDrag]);

  const cancelDeploymentPreview = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    deployPreviewStateRef.current = null;

    const canvas = viewer.scene?.canvas;
    if (canvas) canvas.style.cursor = "";

    const ids = [
      "sys_deploy_preview_model",
      "sys_deploy_preview_dome",
      "sys_deploy_preview_circle",
      "sys_deploy_preview_label"
    ];
    ids.forEach(id => {
      const ent = viewer.entities.getById(id);
      if (ent) viewer.entities.remove(ent);
    });
  }, []);

  const startDeploymentPreview = useCallback((type: WeaponType) => {
    const viewer = viewerRef.current;
    const Cesium = (window as any).Cesium;
    if (!viewer || !Cesium) return;

    cancelDeploymentPreview();

    const weapon = WEAPONS.find(w => w.type === type);
    if (!weapon) return;

    deployPreviewStateRef.current = { active: true, type };

    const canvas = viewer.scene?.canvas;
    if (canvas) canvas.style.cursor = "crosshair";

    const start = lastCursorLatLonRef.current ?? { lat: centerLat, lon: centerLon };
    const { lat: lat0, lon: lon0 } = start;
    const color = Cesium.Color.fromCssColorString(weapon.colorHex);

    // Ground footprint outline (so you see the exact range on the ground)
    viewer.entities.add({
      id: "sys_deploy_preview_circle",
      position: Cesium.Cartesian3.fromDegrees(lon0, lat0),
      ellipse: {
        semiMajorAxis: weapon.range,
        semiMinorAxis: weapon.range,
        material: color.withAlpha(0.05),
        outline: true,
        outlineColor: color.withAlpha(0.55),
        outlineWidth: 1.5,
        height: GROUND_ALT + 1
      }
    });

    // Range dome (matches the real deployed dome — preview is true-to-life)
    viewer.entities.add({
      id: "sys_deploy_preview_dome",
      position: Cesium.Cartesian3.fromDegrees(lon0, lat0, GROUND_ALT),
      ellipsoid: {
        radii: new Cesium.Cartesian3(weapon.range, weapon.range, weapon.range),
        material: new Cesium.GridMaterialProperty({
          color: color.withAlpha(0.45),
          cellAlpha: 0.0,
          lineCount: new Cesium.Cartesian2(8, 8),
          thickness: new Cesium.Cartesian2(1.2, 1.2)
        }),
        outline: false,
        minimumCone: 0,
        maximumCone: Cesium.Math.PI_OVER_TWO
      }
    });

    // 3D model ghost — weapon-tinted silhouette
    if (type === "PATRIOT") {
      viewer.entities.add({
        id: "sys_deploy_preview_model",
        position: Cesium.Cartesian3.fromDegrees(lon0, lat0, GROUND_ALT),
        model: {
          uri: "/3d_models/patriot.glb",
          scale: 25,
          minimumPixelSize: 64,
          maximumScale: 50,
          color: Cesium.Color.WHITE.withAlpha(0.7),
          silhouetteColor: color,
          silhouetteSize: 2.0,
          colorBlendMode: Cesium.ColorBlendMode.MIX,
          colorBlendAmount: 0.2
        }
      });
    } else if (type === "PILICA") {
      viewer.entities.add({
        id: "sys_deploy_preview_model",
        position: Cesium.Cartesian3.fromDegrees(lon0, lat0, GROUND_ALT),
        model: {
          uri: "/3d_models/pilica.glb",
          scale: 30,
          minimumPixelSize: 64,
          maximumScale: 50,
          color: Cesium.Color.WHITE.withAlpha(0.7),
          silhouetteColor: color,
          silhouetteSize: 2.0,
          colorBlendMode: Cesium.ColorBlendMode.MIX,
          colorBlendAmount: 0.2
        }
      });
    } else {
      // Tower ghost for Radar / WRE
      viewer.entities.add({
        id: "sys_deploy_preview_model",
        position: Cesium.Cartesian3.fromDegrees(lon0, lat0, GROUND_ALT + 18),
        cylinder: {
          length: 36,
          topRadius: 5,
          bottomRadius: 7,
          slices: 24,
          material: color.withAlpha(0.4),
          outline: true,
          outlineColor: color.withAlpha(0.8)
        }
      });
    }

    // Floating label: weapon name + range + live GPS + action hint
    const labelHeight = type === "PATRIOT" ? 130 : type === "PILICA" ? 110 : 80;
    viewer.entities.add({
      id: "sys_deploy_preview_label",
      position: Cesium.Cartesian3.fromDegrees(lon0, lat0, GROUND_ALT + labelHeight),
      label: {
        text: `${weapon.name}\nZasięg ${(weapon.range / 1000).toFixed(1)} km\n${lat0.toFixed(4)}°N · ${lon0.toFixed(4)}°E\nKliknij, aby rozstawić`,
        font: "500 28px 'Inter', system-ui, -apple-system, sans-serif",
        fillColor: Cesium.Color.fromCssColorString("#0b1220"),
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 5,
        showBackground: false,
        scale: 0.4,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -8),
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    });
  }, [cancelDeploymentPreview, centerLat, centerLon]);

  // React to selectedWeapon changes — start preview on arm, cancel on disarm or type swap
  useEffect(() => {
    if (!isCesiumLoaded) return;
    if (selectedWeapon) {
      startDeploymentPreview(selectedWeapon);
    } else {
      cancelDeploymentPreview();
    }
  }, [selectedWeapon, isCesiumLoaded, startDeploymentPreview, cancelDeploymentPreview]);

  const drawDeployedSystem = useCallback((sys: DeployedSystem) => {
    const viewer = viewerRef.current;
    const Cesium = (window as any).Cesium;
    if (!viewer || !Cesium) return;

    const idsToRemove = [sys.id, `${sys.id}_tower`, `${sys.id}_model`, `${sys.id}_beacon`, `${sys.id}_label`];
    idsToRemove.forEach(id => {
      const ent = viewer.entities.getById(id);
      if (ent) viewer.entities.remove(ent);
    });

    if (domeEntitiesRef.current[sys.id]) {
      const ents = domeEntitiesRef.current[sys.id];
      if (Array.isArray(ents)) {
        ents.forEach(ent => viewer.entities.remove(ent));
      } else {
        viewer.entities.remove(ents);
      }
      delete domeEntitiesRef.current[sys.id];
    }

    const lon = sys.lon;
    const lat = sys.lat;

    const isRelocating = sys.status === "RELOCATING";
    const opacity = isRelocating ? 0.25 : 1.0;

    const domeEntity = viewer.entities.add({
      id: sys.id,
      position: Cesium.Cartesian3.fromDegrees(lon, lat, GROUND_ALT),
      ellipsoid: {
        radii: new Cesium.Cartesian3(sys.radius, sys.radius, sys.radius),
        material: new Cesium.GridMaterialProperty({
          color: Cesium.Color.fromCssColorString(sys.color).withAlpha(0.55 * opacity),
          cellAlpha: 0.0,
          lineCount: new Cesium.Cartesian2(8, 8),
          thickness: new Cesium.Cartesian2(1.2, 1.2)
        }),
        outline: false,
        minimumCone: 0,
        maximumCone: Cesium.Math.PI_OVER_TWO
      },
      show: mapLayers.domes
    });

    const groundCircle = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(lon, lat),
      ellipse: {
        semiMajorAxis: sys.radius,
        semiMinorAxis: sys.radius,
        material: Cesium.Color.fromCssColorString(sys.color).withAlpha(0.025 * opacity),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString(sys.color).withAlpha(0.35 * opacity),
        outlineWidth: 1,
        height: GROUND_ALT + 1
      },
      show: mapLayers.domes
    });

    const deployedGlassColor = Cesium.Color.fromCssColorString(sys.color).withAlpha(0.18 * opacity);

    if (sys.type === "PATRIOT") {
      const heading = Cesium.Math.toRadians(0);
      const pitch = 0;
      const roll = 0;
      const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
      const position = Cesium.Cartesian3.fromDegrees(lon, lat, GROUND_ALT);
      const orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);

      viewer.entities.add({
        id: sys.id + "_model",
        position: position,
        orientation: orientation as any,
        model: {
          uri: "/3d_models/patriot.glb",
          scale: 25,
          minimumPixelSize: 64,
          maximumScale: 50,
          silhouetteColor: Cesium.Color.fromCssColorString(sys.color).withAlpha(opacity),
          silhouetteSize: 1.5,
          colorBlendMode: Cesium.ColorBlendMode.MIX,
          colorBlendAmount: 0.1,
          color: Cesium.Color.WHITE.withAlpha(opacity)
        }
      });

      viewer.entities.add({
        id: sys.id + "_beacon",
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArrayHeights([
            lon, lat, GROUND_ALT,
            lon, lat, GROUND_ALT + 120
          ]),
          width: 1,
          material: Cesium.Color.fromCssColorString(sys.color).withAlpha(0.5 * opacity)
        }
      });
    } else if (sys.type === "PILICA") {
      const heading = Cesium.Math.toRadians(0);
      const pitch = 0;
      const roll = 0;
      const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
      const position = Cesium.Cartesian3.fromDegrees(lon, lat, GROUND_ALT);
      const orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);

      viewer.entities.add({
        id: sys.id + "_model",
        position: position,
        orientation: orientation as any,
        model: {
          uri: "/3d_models/pilica.glb",
          scale: 30,
          minimumPixelSize: 64,
          maximumScale: 50,
          silhouetteColor: Cesium.Color.fromCssColorString(sys.color).withAlpha(opacity),
          silhouetteSize: 1.5,
          colorBlendMode: Cesium.ColorBlendMode.MIX,
          colorBlendAmount: 0.1,
          color: Cesium.Color.WHITE.withAlpha(opacity)
        }
      });

      viewer.entities.add({
        id: sys.id + "_beacon",
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArrayHeights([
            lon, lat, GROUND_ALT,
            lon, lat, GROUND_ALT + 100
          ]),
          width: 1,
          material: Cesium.Color.fromCssColorString(sys.color).withAlpha(0.5 * opacity)
        }
      });
    } else {
      // Slim cylindrical pillar (radar / WRE / etc.)
      viewer.entities.add({
        id: sys.id + "_tower",
        position: Cesium.Cartesian3.fromDegrees(lon, lat, GROUND_ALT + 18),
        cylinder: {
          length: 36, topRadius: 5, bottomRadius: 7,
          slices: 24,
          material: deployedGlassColor,
          outline: false
        }
      });

      viewer.entities.add({
        id: sys.id + "_beacon",
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArrayHeights([
            lon, lat, GROUND_ALT + 36,
            lon, lat, GROUND_ALT + 70
          ]),
          width: 1,
          material: Cesium.Color.fromCssColorString(sys.color).withAlpha(0.55 * opacity)
        }
      });
    }

    const labelHeight = sys.type === "PATRIOT" ? 130 : sys.type === "PILICA" ? 110 : 80;
    viewer.entities.add({
      id: sys.id + "_label",
      position: Cesium.Cartesian3.fromDegrees(lon, lat, GROUND_ALT + labelHeight),
      label: {
        text: sys.name + (isRelocating ? ` · marsz ${sys.relocationSecondsLeft}s` : ""),
        font: "600 32px 'Inter', system-ui, -apple-system, sans-serif",
        fillColor: Cesium.Color.fromCssColorString(isRelocating ? "#d97706" : "#0b1220"),
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 5,
        showBackground: false,
        scale: 0.34,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -10),
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    });

    domeEntitiesRef.current[sys.id] = [domeEntity, groundCircle];
  }, [mapLayers.domes]);

  useEffect(() => {
    const Cesium = (window as any).Cesium;
    if (!Cesium || !containerRef.current) return;

    // Authenticate against Cesium ion BEFORE constructing the viewer so any
    // ion-backed asset request (3D Tiles, terrain, imagery) carries the token.
    const ionToken = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN;
    if (ionToken && Cesium.Ion?.defaultAccessToken !== undefined) {
      Cesium.Ion.defaultAccessToken = ionToken;
    }

    const viewer = new Cesium.Viewer(containerRef.current, {
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      sceneModePicker: false,
      selectionIndicator: false,
      timeline: false,
      navigationHelpButton: false,
      animation: false,
      fullscreenButton: false,
      creditContainer: document.createElement("div"),
      terrain: undefined,
      imageryProvider: false as any
    });

    // Render at 85% of native pixel density — ~30% fewer fragment shader invocations
    // per frame for a minor visual softening. On retina (dpr 2) this is a big win.
    viewer.resolutionScale = 0.85;
    viewer.useBrowserRecommendedResolution = false;

    viewerRef.current = viewer;
    setIsCesiumLoaded(true);

    const laserCollection = viewer.scene.primitives.add(new Cesium.PolylineCollection());
    laserLinesRef.current = laserCollection;

    viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString(theme === "dark" ? "#020617" : "#f8fafc");

    // === CINEMATIC SCENE SETUP ===
    // Atmosphere rim glow on the limb of the globe
    viewer.scene.skyAtmosphere.show = true;
    if (viewer.scene.skyAtmosphere.hueShift !== undefined) {
      viewer.scene.skyAtmosphere.hueShift = theme === "dark" ? 0.0 : -0.05;
      viewer.scene.skyAtmosphere.saturationShift = theme === "dark" ? -0.2 : -0.4;
      viewer.scene.skyAtmosphere.brightnessShift = theme === "dark" ? -0.4 : 0.15;
    }

    // Subtle distance fog for depth (NOT too aggressive)
    viewer.scene.fog.enabled = true;
    viewer.scene.fog.density = 0.0001;
    viewer.scene.fog.screenSpaceErrorFactor = 4.0;

    // Soft ground halo on the horizon
    viewer.scene.globe.showGroundAtmosphere = true;

    // Sun lighting — fixed to early-afternoon for warm, consistent tactical look
    viewer.scene.globe.enableLighting = true;
    viewer.clock.shouldAnimate = false;
    try {
      // Fix to 11:00 UTC summer day so lighting always looks bright and warm
      viewer.clock.currentTime = Cesium.JulianDate.fromIso8601("2025-06-21T11:00:00Z");
    } catch {
      /* noop */
    }

    // With photorealistic 3D tiles loaded, entities must depth-test against the
    // tile surface so they don't render in front of solid terrain/buildings.
    viewer.scene.globe.depthTestAgainstTerrain = true;

    // Disable default double-click "track entity" so our click handlers stay in control
    viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

    // Set camera DIRECTLY to the tactical view — skips the 3.2 s cinematic fly-in.
    // The fly-in looked nice but cost real time-to-interactive AND triggered extra
    // photoreal tile fetches along the flight path. Land at the final orbit on frame 1.
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(centerLon, centerLat - 0.018, GROUND_ALT + 4500),
      orientation: {
        heading: Cesium.Math.toRadians(15.0),
        pitch: Cesium.Math.toRadians(-38.0),
        roll: 0.0
      }
    });

    // === GOOGLE PHOTOREALISTIC 3D TILES (photogrammetric mesh: terrain + buildings) ===
    // Replaces OSM Buildings AND a separate terrain provider — the tileset ships both.
    // Requires Cesium ion access token; falls back to OSM Buildings if creation fails.
    // We also hide the default globe + dim the basemap when photoreal is active, since
    // the photoreal mesh has its own colored ground and the blue globe would z-fight.
    (async () => {
      try {
        if (typeof Cesium.createGooglePhotorealistic3DTileset === "function") {
          const photoreal = await Cesium.createGooglePhotorealistic3DTileset();
          // Loading speed tuning. Defaults render extremely high detail (SSE 16)
          // which means tons of small tiles. We trade a touch of crispness for
          // dramatically faster load + smaller network bandwidth.
          photoreal.maximumScreenSpaceError = 24;        // coarser tiles (default 16)
          photoreal.skipLevelOfDetail = true;            // render coarse first, refine later
          photoreal.baseScreenSpaceError = 1024;         // accept very coarse on first paint
          photoreal.skipScreenSpaceErrorFactor = 16;
          photoreal.skipLevels = 1;
          photoreal.immediatelyLoadDesiredLevelOfDetail = false;
          photoreal.loadSiblings = false;                // don't preload off-screen siblings
          photoreal.cullWithChildrenBounds = true;
          photoreal.preloadWhenHidden = false;

          viewer.scene.primitives.add(photoreal);
          photorealTilesetRef.current = photoreal;
          if (viewer.scene.mode === Cesium.SceneMode.SCENE3D) {
            viewer.scene.globe.show = false;
          }
          viewer.scene.skyAtmosphere.show = true;
        } else if (typeof Cesium.createOsmBuildingsAsync === "function") {
          // Fallback: OSM Buildings (LEGO blocks) if photoreal API unavailable.
          const buildingsTileset = await Cesium.createOsmBuildingsAsync();
          const palette = theme === "dark"
            ? { tall: "#7c3aed", mid: "#475569", low: "#334155" }
            : { tall: "#c2410c", mid: "#64748b", low: "#cbd5e1" };
          buildingsTileset.style = new Cesium.Cesium3DTileStyle({
            color: {
              conditions: [
                ["${Cesium#estimatedHeight} > 60", `color('${palette.tall}', 0.92)`],
                ["${Cesium#estimatedHeight} > 25", `color('${palette.mid}', 0.92)`],
                ["true", `color('${palette.low}', 0.92)`]
              ]
            }
          });
          viewer.scene.primitives.add(buildingsTileset);
        }
      } catch (err) {
        console.warn("Photoreal 3D Tiles unavailable — continuing without:", err);
      }
    })();

    // Reset list refs
    hydrologyEntitiesGroupRef.current = [];
    tacticalZoneEntitiesGroupRef.current = [];

    const riverCoordsArray = SAN_RIVER_COORDS.flatMap(c => [c.lon, c.lat]);

    // River — soft halo (low-alpha, no glow)
    const riverHalo = viewer.entities.add({
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArray(riverCoordsArray),
        width: 6,
        material: Cesium.Color.fromCssColorString("#2563eb").withAlpha(0.12),
        clampToGround: true
      },
      show: mapLayers.hydrology
    });
    hydrologyEntitiesGroupRef.current.push(riverHalo);

    // River — thin solid core
    const riverCore = viewer.entities.add({
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArray(riverCoordsArray),
        width: 1.5,
        material: Cesium.Color.fromCssColorString("#2563eb").withAlpha(0.55),
        clampToGround: true
      },
      show: mapLayers.hydrology
    });
    hydrologyEntitiesGroupRef.current.push(riverCore);

    // Tactical Zone bounding rectangle was removed as requested

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    let lastUpdate = 0;

    handler.setInputAction((movement: any) => {
      const now = Date.now();
      if (now - lastUpdate < 80) return;
      lastUpdate = now;

      const cartesian = viewer.camera.pickEllipsoid(movement.endPosition, viewer.scene.globe.ellipsoid);
      if (cartesian) {
        const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        const lon = Cesium.Math.toDegrees(cartographic.longitude);
        const lat = Cesium.Math.toDegrees(cartographic.latitude);
        const cameraHeight = Math.round(viewer.camera.positionCartographic.height);
        setHoveredCoords({
          lat,
          lon,
          alt: cameraHeight,
          az: Math.round(Cesium.Math.toDegrees(viewer.camera.heading))
        });

        // Cache last cursor position for ghost (re)spawn
        lastCursorLatLonRef.current = { lat, lon };

        // Update relocation ghost position if active
        if (relocationDragStateRef.current && relocationDragStateRef.current.active) {
          const ghostModel = viewer.entities.getById("sys_reloc_ghost_model");
          if (ghostModel) {
            ghostModel.position = Cesium.Cartesian3.fromDegrees(lon, lat, GROUND_ALT + (ghostModel.box ? 25 : 0));
          }
          const ghostDome = viewer.entities.getById("sys_reloc_ghost_dome");
          if (ghostDome) {
            ghostDome.position = Cesium.Cartesian3.fromDegrees(lon, lat, GROUND_ALT);
          }
          const ghostLabel = viewer.entities.getById("sys_reloc_ghost_label");
          if (ghostLabel) {
            ghostLabel.position = Cesium.Cartesian3.fromDegrees(lon, lat, GROUND_ALT + 120);
            ghostLabel.label.text = `Nowa pozycja\n${lat.toFixed(4)}°N · ${lon.toFixed(4)}°E\nKliknij, aby zatwierdzić`;
          }
        }

        // Update deployment-preview ghost position if active
        const previewState = deployPreviewStateRef.current;
        if (previewState && previewState.active) {
          const weapon = WEAPONS.find(w => w.type === previewState.type);
          const previewModel = viewer.entities.getById("sys_deploy_preview_model");
          if (previewModel) {
            const isTower = !!previewModel.cylinder;
            previewModel.position = Cesium.Cartesian3.fromDegrees(lon, lat, GROUND_ALT + (isTower ? 18 : 0));
          }
          const previewDome = viewer.entities.getById("sys_deploy_preview_dome");
          if (previewDome) {
            previewDome.position = Cesium.Cartesian3.fromDegrees(lon, lat, GROUND_ALT);
          }
          const previewCircle = viewer.entities.getById("sys_deploy_preview_circle");
          if (previewCircle) {
            previewCircle.position = Cesium.Cartesian3.fromDegrees(lon, lat);
          }
          const previewLabel = viewer.entities.getById("sys_deploy_preview_label");
          if (previewLabel && weapon) {
            const labelHeight = previewState.type === "PATRIOT" ? 130 : previewState.type === "PILICA" ? 110 : 80;
            previewLabel.position = Cesium.Cartesian3.fromDegrees(lon, lat, GROUND_ALT + labelHeight);
            previewLabel.label.text = `${weapon.name}\nZasięg ${(weapon.range / 1000).toFixed(1)} km\n${lat.toFixed(4)}°N · ${lon.toFixed(4)}°E\nKliknij, aby rozstawić`;
          }
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    handler.setInputAction((click: any) => {
      // 1. Check relocation drag mode
      if (relocationDragStateRef.current && relocationDragStateRef.current.active) {
        const cartesian = viewer.camera.pickEllipsoid(click.position, viewer.scene.globe.ellipsoid);
        if (cartesian) {
          const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
          const lon = Cesium.Math.toDegrees(cartographic.longitude);
          const lat = Cesium.Math.toDegrees(cartographic.latitude);
          
          if (onConfirmRelocationPositionRef.current) {
            onConfirmRelocationPositionRef.current(relocationDragStateRef.current.sysId, lat, lon);
          }
        }
        return;
      }

      // 2. Normal weapon placement / entity picking mode
      const activeWeapon = simStateRef.current.selectedWeapon;
      
      if (!activeWeapon) {
        // Entity picking mode with drillPick to pierce through transparent domes!
        const pickedObjects = viewer.scene.drillPick(click.position);
        if (pickedObjects && pickedObjects.length > 0) {
          // Look for system/node entities in the picked primitives
          let resolvedEntity: any = null;
          for (let i = 0; i < pickedObjects.length; i++) {
            const obj = pickedObjects[i];
            if (Cesium.defined(obj) && obj.id) {
              const entId = obj.id.id || obj.id;
              if (typeof entId === "string" && (entId.toLowerCase().startsWith("sys_") || entId.startsWith("OBJ_"))) {
                resolvedEntity = obj.id;
                // Prefer models/beacons/points over the giant domes if multiple are picked!
                if (entId.endsWith("_model") || entId.endsWith("_tower") || entId.endsWith("_beacon")) {
                  break; // Found our prime 3D candidate!
                }
              }
            }
          }

          if (resolvedEntity) {
            const entityId = resolvedEntity.id;

            // Check tactical cluster indicator click
            if (entityId === "tactical_cluster_stalowa_wola") {
              onAddLog("DOWÓDZTWO: Skupiono widok na zgrupowaniu obiektów Stalowa Wola", "info");
              viewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(centerLon, centerLat - 0.018, GROUND_ALT + 4500),
                orientation: {
                  heading: Cesium.Math.toRadians(15.0),
                  pitch: Cesium.Math.toRadians(-38.0),
                  roll: 0.0
                }
              });
              return;
            }
            
            // Strip suffixes for nodes and systems back to the base id
            // (e.g. "OBJ_02_part1" → "OBJ_02", "SYS_123_model" → "SYS_123").
            let baseId = entityId;
            if (entityId.startsWith("OBJ_") || entityId.toLowerCase().startsWith("sys_")) {
              const parts = entityId.split("_");
              if (parts.length > 2) {
                baseId = `${parts[0]}_${parts[1]}`;
              }
            }

            // Check nodes
            const matchedNode = simStateRef.current.nodes.find((n: CriticalNode) => n.id === baseId);
            if (matchedNode) {
              if (setSelectedNode) setSelectedNode(matchedNode);
              if (setSelectedSystem) setSelectedSystem(null);
              onAddLog(`DOWÓDZTWO: Wybrano węzeł strategiczny: ${matchedNode.name}`, "info");
              flyToNode(matchedNode.lat, matchedNode.lon, matchedNode.name);
              return;
            }

            // Check deployed systems
            const matchedSystem = simStateRef.current.deployedSystems.find((s: DeployedSystem) => s.id === baseId);
            if (matchedSystem) {
              if (setSelectedSystem) setSelectedSystem(matchedSystem);
              if (setSelectedNode) setSelectedNode(null);
              onAddLog(`DOWÓDZTWO: Wybrano aktywne pokrycie tarczy: ${matchedSystem.name}`, "info");
              return;
            }
          } else {
            // Clear selection on empty space click
            if (setSelectedNode) setSelectedNode(null);
            if (setSelectedSystem) setSelectedSystem(null);
          }
        } else {
          // Clear selection on empty space click
          if (setSelectedNode) setSelectedNode(null);
          if (setSelectedSystem) setSelectedSystem(null);
        }
        return;
      }

      const cartesian = viewer.camera.pickEllipsoid(click.position, viewer.scene.globe.ellipsoid);
      if (cartesian) {
        const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        const lon = Cesium.Math.toDegrees(cartographic.longitude);
        const lat = Cesium.Math.toDegrees(cartographic.latitude);



        const weapon = WEAPONS.find(w => w.type === activeWeapon);
        if (!weapon) return;

        const newSys: DeployedSystem = {
          id: `SYS_${Date.now()}`,
          type: activeWeapon,
          name: `${weapon.name} #${Math.floor(Math.random() * 1000)}`,
          lat,
          lon,
          radius: weapon.range,
          color: weapon.colorHex
        };

        const domeEntity = viewer.entities.add({
          id: newSys.id,
          position: Cesium.Cartesian3.fromDegrees(lon, lat, GROUND_ALT),
          ellipsoid: {
            radii: new Cesium.Cartesian3(newSys.radius, newSys.radius, newSys.radius),
            material: new Cesium.GridMaterialProperty({
              color: Cesium.Color.fromCssColorString(newSys.color).withAlpha(0.55),
              cellAlpha: 0.0,
              lineCount: new Cesium.Cartesian2(8, 8),
              thickness: new Cesium.Cartesian2(1.2, 1.2)
            }),
            outline: false,
            minimumCone: 0,
            maximumCone: Cesium.Math.PI_OVER_TWO
          },
          show: mapLayers.domes
        });

        const groundCircle = viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(lon, lat),
          ellipse: {
            semiMajorAxis: newSys.radius,
            semiMinorAxis: newSys.radius,
            material: Cesium.Color.fromCssColorString(newSys.color).withAlpha(0.025),
            outline: true,
            outlineColor: Cesium.Color.fromCssColorString(newSys.color).withAlpha(0.35),
            outlineWidth: 1,
            height: GROUND_ALT + 1
          },
          show: mapLayers.domes
        });

        const deployedGlassColor = Cesium.Color.fromCssColorString(newSys.color).withAlpha(0.18);

        if (activeWeapon === "PATRIOT") {
          // Render actual 3D GLB model for Patriot
          const heading = Cesium.Math.toRadians(0);
          const pitch = 0;
          const roll = 0;
          const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
          const position = Cesium.Cartesian3.fromDegrees(lon, lat, GROUND_ALT);
          const orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);

          viewer.entities.add({
            id: newSys.id + "_model",
            position: position,
            orientation: orientation as any,
            model: {
              uri: "/3d_models/patriot.glb",
              scale: 25,
              minimumPixelSize: 64,
              maximumScale: 50,
              silhouetteColor: Cesium.Color.fromCssColorString(newSys.color),
              silhouetteSize: 1.5,
              colorBlendMode: Cesium.ColorBlendMode.MIX,
              colorBlendAmount: 0.1,
              color: Cesium.Color.WHITE
            }
          });

          // Slim beacon for Patriot
          viewer.entities.add({
            id: newSys.id + "_beacon",
            polyline: {
              positions: Cesium.Cartesian3.fromDegreesArrayHeights([
                lon, lat, GROUND_ALT,
                lon, lat, GROUND_ALT + 120
              ]),
              width: 1,
              material: Cesium.Color.fromCssColorString(newSys.color).withAlpha(0.5)
            }
          });
        } else if (activeWeapon === "PILICA") {
          // Render actual 3D GLB model for Pilica
          const heading = Cesium.Math.toRadians(0);
          const pitch = 0;
          const roll = 0;
          const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
          const position = Cesium.Cartesian3.fromDegrees(lon, lat, GROUND_ALT);
          const orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);

          viewer.entities.add({
            id: newSys.id + "_model",
            position: position,
            orientation: orientation as any,
            model: {
              uri: "/3d_models/pilica.glb",
              scale: 30,
              minimumPixelSize: 64,
              maximumScale: 50,
              silhouetteColor: Cesium.Color.fromCssColorString(newSys.color),
              silhouetteSize: 1.5,
              colorBlendMode: Cesium.ColorBlendMode.MIX,
              colorBlendAmount: 0.1,
              color: Cesium.Color.WHITE
            }
          });

          // Slim beacon for Pilica
          viewer.entities.add({
            id: newSys.id + "_beacon",
            polyline: {
              positions: Cesium.Cartesian3.fromDegreesArrayHeights([
                lon, lat, GROUND_ALT,
                lon, lat, GROUND_ALT + 100
              ]),
              width: 1,
              material: Cesium.Color.fromCssColorString(newSys.color).withAlpha(0.5)
            }
          });
        } else {
          // Slim cylindrical pillar (radar / WRE / etc.)
          viewer.entities.add({
            id: newSys.id + "_tower",
            position: Cesium.Cartesian3.fromDegrees(lon, lat, GROUND_ALT + 18),
            cylinder: {
              length: 36, topRadius: 5, bottomRadius: 7,
              slices: 24,
              material: deployedGlassColor,
              outline: false
            }
          });

          viewer.entities.add({
            id: newSys.id + "_beacon",
            polyline: {
              positions: Cesium.Cartesian3.fromDegreesArrayHeights([
                lon, lat, GROUND_ALT + 36,
                lon, lat, GROUND_ALT + 70
              ]),
              width: 1,
              material: Cesium.Color.fromCssColorString(newSys.color).withAlpha(0.55)
            }
          });
        }

        // Primary label (sentence case, Inter)
        const labelHeight = activeWeapon === "PATRIOT" ? 130 : activeWeapon === "PILICA" ? 110 : 80;
        viewer.entities.add({
          id: newSys.id + "_label",
          position: Cesium.Cartesian3.fromDegrees(lon, lat, GROUND_ALT + labelHeight),
          label: {
            text: newSys.name,
            font: "600 32px 'Inter', system-ui, -apple-system, sans-serif",
            fillColor: Cesium.Color.fromCssColorString("#0b1220"),
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 5,
            showBackground: false,
            scale: 0.34,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -10),
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          }
        });
        
        domeEntitiesRef.current[newSys.id] = [domeEntity, groundCircle];

        // Clean preview ghost before real entities take over (avoids visual stutter)
        cancelDeploymentPreview();

        setDeployedSystems((prev) => [...prev, newSys]);
        setSelectedWeapon(null);
        onAddLog(`ZAINSTALOWANO SYSTEM: ${newSys.name} na pozycji GPS [${lat.toFixed(4)} N, ${lon.toFixed(4)} E]`, "success");
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    let animationFrameId: number;

    const tick = () => {
      animationFrameId = requestAnimationFrame(tick);

      // Combat-effect housekeeping runs every frame regardless of sim speed so that
      // smoke / crater / shockwaves keep animating even when the user pauses the sim.
      const nowMs = performance.now();
      if (effectsRef.current.length > 0) {
        effectsRef.current = effectsRef.current.filter((eff) => {
          if (nowMs - eff.spawnAt > eff.duration) {
            disposeEffect(viewer, eff);
            return false;
          }
          return true;
        });
      }

      const speed = simStateRef.current.simSpeed;
      if (speed === 0) return;

      const activeThreats = [...simStateRef.current.threats].filter(t => t.status === "FLYING");
      const currentNodes = simStateRef.current.nodes;
      const systems = simStateRef.current.deployedSystems;

      if (laserLinesRef.current && typeof laserLinesRef.current.removeAll === "function") {
        laserLinesRef.current.removeAll();
      }

      activeThreats.forEach((threat) => {
        const target = currentNodes.find(n => n.id === threat.targetId);
        if (!target) return;
        const baseSpeed = threat.type === "DRONE" ? 0.0006 : threat.type === "SHAHED" ? 0.001 : 0.002;
        threat.progress += baseSpeed * speed;

        if (threat.pathType === "RIVER") {
          const routeProgress = Math.min(1.0, threat.progress * 1.15);
          const pointsCount = SAN_RIVER_COORDS.length;

          if (routeProgress < 0.8) {
            const rawIdx = routeProgress * 1.25 * (pointsCount - 1);
            const idx = Math.min(pointsCount - 2, Math.floor(rawIdx));
            const subProgress = rawIdx - idx;
            const startNode = SAN_RIVER_COORDS[idx];
            const endNode = SAN_RIVER_COORDS[idx + 1];
            threat.lat = startNode.lat + (endNode.lat - startNode.lat) * subProgress;
            threat.lon = startNode.lon + (endNode.lon - startNode.lon) * subProgress;
          } else {
            const lastRiverNode = SAN_RIVER_COORDS[pointsCount - 3];
            const bankProgress = (routeProgress - 0.8) / 0.2;
            threat.lat = lastRiverNode.lat + (target.lat - lastRiverNode.lat) * bankProgress;
            threat.lon = lastRiverNode.lon + (target.lon - lastRiverNode.lon) * bankProgress;
          }
        } else {
          threat.lat = threat.startLat + (target.lat - threat.startLat) * Math.min(1.0, threat.progress);
          threat.lon = threat.startLon + (target.lon - threat.startLon) * Math.min(1.0, threat.progress);
        }

        let threatEntity = threatEntitiesRef.current[threat.id];
        if (!threatEntity) {
          // Tone palette tied to threat severity (soft tokens)
          const trailHex = threat.type === "MISSILE" ? "#dc2626" : threat.type === "SHAHED" ? "#d97706" : "#ca8a04";
          const textHex = threat.type === "MISSILE" ? "#b91c1c" : threat.type === "SHAHED" ? "#b45309" : "#854d0e";

          // 3D model selection — activates GLB assets in /3d_models/
          // DRONE → FPV. SHAHED → kamikaze drone. MISSILE → shahed-shape tinted red.
          const modelUri = threat.type === "DRONE"
            ? "/3d_models/fpv_drone.glb"
            : "/3d_models/iranian_shahed-136_military_drone.glb";
          const modelScale = threat.type === "DRONE" ? 15 : threat.type === "MISSILE" ? 22 : 28;
          const minPixel = threat.type === "DRONE" ? 28 : 38;
          const isMissile = threat.type === "MISSILE";

          threatEntity = viewer.entities.add({
            id: threat.id,
            position: Cesium.Cartesian3.fromDegrees(threat.lon, threat.lat, GROUND_ALT + threat.alt),
            model: {
              uri: modelUri,
              scale: modelScale,
              minimumPixelSize: minPixel,
              maximumScale: 60,
              color: isMissile
                ? Cesium.Color.fromCssColorString("#ef4444")
                : Cesium.Color.WHITE,
              colorBlendMode: isMissile
                ? Cesium.ColorBlendMode.MIX
                : Cesium.ColorBlendMode.HIGHLIGHT,
              colorBlendAmount: isMissile ? 0.65 : 0.15,
              silhouetteColor: Cesium.Color.fromCssColorString(trailHex),
              silhouetteSize: 1.5
            },
            label: {
              text: threat.name,
              font: "600 26px 'Inter', system-ui, -apple-system, sans-serif",
              fillColor: Cesium.Color.fromCssColorString(textHex),
              outlineColor: Cesium.Color.WHITE,
              outlineWidth: 4,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              scale: 0.36,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              pixelOffset: new Cesium.Cartesian2(0, -22),
              disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
          });
          threatEntitiesRef.current[threat.id] = threatEntity;

          // Contrail polyline — CallbackProperty re-evaluates positions each frame
          threatTrailPositionsRef.current[threat.id] = [];
          const trailEntity = viewer.entities.add({
            id: threat.id + "_trail",
            polyline: {
              positions: new Cesium.CallbackProperty(
                () => threatTrailPositionsRef.current[threat.id] || [],
                false
              ),
              width: isMissile ? 4 : 3,
              material: new Cesium.PolylineGlowMaterialProperty({
                glowPower: 0.28,
                taperPower: 0.5,
                color: Cesium.Color.fromCssColorString(trailHex).withAlpha(0.75)
              })
            },
            show: mapLayers.threats
          });
          threatTrailEntitiesRef.current[threat.id] = trailEntity;
          threatPrevPosRef.current[threat.id] = { lon: threat.lon, lat: threat.lat, alt: threat.alt };
        }

        const newCart = Cesium.Cartesian3.fromDegrees(threat.lon, threat.lat, GROUND_ALT + threat.alt);

        // Rotate model to face direction of travel (heading derived from prev→current delta).
        // GLB convention: model faces +X (east) at heading=0, so we offset by +90°.
        const prev = threatPrevPosRef.current[threat.id];
        if (prev) {
          const dLon = threat.lon - prev.lon;
          const dLat = threat.lat - prev.lat;
          if (Math.abs(dLon) > 1e-7 || Math.abs(dLat) > 1e-7) {
            const heading = Math.atan2(dLon, dLat) + Cesium.Math.PI_OVER_TWO;
            const hpr = new Cesium.HeadingPitchRoll(heading, 0, 0);
            threatEntity.orientation = Cesium.Transforms.headingPitchRollQuaternion(newCart, hpr);
          }
        }

        threatEntity.position = newCart;
        threatEntity.show = mapLayers.threats;

        // Append to contrail (cap ~80 segments → ~1.3s at 60fps, tight to body)
        const trailPositions = threatTrailPositionsRef.current[threat.id];
        if (trailPositions) {
          trailPositions.push(newCart);
          if (trailPositions.length > 80) trailPositions.shift();
        }
        threatPrevPosRef.current[threat.id] = { lon: threat.lon, lat: threat.lat, alt: threat.alt };

        const trailEnt = threatTrailEntitiesRef.current[threat.id];
        if (trailEnt) trailEnt.show = mapLayers.threats;

        let interceptedThisFrame = false;
        const threatPos = Cesium.Cartesian3.fromDegrees(threat.lon, threat.lat, GROUND_ALT + threat.alt);

        systems.forEach((sys) => {
          if (interceptedThisFrame) return;
          if (sys.status === "RELOCATING") return;

          const sysPos = Cesium.Cartesian3.fromDegrees(sys.lon, sys.lat, GROUND_ALT + 145);
          const distance = Cesium.Cartesian3.distance(sysPos, threatPos);

          if (distance <= sys.radius) {
            const pathConfig = THREAT_TYPES[threat.type];
            const activeMatch = sys.type === "PILICA" || sys.type === "PATRIOT" || (sys.type === "WRE" && !pathConfig.immuneToWRE);

            if (activeMatch && laserLinesRef.current && typeof laserLinesRef.current.add === "function") {
              const laserColor = sys.type === "PILICA" ? "#ff4d4d" : sys.type === "PATRIOT" ? "#a855f7" : "#3b82f6";
              // Neon Outer Glow
              laserLinesRef.current.add({
                positions: [sysPos, threatPos],
                width: 6.0,
                color: Cesium.Color.fromCssColorString(laserColor).withAlpha(0.35)
              });
              // Solid Inner Core
              laserLinesRef.current.add({
                positions: [sysPos, threatPos],
                width: 2.0,
                color: Cesium.Color.WHITE
              });

              const dmg = sys.type === "PILICA" ? 0.9 : sys.type === "PATRIOT" ? 1.8 : 2.5;
              threat.health -= dmg * speed;

              if (threat.health <= 0) {
                interceptedThisFrame = true;
                threat.status = sys.type === "WRE" ? "JAMMED" : "INTERCEPTED";

                const interceptLon = threat.lon;
                const interceptLat = threat.lat;
                const interceptAlt = threat.alt;

                viewer.entities.remove(threatEntity);
                delete threatEntitiesRef.current[threat.id];
                const trailEntIntercept = threatTrailEntitiesRef.current[threat.id];
                if (trailEntIntercept) viewer.entities.remove(trailEntIntercept);
                delete threatTrailEntitiesRef.current[threat.id];
                delete threatTrailPositionsRef.current[threat.id];
                delete threatPrevPosRef.current[threat.id];

                // WRE jam → drone tumbles down with trail. Kinetic kills → bright burst + debris.
                if (effectsEnabledRef.current) {
                  if (sys.type === "WRE" && threat.type === "DRONE") {
                    const fx = spawnFallingDrone(viewer, Cesium, interceptLon, interceptLat, interceptAlt);
                    effectsRef.current.push(...fx);
                  } else {
                    const fx = spawnInterceptBurst(viewer, Cesium, interceptLon, interceptLat, interceptAlt, sys.type as any);
                    effectsRef.current.push(...fx);
                  }
                  onCombatEventRef.current?.({
                    kind: "intercept",
                    systemType: sys.type as any,
                    threatType: threat.type,
                    lon: interceptLon,
                    lat: interceptLat
                  });
                }

                setThreats(prev => prev.map(t => t.id === threat.id ? { ...t, status: threat.status } : t));

                if (sys.type === "PILICA") {
                  onAddLog(`KINETYCZNE ZESTRZELEŃIE: PSR-A PILICA zneutralizował rakietami cel ${threat.name}!`, "combat");
                } else if (sys.type === "PATRIOT") {
                  onAddLog(`RAKIETOWE PRZECHWYCENIE: MIM-104 PATRIOT PAC-3 zniszczył cel ${threat.name} na dystansie ${Math.round(distance)}m!`, "combat");
                } else {
                  onAddLog(`ZAKŁÓCENIE WRE: Jammer zakłócił GPS cywilnego drona ${threat.name}. Spadek na ziemię!`, "combat");
                }
              }
            }
          }
        });

        if (!interceptedThisFrame && threat.progress >= 1.0) {
          threat.status = "IMPACTED";

          const impactLon = target.lon;
          const impactLat = target.lat;
          const impactThreatType = threat.type;

          viewer.entities.remove(threatEntity);
          delete threatEntitiesRef.current[threat.id];
          const trailEntImpact = threatTrailEntitiesRef.current[threat.id];
          if (trailEntImpact) viewer.entities.remove(trailEntImpact);
          delete threatTrailEntitiesRef.current[threat.id];
          delete threatTrailPositionsRef.current[threat.id];
          delete threatPrevPosRef.current[threat.id];

          // On-map impact pyrotechnics (no camera shake, no screen flash)
          if (effectsEnabledRef.current) {
            const fx = spawnImpactExplosion(viewer, Cesium, impactLon, impactLat, impactThreatType);
            effectsRef.current.push(...fx);

            onCombatEventRef.current?.({
              kind: "impact",
              threatType: impactThreatType,
              nodeId: threat.targetId,
              lon: impactLon,
              lat: impactLat
            });
          }

          setNodes(prev => prev.map((n) => {
            if (n.id === threat.targetId) {
              return {
                ...n,
                health: 0,
                status: "DESTROYED",
                notes: `KATASTROFA: Budynek trafiony przez ${threat.type === "MISSILE" ? "rakietę" : "Shahed"}.`
              };
            }
            return n;
          }));

          setThreats(prev => prev.map(t => t.id === threat.id ? { ...t, status: "IMPACTED" } : t));
          onAddLog(`IMPAKT NIEPRZYJACIELA: Obiekt ${target.name} uległ zniszczeniu przez ${threat.type}! Spadek sprawności do 0%!`, "error");
        }
      });
    };

    tick();

    return () => {
      cancelAnimationFrame(animationFrameId);
      handler.destroy();
      viewer.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Synchronize Nodes on the Map (Dynamic and reactive to new nodes or status changes)
  useEffect(() => {
    const viewer = viewerRef.current;
    const Cesium = (window as any).Cesium;
    if (!viewer || !Cesium || !isCesiumLoaded) return;

    // Clear old node entities
    nodeEntitiesGroupRef.current.forEach((entity) => {
      viewer.entities.remove(entity);
    });
    nodeEntitiesGroupRef.current = [];
    nodeEntitiesRef.current = {};

    // Per-type 3D volume — large, prominent solids that read clearly against
    // satellite imagery at 4.5 km camera altitude. Each entry: list of
    // {kind: "box"|"cylinder", w/d/h/r/length, zCenter} parts.
    // zCenter is the altitude of the part's CENTER (Cesium box/cylinder are centered on position).
    // topZ tells the label where to float (top of tallest part).
    // discRadius defines the bold ground footprint visible from straight down.
    const NODE_SHAPES: Record<string, { parts: any[]; topZ: number; antenna?: number; discRadius: number }> = {
      industrial: { discRadius: 130, parts: [{ kind: "box", w: 220, d: 150, h: 60, zCenter: 30 }], topZ: 60 },
      power:      { discRadius: 90, parts: [
                      { kind: "box", w: 90, d: 60, h: 36, zCenter: 18 },
                      { kind: "cylinder", r: 12, length: 180, zCenter: 90 }
                    ], topZ: 180 },
      water:      { discRadius: 75, parts: [{ kind: "cylinder", r: 55, length: 55, zCenter: 27.5 }], topZ: 55 },
      electrical: { discRadius: 75, parts: [{ kind: "box", w: 90, d: 90, h: 50, zCenter: 25 }], topZ: 50, antenna: 50 },
      logistic:   { discRadius: 160, parts: [{ kind: "box", w: 280, d: 55, h: 20, zCenter: 10 }], topZ: 20 },
      transit:    { discRadius: 110, parts: [{ kind: "box", w: 200, d: 25, h: 12, zCenter: 6 }], topZ: 12 },
      hq:         { discRadius: 65, parts: [{ kind: "box", w: 75, d: 75, h: 60, zCenter: 30 }], topZ: 60, antenna: 60 }
    };

    nodes.forEach((node) => {
      const color = NODE_COLORS[node.type] || "#16a34a";
      const shape = NODE_SHAPES[node.type] || NODE_SHAPES.industrial;

      // 1. Bold ground disc — primary horizontal marker, visible from straight down.
      // Sits a few meters above local ground (155 m + 1) to avoid z-fighting with photoreal tiles.
      const groundDisc = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(node.lon, node.lat),
        ellipse: {
          semiMajorAxis: shape.discRadius,
          semiMinorAxis: shape.discRadius,
          material: Cesium.Color.fromCssColorString(color).withAlpha(0.35),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString(color).withAlpha(0.95),
          outlineWidth: 3,
          height: GROUND_ALT + 1
        },
        show: mapLayers.nodes
      });
      nodeEntitiesGroupRef.current.push(groundDisc);

      // Reset body group for this node — used to hide 3D bodies in 2D mode.
      nodeBodyEntitiesRef.current[node.id] = [];

      // 2. Per-type 3D body — kept subtle so the billboard pin reads as the primary marker.
      // Primary part gets id=node.id; secondary parts get id=`${node.id}_partN` so the
      // entity picker (which strips the trailing suffix for OBJ_*) still resolves to the node.
      const softFill = Cesium.Color.fromCssColorString(color).withAlpha(0.45);
      const softOutline = Cesium.Color.fromCssColorString(color).withAlpha(0.85);
      shape.parts.forEach((part, idx) => {
        const isPrimary = idx === 0;
        const partId = isPrimary ? node.id : `${node.id}_part${idx}`;
        const partPosition = Cesium.Cartesian3.fromDegrees(node.lon, node.lat, GROUND_ALT + part.zCenter);
        const partProps: any = {
          id: partId,
          position: partPosition,
          show: mapLayers.nodes
        };
        if (part.kind === "box") {
          partProps.box = {
            dimensions: new Cesium.Cartesian3(part.w, part.d, part.h),
            material: softFill,
            outline: true,
            outlineColor: softOutline
          };
        } else {
          partProps.cylinder = {
            length: part.length,
            topRadius: part.r,
            bottomRadius: part.r,
            slices: 24,
            material: softFill,
            outline: true,
            outlineColor: softOutline
          };
        }
        const partEntity = viewer.entities.add(partProps);
        if (isPrimary) {
          nodeEntitiesRef.current[node.id] = partEntity;
        }
        nodeEntitiesGroupRef.current.push(partEntity);
        nodeBodyEntitiesRef.current[node.id].push(partEntity);
      });

      // 3. Optional antenna (HQ + GPZ): thin polyline above the building.
      if (shape.antenna) {
        const antennaEntity = viewer.entities.add({
          id: `${node.id}_antenna`,
          polyline: {
            positions: Cesium.Cartesian3.fromDegreesArrayHeights([
              node.lon, node.lat, GROUND_ALT + shape.topZ,
              node.lon, node.lat, GROUND_ALT + shape.topZ + shape.antenna
            ]),
            width: 1.5,
            material: Cesium.Color.fromCssColorString(color).withAlpha(0.8)
          },
          show: mapLayers.nodes
        });
        nodeEntitiesGroupRef.current.push(antennaEntity);
        nodeBodyEntitiesRef.current[node.id].push(antennaEntity);
      }

      // 4. Primary marker — circular pin badge billboard. Always pixel-sized so it
      // stays readable at every zoom AND in 2D mode (where 3D bryły lose meaning).
      const badgeCode = node.id.replace(/^OBJ_/, "");
      const pinEntity = viewer.entities.add({
        id: `${node.id}_pin`,
        position: Cesium.Cartesian3.fromDegrees(node.lon, node.lat, GROUND_ALT + shape.topZ + (shape.antenna || 0) + 18),
        billboard: {
          image: makeBadgeImage(color, badgeCode),
          width: 34,
          height: 34,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, 0),
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        },
        show: mapLayers.nodes
      });
      nodeEntitiesGroupRef.current.push(pinEntity);

      // 5. Floating name label above the badge.
      const labelAlt = GROUND_ALT + shape.topZ + (shape.antenna || 0) + 18;
      const labelEntity = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(node.lon, node.lat, labelAlt),
        label: {
          text: node.name,
          font: "600 36px 'Inter', system-ui, -apple-system, sans-serif",
          fillColor: Cesium.Color.fromCssColorString("#0b1220"),
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 6,
          showBackground: false,
          scale: 0.34,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -42),
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        },
        show: mapLayers.nodes
      });
      nodeEntitiesGroupRef.current.push(labelEntity);

      // 5. Muted callsign · GPS — only at close zoom (≤ 2500 m) to reduce clutter.
      const coordLabel = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(node.lon, node.lat, labelAlt),
        label: {
          text: `${node.id} · ${node.lat.toFixed(4)}°N · ${node.lon.toFixed(4)}°E`,
          font: "500 22px 'JetBrains Mono', ui-monospace, 'SF Mono', sans-serif",
          fillColor: Cesium.Color.fromCssColorString("#8a94a6"),
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 4,
          showBackground: false,
          scale: 0.34,
          verticalOrigin: Cesium.VerticalOrigin.TOP,
          pixelOffset: new Cesium.Cartesian2(0, 8),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 2500)
        },
        show: mapLayers.nodes
      });
      nodeEntitiesGroupRef.current.push(coordLabel);
    });
  }, [nodes, mapLayers.nodes, isCesiumLoaded]);

  // Synchronize Relations on the Map (Dynamic and reactive to new relations)
  useEffect(() => {
    const viewer = viewerRef.current;
    const Cesium = (window as any).Cesium;
    if (!viewer || !Cesium || !isCesiumLoaded) return;

    // Clear old relation entities
    relationEntitiesGroupRef.current.forEach((entity) => {
      viewer.entities.remove(entity);
    });
    relationEntitiesGroupRef.current = [];

    // Pre-calculate pairs to space their labels along the line.
    const pairCounts: { [key: string]: number } = {};
    const pairIndices: { [key: string]: number } = {};

    relations.forEach((rel) => {
      const key = [rel.source, rel.target].sort().join("-");
      pairCounts[key] = (pairCounts[key] || 0) + 1;
    });

    // Sentence-case helper (raw data labels are uppercase technical terms)
    const sentenceCase = (s: string) =>
      s.length === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1).toLocaleLowerCase("pl-PL");

    // Render relations — bright clamped-to-ground glow lines that read in both 3D and 2D.
    relations.forEach((rel) => {
      const sourceNode = nodes.find(n => n.id === rel.source);
      const targetNode = nodes.find(n => n.id === rel.target);
      if (!sourceNode || !targetNode) return;

      // Tone selection by source status — bright accents so the line reads on satellite/photoreal.
      const isDestroyed = sourceNode.status === "DESTROYED";
      const isDegraded = sourceNode.status === "DEGRADED";
      const lineHex = isDestroyed ? "#ef4444" : isDegraded ? "#f59e0b" : "#06b6d4";
      const textHex = isDestroyed ? "#b91c1c" : isDegraded ? "#b45309" : "#0e7490";

      // 1. Wide soft halo (clamped to ground — follows terrain in 3D, flat in 2D).
      const lineHalo = viewer.entities.add({
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArray([
            sourceNode.lon, sourceNode.lat,
            targetNode.lon, targetNode.lat
          ]),
          clampToGround: true,
          width: 8,
          material: Cesium.Color.fromCssColorString(lineHex).withAlpha(0.25)
        },
        show: mapLayers.relations
      });
      relationEntitiesGroupRef.current.push(lineHalo);

      // 2. Solid bright core line on top of the halo.
      const lineCore = viewer.entities.add({
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArray([
            sourceNode.lon, sourceNode.lat,
            targetNode.lon, targetNode.lat
          ]),
          clampToGround: true,
          width: 2.5,
          material: Cesium.Color.fromCssColorString(lineHex).withAlpha(0.95)
        },
        show: mapLayers.relations
      });
      relationEntitiesGroupRef.current.push(lineCore);

      // 3. Mid-line pill label (positioned on the ground at the midpoint of the segment,
      //    offset slightly when multiple relations share the same pair).
      const key = [rel.source, rel.target].sort().join("-");
      const totalForPair = pairCounts[key] || 1;
      const currentIndex = pairIndices[key] || 0;
      pairIndices[key] = currentIndex + 1;

      let tVal = 0.5;
      if (totalForPair > 1) {
        const step = 0.4 / (totalForPair - 1);
        tVal = 0.3 + currentIndex * step;
      }

      const midLon = sourceNode.lon + (targetNode.lon - sourceNode.lon) * tVal;
      const midLat = sourceNode.lat + (targetNode.lat - sourceNode.lat) * tVal;
      const midAlt = GROUND_ALT + 6;

      // Pill label — only at close zoom (≤ 3500 m) to keep the wider view uncluttered.
      const peakLabelEntity = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(midLon, midLat, midAlt),
        label: {
          text: ` ${sentenceCase(rel.label)} `,
          font: "500 10px 'Inter', system-ui, -apple-system, sans-serif",
          fillColor: Cesium.Color.fromCssColorString(textHex),
          style: Cesium.LabelStyle.FILL,
          showBackground: true,
          backgroundColor: Cesium.Color.WHITE.withAlpha(0.92),
          backgroundPadding: new Cesium.Cartesian2(6, 4),
          scale: 1.0,
          verticalOrigin: Cesium.VerticalOrigin.CENTER,
          pixelOffset: new Cesium.Cartesian2(0, 0),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 3500)
        },
        show: mapLayers.relations
      });

      relationEntitiesGroupRef.current.push(peakLabelEntity);
    });
  }, [relations, nodes, mapLayers.relations, isCesiumLoaded]);

  // Toggle visibility of Hydrology (River San)
  useEffect(() => {
    hydrologyEntitiesGroupRef.current.forEach(entity => {
      if (entity) entity.show = mapLayers.hydrology && !isZoomedOut;
    });
  }, [mapLayers.hydrology, isZoomedOut, isCesiumLoaded]);

  // Toggle visibility of Tactical Zones
  useEffect(() => {
    tacticalZoneEntitiesGroupRef.current.forEach(entity => {
      if (entity) entity.show = mapLayers.tacticalZones;
    });
  }, [mapLayers.tacticalZones, isCesiumLoaded]);

  // Toggle visibility of Defense Domes
  useEffect(() => {
    Object.keys(domeEntitiesRef.current).forEach(id => {
      const entities = domeEntitiesRef.current[id];
      if (Array.isArray(entities)) {
        entities.forEach(ent => {
          if (ent) ent.show = mapLayers.domes;
        });
      } else if (entities) {
        (entities as any).show = mapLayers.domes;
      }
    });
  }, [mapLayers.domes, isCesiumLoaded]);

  // Toggle base map imagery
  useEffect(() => {
    const viewer = viewerRef.current;
    if (viewer && isCesiumLoaded) {
      viewer.imageryLayers.show = mapLayers.baseMap;
    }
  }, [mapLayers.baseMap, isCesiumLoaded]);

  // Toggle 3D ↔ 2D scene mode. In 2D we hide the photoreal mesh + 3D building
  // bodies (which lose meaning in orthographic top-down) and re-show the flat
  // globe so the satellite basemap reads. Critically: we snapshot the camera
  // position BEFORE the morph and restore it AFTER morphComplete, because
  // Cesium's morphTo2D/3D otherwise resets the view to the whole Earth from
  // space — disorienting if you were zoomed into Stalowa Wola.
  useEffect(() => {
    const viewer = viewerRef.current;
    const Cesium = (window as any).Cesium;
    if (!viewer || !Cesium || !isCesiumLoaded) return;

    const wantsScene2D = sceneMode === "2d";
    const targetMode = wantsScene2D ? Cesium.SceneMode.SCENE2D : Cesium.SceneMode.SCENE3D;
    const currentMode = viewer.scene.mode;

    const syncEntityVisibility = () => {
      if (photorealTilesetRef.current) {
        photorealTilesetRef.current.show = !wantsScene2D;
      }
      // Globe shows basemap. In 3D the photoreal mesh covers it (and would
      // z-fight if both visible), so hide. In 2D the photoreal can't render,
      // so the globe MUST show.
      viewer.scene.globe.show = wantsScene2D || !photorealTilesetRef.current;
      // 3D building bodies/antennas only make sense in 3D.
      Object.values(nodeBodyEntitiesRef.current).forEach((parts) => {
        parts.forEach((ent: any) => {
          if (ent) ent.show = !wantsScene2D && mapLayers.nodes;
        });
      });
    };

    if (currentMode === targetMode) {
      // Same scene mode already — just refresh entity visibility (covers the
      // mount case + map-layer toggle while in either mode).
      syncEntityVisibility();
      return;
    }

    // Snapshot the GROUND POINT the user is currently looking at by ray-casting
    // from the screen center onto the ellipsoid. Mode-agnostic — works the same
    // in 2D (camera straight down) and 3D (oblique). Reading camera.position
    // directly is unreliable here: in 2D mode the orthographic camera reports a
    // near-Earth-radius height, and prev heading/pitch from 2D would yaw a 3D
    // view to top-down (not the tactical orbit we want).
    let lookLon = centerLon;
    let lookLat = centerLat;
    const canvas = viewer.scene.canvas;
    if (canvas && canvas.clientWidth > 0 && canvas.clientHeight > 0) {
      const screenCenter = new Cesium.Cartesian2(canvas.clientWidth / 2, canvas.clientHeight / 2);
      const hit = viewer.camera.pickEllipsoid(screenCenter, viewer.scene.globe.ellipsoid);
      if (hit) {
        const c = Cesium.Cartographic.fromCartesian(hit);
        lookLon = Cesium.Math.toDegrees(c.longitude);
        lookLat = Cesium.Math.toDegrees(c.latitude);
      }
    }

    // Best-effort zoom preservation. Only trust the current camera height when
    // we're leaving 3D (in 2D the value is orthographic frustum scale, useless).
    let height = GROUND_ALT + 4500;
    if (currentMode === Cesium.SceneMode.SCENE3D) {
      const raw = viewer.camera.positionCartographic.height;
      if (isFinite(raw) && raw > GROUND_ALT + 400 && raw < GROUND_ALT + 30000) {
        height = raw;
      }
    }

    const onMorphComplete = () => {
      viewer.scene.morphComplete.removeEventListener(onMorphComplete);
      syncEntityVisibility();
      if (wantsScene2D) {
        // 2D: orthographic top-down over the look-at point.
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(lookLon, lookLat, height),
          orientation: { heading: 0, pitch: -Cesium.Math.PI_OVER_TWO, roll: 0 }
        });
      } else {
        // 3D: fixed tactical orbit (heading 15°, pitch −38°). Offset south so
        // the look-at point lands in the upper-mid of the frame, not under the camera.
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(lookLon, lookLat - 0.012, height),
          orientation: {
            heading: Cesium.Math.toRadians(15),
            pitch: Cesium.Math.toRadians(-38),
            roll: 0
          }
        });
      }
    };
    viewer.scene.morphComplete.addEventListener(onMorphComplete);

    if (wantsScene2D) {
      viewer.scene.morphTo2D(0.6);
    } else {
      viewer.scene.morphTo3D(0.6);
    }
  }, [sceneMode, isCesiumLoaded, mapLayers.nodes, centerLat, centerLon]);

  // Dynamic Imagery & Theme Swapper for the 3D GIS terrain
  useEffect(() => {
    const viewer = viewerRef.current;
    const Cesium = (window as any).Cesium;
    if (!viewer || !Cesium || !isCesiumLoaded) return;

    // 1. Remove all old layers
    viewer.imageryLayers.removeAll();

    // 2. Select appropriate tile server based on baseMapType
    let url = "";
    let credit = "";
    let maxLvl = 19;

    if (baseMapType === "satellite") {
      url = "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
      credit = "Esri World Imagery";
      maxLvl = 19;
    } else if (baseMapType === "topo") {
      url = "https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}";
      credit = "Esri World Topo Map";
      maxLvl = 19;
    } else {
      url = theme === "dark"
        ? "https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png"
        : "https://basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}@2x.png";
      credit = "CartoDB";
      maxLvl = 19;
    }

    viewer.imageryLayers.addImageryProvider(
      new Cesium.UrlTemplateImageryProvider({
        url,
        credit,
        maximumLevel: maxLvl
      })
    );

    // 3. Update the globe background base color
    viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString(
      theme === "dark" ? "#020617" : "#f8fafc"
    );
  }, [theme, baseMapType, isCesiumLoaded]);

  // 1. Camera Changed Listener to toggle isZoomedOut state
  useEffect(() => {
    const viewer = viewerRef.current;
    const Cesium = (window as any).Cesium;
    if (!viewer || !Cesium || !isCesiumLoaded) return;

    const onCameraChanged = () => {
      const height = viewer.camera.positionCartographic.height;
      const zoomedOut = height > 28000; // 28 km threshold is perfect!
      setIsZoomedOut(zoomedOut);
    };

    viewer.camera.changed.addEventListener(onCameraChanged);
    return () => {
      if (viewer && viewer.camera && viewer.camera.changed) {
        viewer.camera.changed.removeEventListener(onCameraChanged);
      }
    };
  }, [isCesiumLoaded]);

  // 2. Reactively handle visibility of nodes, relations, weapons, and render the cluster indicator
  useEffect(() => {
    const viewer = viewerRef.current;
    const Cesium = (window as any).Cesium;
    if (!viewer || !Cesium || !isCesiumLoaded) return;

    // A. Toggle visibility of all Nodes (using nodeEntitiesGroupRef)
    nodeEntitiesGroupRef.current.forEach((entity) => {
      if (entity) {
        entity.show = mapLayers.nodes && !isZoomedOut;
      }
    });

    // B. Toggle visibility of all Relations (using relationEntitiesGroupRef)
    relationEntitiesGroupRef.current.forEach((entity) => {
      if (entity) {
        entity.show = mapLayers.relations && !isZoomedOut;
      }
    });

    // C. Toggle visibility of all Deployed Systems
    const currentSystems = simStateRef.current.deployedSystems || [];
    currentSystems.forEach((sys) => {
      const ids = [sys.id, `${sys.id}_tower`, `${sys.id}_model`, `${sys.id}_beacon`, `${sys.id}_label`];
      ids.forEach(id => {
        const ent = viewer.entities.getById(id);
        if (ent) {
          ent.show = !isZoomedOut;
        }
      });
      if (domeEntitiesRef.current[sys.id]) {
        const ents = domeEntitiesRef.current[sys.id] as any;
        if (Array.isArray(ents)) {
          ents.forEach(ent => {
            if (ent) ent.show = mapLayers.domes;
          });
        } else if (ents) {
          ents.show = mapLayers.domes;
        }
      }
    });

    // D. Manage the Cluster Indicator Entity
    if (isZoomedOut) {
      const totalObjects = nodes.length + currentSystems.length;
      
      // If we don't have the cluster entity yet, create it!
      if (!clusterEntityRef.current) {
        const cluster = viewer.entities.add({
          id: "tactical_cluster_stalowa_wola",
          position: Cesium.Cartesian3.fromDegrees(centerLon, centerLat, GROUND_ALT + 500),
          point: {
            pixelSize: 14,
            color: Cesium.Color.fromCssColorString("#0891b2"),
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2,
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          },
          label: {
            text: ` Stalowa Wola · ${totalObjects} obiektów `,
            font: "500 12px 'Inter', system-ui, -apple-system, sans-serif",
            fillColor: Cesium.Color.fromCssColorString("#0b1220"),
            style: Cesium.LabelStyle.FILL,
            showBackground: true,
            backgroundColor: Cesium.Color.WHITE.withAlpha(0.94),
            backgroundPadding: new Cesium.Cartesian2(10, 6),
            scale: 1.0,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -18),
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          }
        });
        clusterEntityRef.current = cluster;
      } else {
        // Update count dynamically
        clusterEntityRef.current.label.text = ` Stalowa Wola · ${totalObjects} obiektów `;
        clusterEntityRef.current.show = true;
      }
    } else {
      // Hide cluster entity if not zoomed out
      if (clusterEntityRef.current) {
        clusterEntityRef.current.show = false;
        viewer.entities.remove(clusterEntityRef.current);
        clusterEntityRef.current = null;
      }
    }
  }, [isZoomedOut, nodes, mapLayers.nodes, mapLayers.relations, mapLayers.domes, isCesiumLoaded]);

  return {
    viewerRef,
    nodeEntitiesRef,
    domeEntitiesRef,
    threatEntitiesRef,
    isCesiumLoaded,
    flyToNode,
    resetViewer,
    removeDeployedSystem,
    drawDeployedSystem,
    startRelocationDrag,
    cancelRelocationDrag,
    startDeploymentPreview,
    cancelDeploymentPreview
  };
}
