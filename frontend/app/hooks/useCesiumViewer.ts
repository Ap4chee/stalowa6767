import { useEffect, useRef, useState, useCallback, MutableRefObject } from "react";
import { CriticalNode, DeployedSystem, HoveredCoords, LogType, SimState, Threat } from "../types";
import { WEAPONS } from "../data/weapons";
import { THREAT_TYPES } from "../data/threats";
import { INITIAL_NODES, NODE_COLORS } from "../data/nodes";
import { SAN_RIVER_COORDS } from "../data/river";

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
  setSelectedSystem
}: UseCesiumViewerOptions) {
  const viewerRef = useRef<any>(null);
  const nodeEntitiesRef = useRef<{ [id: string]: any }>({});
  const domeEntitiesRef = useRef<{ [id: string]: any }>({});
  const threatEntitiesRef = useRef<{ [id: string]: any }>({});
  const laserLinesRef = useRef<any>(null);
  const [isCesiumLoaded, setIsCesiumLoaded] = useState(false);

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
      viewer.entities.remove(domeEntitiesRef.current[key]);
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

    const idsToRemove = [sysId, `${sysId}_tower`, `${sysId}_beacon`, `${sysId}_label`];
    idsToRemove.forEach(id => {
      const ent = viewer.entities.getById(id);
      if (ent) viewer.entities.remove(ent);
    });

    if (domeEntitiesRef.current[sysId]) {
      delete domeEntitiesRef.current[sysId];
    }
  }, []);

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

    viewer.imageryLayers.addImageryProvider(
      new Cesium.UrlTemplateImageryProvider({
        url: "https://basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}@2x.png",
        credit: "CartoDB",
        maximumLevel: 19
      })
    );

    const laserCollection = viewer.scene.primitives.add(new Cesium.PolylineCollection());
    laserLinesRef.current = laserCollection;

    viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString("#f3f4f6");
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

    INITIAL_NODES.forEach((node) => {
      const color = NODE_COLORS[node.type] || "#16a34a";
      const glassColor = Cesium.Color.fromCssColorString(color).withAlpha(0.25);

      // 1. Sleek Single-Primitive Glassmorphic Hexagonal Tower (No heavy outlines!)
      viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(node.lon, node.lat, 25),
        cylinder: {
          length: 50,
          topRadius: 16,
          bottomRadius: 16,
          slices: 6,
          material: glassColor,
          outline: false
        }
      });

      // 2. Tactical Vertical Beacon Line (Extremely lightweight, links ground to floating label)
      viewer.entities.add({
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArrayHeights([
            node.lon, node.lat, 0,
            node.lon, node.lat, 180
          ]),
          width: 1.5,
          material: Cesium.Color.fromCssColorString(color).withAlpha(0.75)
        }
      });

      // 3. Ground-Level Tactical Highlight Ring
      viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(node.lon, node.lat),
        ellipse: {
          semiMajorAxis: 90,
          semiMinorAxis: 90,
          material: Cesium.Color.fromCssColorString(color).withAlpha(0.1),
          outline: false,
          height: 0
        }
      });

      // 4. Primary Label (High resolution, supersampled dark text with crisp white halo!)
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
          font: "bold 42px Share Tech Mono, monospace",
          fillColor: Cesium.Color.fromCssColorString("#0f172a"),
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 6,
          showBackground: false,
          scale: 0.3,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -18),
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
      });
      nodeEntitiesRef.current[node.id] = nodeEntity;

      // 5. Secondary Coordinate Label (High-contrast, crisp!)
      viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(node.lon, node.lat, 180),
        label: {
          text: `[${node.id}] ${node.lat.toFixed(4)}°N ${node.lon.toFixed(4)}°E`,
          font: "bold 28px JetBrains Mono, monospace",
          fillColor: Cesium.Color.fromCssColorString("#475569"),
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineColor: Cesium.Color.WHITE.withAlpha(0.95),
          outlineWidth: 5,
          showBackground: false,
          scale: 0.3,
          verticalOrigin: Cesium.VerticalOrigin.TOP,
          pixelOffset: new Cesium.Cartesian2(0, 10),
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
      });
    });

    const riverCoordsArray = SAN_RIVER_COORDS.flatMap(c => [c.lon, c.lat]);
    viewer.entities.add({
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArray(riverCoordsArray),
        width: 8,
        material: new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.35,
          color: Cesium.Color.fromCssColorString("#0891b2").withAlpha(0.6)
        }),
        clampToGround: true
      }
    });
    viewer.entities.add({
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArray(riverCoordsArray),
        width: 2.5,
        material: Cesium.Color.CYAN,
        clampToGround: true
      }
    });
    viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(22.0620, 50.5700, 50),
      label: {
        text: "RZEKA SAN",
        font: "bold 32px Share Tech Mono, monospace",
        fillColor: Cesium.Color.fromCssColorString("#0284c7"),
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 5,
        scale: 0.35,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    });

    viewer.entities.add({
      rectangle: {
        coordinates: Cesium.Rectangle.fromDegrees(22.01, 50.52, 22.09, 50.60),
        material: Cesium.Color.CYAN.withAlpha(0.02),
        outline: true,
        outlineColor: Cesium.Color.CYAN.withAlpha(0.25),
        outlineWidth: 1.5,
        height: 0
      }
    });
    viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(22.01, 50.60, 30),
      label: {
        text: "ZONA TAKTYCZNA STW // NW",
        font: "bold 28px JetBrains Mono, monospace",
        fillColor: Cesium.Color.fromCssColorString("#0891b2"),
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 4,
        scale: 0.3,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    });
    viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(22.09, 50.52, 30),
      label: {
        text: "ZONA TAKTYCZNA STW // SE",
        font: "bold 28px JetBrains Mono, monospace",
        fillColor: Cesium.Color.fromCssColorString("#0891b2"),
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 4,
        scale: 0.3,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    });

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
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    handler.setInputAction((click: any) => {
      const activeWeapon = simStateRef.current.selectedWeapon;
      
      if (!activeWeapon) {
        // Entity picking mode
        const pickedObject = viewer.scene.pick(click.position);
        if (Cesium.defined(pickedObject) && pickedObject.id) {
          const entityId = pickedObject.id.id;
          
          // Check nodes
          const matchedNode = simStateRef.current.nodes.find((n: CriticalNode) => n.id === entityId);
          if (matchedNode) {
            if (setSelectedNode) setSelectedNode(matchedNode);
            if (setSelectedSystem) setSelectedSystem(null);
            onAddLog(`DOWÓDZTWO: Wybrano węzeł strategiczny: ${matchedNode.name}`, "info");
            flyToNode(matchedNode.lat, matchedNode.lon, matchedNode.name);
            return;
          }

          // Check deployed systems
          const matchedSystem = simStateRef.current.deployedSystems.find((s: DeployedSystem) => s.id === entityId);
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
        return;
      }

      const cartesian = viewer.camera.pickEllipsoid(click.position, viewer.scene.globe.ellipsoid);
      if (cartesian) {
        const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        const lon = Cesium.Math.toDegrees(cartographic.longitude);
        const lat = Cesium.Math.toDegrees(cartographic.latitude);

        if (lat < 50.51 || lat > 50.61 || lon < 22.01 || lon > 22.09) {
          onAddLog("DOWÓDZTWO: Lokacja poza dozwoloną strefą obronną miasta Stalowa Wola.", "error");
          return;
        }

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
          }
        });

        viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(lon, lat),
          ellipse: {
            semiMajorAxis: newSys.radius,
            semiMinorAxis: newSys.radius,
            material: Cesium.Color.fromCssColorString(newSys.color).withAlpha(0.04),
            outline: true,
            outlineColor: Cesium.Color.fromCssColorString(newSys.color).withAlpha(0.5),
            outlineWidth: 2,
            height: 0
          }
        });

        const deployedGlassColor = Cesium.Color.fromCssColorString(newSys.color).withAlpha(0.25);

        // 1. Sleek Single-Primitive glass launch tower (No outline!)
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

        // 2. Tactical Vertical Beacon Line
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

        // 3. Primary High-Contrast Supersampled Label
        viewer.entities.add({
          id: newSys.id + "_label",
          position: Cesium.Cartesian3.fromDegrees(lon, lat, 70),
          label: {
            text: newSys.name.toUpperCase(),
            font: "bold 38px Share Tech Mono, monospace",
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
        domeEntitiesRef.current[newSys.id] = domeEntity;

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

        threat.progress += 0.003 * speed;

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
              font: "bold 30px Share Tech Mono, monospace",
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

        let interceptedThisFrame = false;
        const threatPos = Cesium.Cartesian3.fromDegrees(threat.lon, threat.lat, threat.alt);

        systems.forEach((sys) => {
          if (interceptedThisFrame) return;

          const sysPos = Cesium.Cartesian3.fromDegrees(sys.lon, sys.lat, 145);
          const distance = Cesium.Cartesian3.distance(sysPos, threatPos);

          if (distance <= sys.radius) {
            const pathConfig = THREAT_TYPES[threat.type];
            const activeMatch = sys.type === "PILICA" || (sys.type === "WRE" && !pathConfig.immuneToWRE);

            if (activeMatch && laserLinesRef.current && typeof laserLinesRef.current.add === "function") {
              const laserColor = sys.type === "PILICA" ? "#ff4d4d" : "#3b82f6";
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

              const dmg = sys.type === "PILICA" ? 0.9 : 2.5;
              threat.health -= dmg * speed;

              if (threat.health <= 0) {
                interceptedThisFrame = true;
                threat.status = sys.type === "PILICA" ? "INTERCEPTED" : "JAMMED";

                viewer.entities.remove(threatEntity);
                delete threatEntitiesRef.current[threat.id];

                setThreats(prev => prev.map(t => t.id === threat.id ? { ...t, status: threat.status } : t));

                if (sys.type === "PILICA") {
                  onAddLog(`KINETYCZNE ZESTRZELEŃIE: PSR-A PILICA zneutralizował rakietami cel ${threat.name}!`, "combat");
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

  return {
    viewerRef,
    nodeEntitiesRef,
    domeEntitiesRef,
    threatEntitiesRef,
    isCesiumLoaded,
    flyToNode,
    resetViewer,
    removeDeployedSystem
  };
}
