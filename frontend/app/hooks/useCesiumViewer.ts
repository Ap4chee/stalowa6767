import { useEffect, useRef, useState, useCallback, MutableRefObject } from "react";
import { CriticalNode, DeployedSystem, HoveredCoords, LogType, SimState, Threat, NodeRelation } from "../types";
import { WEAPONS } from "../data/weapons";
import { THREAT_TYPES } from "../data/threats";
import { INITIAL_NODES, NODE_COLORS } from "../data/nodes";
import { SAN_RIVER_COORDS } from "../data/river";

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
  onConfirmRelocationPosition?: (sysId: string, lat: number, lon: number) => void;
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
  onConfirmRelocationPosition
}: UseCesiumViewerOptions) {
  const viewerRef = useRef<any>(null);
  const nodeEntitiesRef = useRef<{ [id: string]: any }>({});
  const domeEntitiesRef = useRef<{ [id: string]: any[] }>({});
  const threatEntitiesRef = useRef<{ [id: string]: any }>({});
  const laserLinesRef = useRef<any>(null);
  const relocationDragStateRef = useRef<{ active: boolean; sysId: string } | null>(null);
  const [isCesiumLoaded, setIsCesiumLoaded] = useState(false);
  const [isZoomedOut, setIsZoomedOut] = useState(false);
  const onConfirmRelocationPositionRef = useRef(onConfirmRelocationPosition);

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
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(lon, lat - 0.012, 1000),
        orientation: {
          heading: Cesium.Math.toRadians(0.0),
          pitch: Cesium.Math.toRadians(-35.0),
          roll: 0.0
        }
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

    if (laserLinesRef.current && typeof laserLinesRef.current.removeAll === "function") {
      laserLinesRef.current.removeAll();
    }

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
      position: Cesium.Cartesian3.fromDegrees(sys.lon, sys.lat, 120),
      label: {
        text: "WYZNACZ NOWĄ POZYCJĘ BATERII\n[RUCH KURSOREM]",
        font: "bold 24px 'JetBrains Mono', sans-serif",
        fillColor: Cesium.Color.fromCssColorString("#cbd5e1"),
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 4,
        scale: 0.35,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    });

    // Create the ghost dome (dotted gray grid)
    viewer.entities.add({
      id: "sys_reloc_ghost_dome",
      position: Cesium.Cartesian3.fromDegrees(sys.lon, sys.lat, 0),
      ellipsoid: {
        radii: new Cesium.Cartesian3(sys.radius, sys.radius, sys.radius),
        material: new Cesium.GridMaterialProperty({
          color: Cesium.Color.fromCssColorString("#94a3b8").withAlpha(0.6),
          cellAlpha: 0.02,
          lineCount: new Cesium.Cartesian2(8, 8),
          thickness: new Cesium.Cartesian2(1.5, 1.5)
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
        position: Cesium.Cartesian3.fromDegrees(sys.lon, sys.lat, 0),
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
        position: Cesium.Cartesian3.fromDegrees(sys.lon, sys.lat, 0),
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
        position: Cesium.Cartesian3.fromDegrees(sys.lon, sys.lat, 25),
        box: {
          dimensions: new Cesium.Cartesian3(30, 30, 50),
          material: Cesium.Color.fromCssColorString("#94a3b8").withAlpha(0.4)
        }
      });
    }
  }, [cancelRelocationDrag]);

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
      position: Cesium.Cartesian3.fromDegrees(lon, lat, 0),
      ellipsoid: {
        radii: new Cesium.Cartesian3(sys.radius, sys.radius, sys.radius),
        material: new Cesium.GridMaterialProperty({
          color: Cesium.Color.fromCssColorString(sys.color).withAlpha(0.9 * opacity),
          cellAlpha: 0.05 * opacity,
          lineCount: new Cesium.Cartesian2(12, 12),
          thickness: new Cesium.Cartesian2(2.5, 2.5)
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
        material: Cesium.Color.fromCssColorString(sys.color).withAlpha(0.04 * opacity),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString(sys.color).withAlpha(0.5 * opacity),
        outlineWidth: 2,
        height: 0
      },
      show: mapLayers.domes
    });

    const deployedGlassColor = Cesium.Color.fromCssColorString(sys.color).withAlpha(0.25 * opacity);

    if (sys.type === "PATRIOT") {
      const heading = Cesium.Math.toRadians(0);
      const pitch = 0;
      const roll = 0;
      const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
      const position = Cesium.Cartesian3.fromDegrees(lon, lat, 0);
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
            lon, lat, 0,
            lon, lat, 120
          ]),
          width: 2,
          material: Cesium.Color.fromCssColorString(sys.color).withAlpha(0.8 * opacity)
        }
      });
    } else if (sys.type === "PILICA") {
      const heading = Cesium.Math.toRadians(0);
      const pitch = 0;
      const roll = 0;
      const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
      const position = Cesium.Cartesian3.fromDegrees(lon, lat, 0);
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
            lon, lat, 0,
            lon, lat, 100
          ]),
          width: 2,
          material: Cesium.Color.fromCssColorString(sys.color).withAlpha(0.8 * opacity)
        }
      });
    } else {
      viewer.entities.add({
        id: sys.id + "_tower",
        position: Cesium.Cartesian3.fromDegrees(lon, lat, 20),
        cylinder: {
          length: 40, topRadius: 10, bottomRadius: 12,
          slices: 5,
          material: deployedGlassColor,
          outline: false
        }
      });

      viewer.entities.add({
        id: sys.id + "_beacon",
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArrayHeights([
            lon, lat, 0,
            lon, lat, 70
          ]),
          width: 1.5,
          material: Cesium.Color.fromCssColorString(sys.color).withAlpha(0.8 * opacity)
        }
      });
    }

    const labelHeight = sys.type === "PATRIOT" ? 130 : sys.type === "PILICA" ? 110 : 70;
    viewer.entities.add({
      id: sys.id + "_label",
      position: Cesium.Cartesian3.fromDegrees(lon, lat, labelHeight),
      label: {
        text: (sys.name + (isRelocating ? ` (MARSZ: ${sys.relocationSecondsLeft}s)` : "")).toUpperCase(),
        font: "bold 38px 'JetBrains Mono', 'Segoe UI', Arial, sans-serif",
        fillColor: Cesium.Color.fromCssColorString(isRelocating ? "#f59e0b" : "#0f172a"),
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 5,
        showBackground: false,
        scale: 0.32,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -12),
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    });

    domeEntitiesRef.current[sys.id] = [domeEntity, groundCircle];
  }, [mapLayers.domes]);

  useEffect(() => {
    const Cesium = (window as any).Cesium;
    if (!Cesium || !containerRef.current) return;

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

    viewer.resolutionScale = Math.min(1.0, window.devicePixelRatio || 1.0);
    viewer.useBrowserRecommendedResolution = false;

    viewerRef.current = viewer;
    setIsCesiumLoaded(true);

    const laserCollection = viewer.scene.primitives.add(new Cesium.PolylineCollection());
    laserLinesRef.current = laserCollection;

    viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString(theme === "dark" ? "#020617" : "#f8fafc");
    viewer.scene.skyAtmosphere.show = false;
    viewer.scene.fog.enabled = false;
    viewer.scene.globe.showGroundAtmosphere = false;
    viewer.scene.globe.enableLighting = false;
    viewer.scene.globe.depthTestAgainstTerrain = false;

    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(centerLon, centerLat - 0.018, 4500),
      orientation: {
        heading: Cesium.Math.toRadians(15.0),
        pitch: Cesium.Math.toRadians(-38.0),
        roll: 0.0
      }
    });

    // Reset list refs
    hydrologyEntitiesGroupRef.current = [];
    tacticalZoneEntitiesGroupRef.current = [];

    const riverCoordsArray = SAN_RIVER_COORDS.flatMap(c => [c.lon, c.lat]);
    
    // River Glow line
    const riverGlow = viewer.entities.add({
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArray(riverCoordsArray),
        width: 8,
        material: new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.35,
          color: Cesium.Color.fromCssColorString("#0891b2").withAlpha(0.6)
        }),
        clampToGround: true
      },
      show: mapLayers.hydrology
    });
    hydrologyEntitiesGroupRef.current.push(riverGlow);

    // River Core line
    const riverCore = viewer.entities.add({
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArray(riverCoordsArray),
        width: 2.5,
        material: Cesium.Color.CYAN,
        clampToGround: true
      },
      show: mapLayers.hydrology
    });
    hydrologyEntitiesGroupRef.current.push(riverCore);

    // River Label text
    const riverLabel = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(22.0620, 50.5700, 50),
      label: {
        text: "RZEKA SAN",
        font: "bold 32px 'JetBrains Mono', 'Segoe UI', Arial, sans-serif",
        fillColor: Cesium.Color.fromCssColorString("#0284c7"),
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 5,
        scale: 0.35,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      },
      show: mapLayers.hydrology
    });
    hydrologyEntitiesGroupRef.current.push(riverLabel);

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

        // Update ghost position if active
        if (relocationDragStateRef.current && relocationDragStateRef.current.active) {
          const ghostModel = viewer.entities.getById("sys_reloc_ghost_model");
          if (ghostModel) {
            ghostModel.position = Cesium.Cartesian3.fromDegrees(lon, lat, ghostModel.box ? 25 : 0);
          }
          const ghostDome = viewer.entities.getById("sys_reloc_ghost_dome");
          if (ghostDome) {
            ghostDome.position = Cesium.Cartesian3.fromDegrees(lon, lat, 0);
          }
          const ghostLabel = viewer.entities.getById("sys_reloc_ghost_label");
          if (ghostLabel) {
            ghostLabel.position = Cesium.Cartesian3.fromDegrees(lon, lat, 120);
            ghostLabel.label.text = `PRZEMIEŚĆ BATERIĘ TU:\n[${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E]\n[KLIKNIJ ABY ZATWIERDZIĆ]`;
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
                destination: Cesium.Cartesian3.fromDegrees(centerLon, centerLat - 0.018, 4500),
                orientation: {
                  heading: Cesium.Math.toRadians(15.0),
                  pitch: Cesium.Math.toRadians(-38.0),
                  roll: 0.0
                }
              });
              return;
            }
            
            // Check nodes
            const matchedNode = simStateRef.current.nodes.find((n: CriticalNode) => n.id === entityId);
            if (matchedNode) {
              if (setSelectedNode) setSelectedNode(matchedNode);
              if (setSelectedSystem) setSelectedSystem(null);
              onAddLog(`DOWÓDZTWO: Wybrano węzeł strategiczny: ${matchedNode.name}`, "info");
              flyToNode(matchedNode.lat, matchedNode.lon, matchedNode.name);
              return;
            }

            // Strip suffixes for deployed systems (like _model, _tower, _beacon, _label)
            let baseId = entityId;
             if (entityId.toLowerCase().startsWith("sys_")) {
              const parts = entityId.split("_");
              if (parts.length > 2) {
                baseId = `${parts[0]}_${parts[1]}`;
              }
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
          position: Cesium.Cartesian3.fromDegrees(lon, lat, 0),
          ellipsoid: {
            radii: new Cesium.Cartesian3(newSys.radius, newSys.radius, newSys.radius),
            material: new Cesium.GridMaterialProperty({
              color: Cesium.Color.fromCssColorString(newSys.color).withAlpha(0.9),
              cellAlpha: 0.05,
              lineCount: new Cesium.Cartesian2(12, 12),
              thickness: new Cesium.Cartesian2(2.5, 2.5)
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
            material: Cesium.Color.fromCssColorString(newSys.color).withAlpha(0.04),
            outline: true,
            outlineColor: Cesium.Color.fromCssColorString(newSys.color).withAlpha(0.5),
            outlineWidth: 2,
            height: 0
          },
          show: mapLayers.domes
        });

        const deployedGlassColor = Cesium.Color.fromCssColorString(newSys.color).withAlpha(0.25);

        if (activeWeapon === "PATRIOT") {
          // Render actual 3D GLB model for Patriot
          const heading = Cesium.Math.toRadians(0);
          const pitch = 0;
          const roll = 0;
          const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
          const position = Cesium.Cartesian3.fromDegrees(lon, lat, 0);
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

          // Taller beacon for Patriot
          viewer.entities.add({
            id: newSys.id + "_beacon",
            polyline: {
              positions: Cesium.Cartesian3.fromDegreesArrayHeights([
                lon, lat, 0,
                lon, lat, 120
              ]),
              width: 2,
              material: Cesium.Color.fromCssColorString(newSys.color).withAlpha(0.8)
            }
          });
        } else if (activeWeapon === "PILICA") {
          // Render actual 3D GLB model for Pilica
          const heading = Cesium.Math.toRadians(0);
          const pitch = 0;
          const roll = 0;
          const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
          const position = Cesium.Cartesian3.fromDegrees(lon, lat, 0);
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

          // Custom beacon for Pilica
          viewer.entities.add({
            id: newSys.id + "_beacon",
            polyline: {
              positions: Cesium.Cartesian3.fromDegreesArrayHeights([
                lon, lat, 0,
                lon, lat, 100
              ]),
              width: 2,
              material: Cesium.Color.fromCssColorString(newSys.color).withAlpha(0.8)
            }
          });
        } else {
          // Generic tower for other weapons
          viewer.entities.add({
            id: newSys.id + "_tower",
            position: Cesium.Cartesian3.fromDegrees(lon, lat, 20),
            cylinder: {
              length: 40, topRadius: 10, bottomRadius: 12,
              slices: 5,
              material: deployedGlassColor,
              outline: false
            }
          });

          // Tactical Vertical Beacon Line
          viewer.entities.add({
            id: newSys.id + "_beacon",
            polyline: {
              positions: Cesium.Cartesian3.fromDegreesArrayHeights([
                lon, lat, 0,
                lon, lat, 70
              ]),
              width: 1.5,
              material: Cesium.Color.fromCssColorString(newSys.color).withAlpha(0.8)
            }
          });
        }

        // Primary Label (always)
        const labelHeight = activeWeapon === "PATRIOT" ? 130 : activeWeapon === "PILICA" ? 110 : 70;
        viewer.entities.add({
          id: newSys.id + "_label",
          position: Cesium.Cartesian3.fromDegrees(lon, lat, labelHeight),
          label: {
            text: newSys.name.toUpperCase(),
            font: "bold 38px 'JetBrains Mono', 'Segoe UI', Arial, sans-serif",
            fillColor: Cesium.Color.fromCssColorString("#0f172a"),
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 5,
            showBackground: false,
            scale: 0.32,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -12),
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          }
        });
        
        domeEntitiesRef.current[newSys.id] = [domeEntity, groundCircle];

        setDeployedSystems((prev) => [...prev, newSys]);
        setSelectedWeapon(null);
        onAddLog(`ZAINSTALOWANO SYSTEM: ${newSys.name} na pozycji GPS [${lat.toFixed(4)} N, ${lon.toFixed(4)} E]`, "success");
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    let animationFrameId: number;

    const tick = () => {
      animationFrameId = requestAnimationFrame(tick);

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
          const colorStr = threat.type === "MISSILE" ? "#ef4444" : threat.type === "SHAHED" ? "#f59e0b" : "#eab308";
          threatEntity = viewer.entities.add({
            id: threat.id,
            position: Cesium.Cartesian3.fromDegrees(threat.lon, threat.lat, threat.alt),
            point: {
              pixelSize: 8,
              color: Cesium.Color.fromCssColorString(colorStr),
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 1.5,
              disableDepthTestDistance: Number.POSITIVE_INFINITY
            },
            label: {
              text: threat.name.toUpperCase(),
              font: "bold 30px 'JetBrains Mono', 'Segoe UI', Arial, sans-serif",
              fillColor: Cesium.Color.fromCssColorString("#991b1b"),
              outlineColor: Cesium.Color.WHITE,
              outlineWidth: 4,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              scale: 0.33,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              pixelOffset: new Cesium.Cartesian2(0, -12),
              disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
          });
          threatEntitiesRef.current[threat.id] = threatEntity;
        }

        threatEntity.position = Cesium.Cartesian3.fromDegrees(threat.lon, threat.lat, threat.alt);
        // Sync show property dynamically
        threatEntity.show = mapLayers.threats;

        let interceptedThisFrame = false;
        const threatPos = Cesium.Cartesian3.fromDegrees(threat.lon, threat.lat, threat.alt);

        systems.forEach((sys) => {
          if (interceptedThisFrame) return;
          if (sys.status === "RELOCATING") return;

          const sysPos = Cesium.Cartesian3.fromDegrees(sys.lon, sys.lat, 145);
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

                viewer.entities.remove(threatEntity);
                delete threatEntitiesRef.current[threat.id];

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

          viewer.entities.remove(threatEntity);
          delete threatEntitiesRef.current[threat.id];

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

    // Render nodes
    nodes.forEach((node) => {
      const color = NODE_COLORS[node.type] || "#16a34a";
      const glassColor = Cesium.Color.fromCssColorString(color).withAlpha(0.25);

      // 1. Hexagonal Tower Cylinder
      const towerCylinder = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(node.lon, node.lat, 25),
        cylinder: {
          length: 50,
          topRadius: 16,
          bottomRadius: 16,
          slices: 6,
          material: glassColor,
          outline: false
        },
        show: mapLayers.nodes
      });
      nodeEntitiesGroupRef.current.push(towerCylinder);

      // 2. Vertical Beacon Line
      const beaconLine = viewer.entities.add({
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArrayHeights([
            node.lon, node.lat, 0,
            node.lon, node.lat, 180
          ]),
          width: 1.5,
          material: Cesium.Color.fromCssColorString(color).withAlpha(0.75)
        },
        show: mapLayers.nodes
      });
      nodeEntitiesGroupRef.current.push(beaconLine);

      // 3. Ground ellipse Ring
      const ellipseRing = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(node.lon, node.lat),
        ellipse: {
          semiMajorAxis: 90,
          semiMinorAxis: 90,
          material: Cesium.Color.fromCssColorString(color).withAlpha(0.1),
          outline: false,
          height: 0
        },
        show: mapLayers.nodes
      });
      nodeEntitiesGroupRef.current.push(ellipseRing);

      // 4. Primary Label Point & Text
      const nodeEntity = viewer.entities.add({
        id: node.id,
        position: Cesium.Cartesian3.fromDegrees(node.lon, node.lat, 180),
        point: {
          pixelSize: 10,
          color: Cesium.Color.fromCssColorString(color),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2.5,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        },
        label: {
          text: node.name.toUpperCase(),
          font: "bold 42px 'JetBrains Mono', 'Segoe UI', Arial, sans-serif",
          fillColor: Cesium.Color.fromCssColorString("#0f172a"),
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 6,
          showBackground: false,
          scale: 0.3,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -18),
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        },
        show: mapLayers.nodes
      });
      nodeEntitiesRef.current[node.id] = nodeEntity;
      nodeEntitiesGroupRef.current.push(nodeEntity);

      // 5. Coordinates Label
      const coordLabel = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(node.lon, node.lat, 180),
        label: {
          text: `[${node.id}] ${node.lat.toFixed(4)}°N ${node.lon.toFixed(4)}°E`,
          font: "bold 28px 'JetBrains Mono', sans-serif",
          fillColor: Cesium.Color.fromCssColorString("#475569"),
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineColor: Cesium.Color.WHITE.withAlpha(0.95),
          outlineWidth: 5,
          showBackground: false,
          scale: 0.3,
          verticalOrigin: Cesium.VerticalOrigin.TOP,
          pixelOffset: new Cesium.Cartesian2(0, 10),
          disableDepthTestDistance: Number.POSITIVE_INFINITY
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

    // Helper to generate elegant 3D parabolic geodesic curves
    const generateParabolicPositions = (
      startLon: number,
      startLat: number,
      endLon: number,
      endLat: number,
      numPoints = 24
    ) => {
      const positions = [];
      for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        const lon = startLon + (endLon - startLon) * t;
        const lat = startLat + (endLat - startLat) * t;
        
        // Parabolic rise peaking at 180 meters in the center
        const peakHeight = 160;
        const alt = 25 + 4 * peakHeight * t * (1 - t);
        
        positions.push(Cesium.Cartesian3.fromDegrees(lon, lat, alt));
      }
      return positions;
    };

    // Pre-calculate pairs to avoid overlapping labels
    const pairCounts: { [key: string]: number } = {};
    const pairIndices: { [key: string]: number } = {};

    relations.forEach((rel) => {
      const key = [rel.source, rel.target].sort().join("-");
      pairCounts[key] = (pairCounts[key] || 0) + 1;
    });

    // Render relations
    relations.forEach((rel) => {
      const sourceNode = nodes.find(n => n.id === rel.source);
      const targetNode = nodes.find(n => n.id === rel.target);
      if (!sourceNode || !targetNode) return;

      const color = sourceNode.status === "DESTROYED" 
        ? Cesium.Color.RED 
        : sourceNode.status === "DEGRADED" 
        ? Cesium.Color.ORANGE 
        : Cesium.Color.CYAN;

      // 1. Futuristic Curved Geodesic Glow Polyline
      const polylineEntity = viewer.entities.add({
        polyline: {
          positions: generateParabolicPositions(sourceNode.lon, sourceNode.lat, targetNode.lon, targetNode.lat),
          width: 2.5,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.35,
            color: color.withAlpha(0.85)
          })
        },
        show: mapLayers.relations
      });

      relationEntitiesGroupRef.current.push(polylineEntity);

      // 2. Glowing Flow Peak Node & Label Card (Floating pill-shaped tactical label)
      // Solve overlap by shifting multiple labels along the parabolic arc path (tVal)
      const key = [rel.source, rel.target].sort().join("-");
      const totalForPair = pairCounts[key] || 1;
      const currentIndex = pairIndices[key] || 0;
      pairIndices[key] = currentIndex + 1;

      let tVal = 0.5;
      if (totalForPair > 1) {
        // Space them out evenly along the curve, e.g. 0.3, 0.7
        const step = 0.4 / (totalForPair - 1);
        tVal = 0.3 + currentIndex * step;
      }

      const midLon = sourceNode.lon + (targetNode.lon - sourceNode.lon) * tVal;
      const midLat = sourceNode.lat + (targetNode.lat - sourceNode.lat) * tVal;
      const peakHeight = 160;
      const midAlt = 25 + 4 * peakHeight * tVal * (1 - tVal);

      const peakLabelEntity = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(midLon, midLat, midAlt),
        point: {
          pixelSize: 6,
          color: color,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 1.5,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        },
        label: {
          text: `  ${rel.label.toUpperCase()}  `,
          font: "bold 10px 'JetBrains Mono', 'Segoe UI', Arial, sans-serif",
          fillColor: Cesium.Color.WHITE,
          style: Cesium.LabelStyle.FILL,
          showBackground: true,
          backgroundColor: color.withAlpha(0.8),
          backgroundPadding: new Cesium.Cartesian2(6, 4),
          scale: 0.9,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -8),
          disableDepthTestDistance: Number.POSITIVE_INFINITY
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
          position: Cesium.Cartesian3.fromDegrees(centerLon, centerLat, 500),
          point: {
            pixelSize: 26,
            color: Cesium.Color.fromCssColorString("#06b6d4").withAlpha(0.25),
            outlineColor: Cesium.Color.fromCssColorString("#06b6d4"),
            outlineWidth: 3,
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          },
          label: {
            text: `  OBIEKTY: ${totalObjects}  `,
            font: "bold 11px 'JetBrains Mono', 'Segoe UI', Arial, sans-serif",
            fillColor: Cesium.Color.WHITE,
            style: Cesium.LabelStyle.FILL,
            showBackground: true,
            backgroundColor: Cesium.Color.fromCssColorString("#0f172a").withAlpha(0.9),
            backgroundPadding: new Cesium.Cartesian2(10, 6),
            scale: 1.0,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -22),
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          }
        });
        clusterEntityRef.current = cluster;
      } else {
        // Update count dynamically
        clusterEntityRef.current.label.text = `  OBIEKTY: ${totalObjects}  `;
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
    cancelRelocationDrag
  };
}
