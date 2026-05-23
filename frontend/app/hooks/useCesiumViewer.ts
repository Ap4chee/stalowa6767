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
  setHoveredCoords
}: UseCesiumViewerOptions) {
  const viewerRef = useRef<any>(null);
  const nodeEntitiesRef = useRef<{ [id: string]: any }>({});
  const domeEntitiesRef = useRef<{ [id: string]: any }>({});
  const threatEntitiesRef = useRef<{ [id: string]: any }>({});
  const laserLinesRef = useRef<any[]>([]);
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

    const Cesium = (window as any).Cesium;
    INITIAL_NODES.forEach((node) => {
      const entity = nodeEntitiesRef.current[node.id];
      if (entity && Cesium) {
        entity.point.color = Cesium.Color.fromCssColorString("#22c55e");
      }
    });
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

    viewer.resolutionScale = window.devicePixelRatio || 1.0;
    viewer.useBrowserRecommendedResolution = false;

    viewerRef.current = viewer;
    setIsCesiumLoaded(true);

    viewer.imageryLayers.addImageryProvider(
      new Cesium.UrlTemplateImageryProvider({
        url: "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
        credit: "CartoDB",
        maximumLevel: 19
      })
    );

    viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString("#e8e8e8");
    viewer.scene.skyAtmosphere.show = true;
    viewer.scene.fog.enabled = true;
    viewer.scene.globe.showGroundAtmosphere = true;
    viewer.scene.globe.enableLighting = false;
    viewer.scene.globe.depthTestAgainstTerrain = true;

    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(centerLon, centerLat - 0.018, 4500),
      orientation: {
        heading: Cesium.Math.toRadians(15.0),
        pitch: Cesium.Math.toRadians(-42.0),
        roll: 0.0
      }
    });

    INITIAL_NODES.forEach((node) => {
      const color = NODE_COLORS[node.type] || "#16a34a";

      if (node.type === "industrial") {
        viewer.entities.add({ position: Cesium.Cartesian3.fromDegrees(node.lon, node.lat, 20), box: { dimensions: new Cesium.Cartesian3(200, 100, 40), material: Cesium.Color.fromCssColorString("#334155").withAlpha(0.9), outline: true, outlineColor: Cesium.Color.fromCssColorString(color) } });
        viewer.entities.add({ position: Cesium.Cartesian3.fromDegrees(node.lon - 0.001, node.lat + 0.0005, 15), box: { dimensions: new Cesium.Cartesian3(120, 70, 30), material: Cesium.Color.fromCssColorString("#475569").withAlpha(0.85), outline: true, outlineColor: Cesium.Color.fromCssColorString(color) } });
      } else if (node.type === "power") {
        viewer.entities.add({ position: Cesium.Cartesian3.fromDegrees(node.lon, node.lat, 50), cylinder: { length: 100, topRadius: 22, bottomRadius: 32, material: Cesium.Color.fromCssColorString("#64748b").withAlpha(0.85), outline: true, outlineColor: Cesium.Color.fromCssColorString(color) } });
        viewer.entities.add({ position: Cesium.Cartesian3.fromDegrees(node.lon + 0.001, node.lat - 0.0004, 50), cylinder: { length: 100, topRadius: 22, bottomRadius: 32, material: Cesium.Color.fromCssColorString("#64748b").withAlpha(0.85), outline: true, outlineColor: Cesium.Color.fromCssColorString(color) } });
        viewer.entities.add({ position: Cesium.Cartesian3.fromDegrees(node.lon - 0.0008, node.lat + 0.0006, 75), cylinder: { length: 150, topRadius: 4, bottomRadius: 7, material: Cesium.Color.fromCssColorString("#94a3b8").withAlpha(0.9), outline: true, outlineColor: Cesium.Color.fromCssColorString("#dc2626") } });
        viewer.entities.add({ position: Cesium.Cartesian3.fromDegrees(node.lon + 0.0005, node.lat + 0.0003, 18), box: { dimensions: new Cesium.Cartesian3(160, 60, 36), material: Cesium.Color.fromCssColorString("#475569").withAlpha(0.85), outline: true, outlineColor: Cesium.Color.fromCssColorString(color) } });
      } else if (node.type === "water") {
        viewer.entities.add({ position: Cesium.Cartesian3.fromDegrees(node.lon, node.lat, 15), cylinder: { length: 30, topRadius: 18, bottomRadius: 18, material: Cesium.Color.fromCssColorString("#1e40af").withAlpha(0.7), outline: true, outlineColor: Cesium.Color.fromCssColorString(color) } });
        viewer.entities.add({ position: Cesium.Cartesian3.fromDegrees(node.lon + 0.0008, node.lat, 12), cylinder: { length: 24, topRadius: 14, bottomRadius: 14, material: Cesium.Color.fromCssColorString("#1e40af").withAlpha(0.7), outline: true, outlineColor: Cesium.Color.fromCssColorString(color) } });
        viewer.entities.add({ position: Cesium.Cartesian3.fromDegrees(node.lon - 0.0006, node.lat + 0.0004, 8), box: { dimensions: new Cesium.Cartesian3(60, 40, 16), material: Cesium.Color.fromCssColorString("#475569").withAlpha(0.85), outline: true, outlineColor: Cesium.Color.fromCssColorString(color) } });
      } else if (node.type === "electrical") {
        viewer.entities.add({ position: Cesium.Cartesian3.fromDegrees(node.lon, node.lat, 8), box: { dimensions: new Cesium.Cartesian3(50, 40, 16), material: Cesium.Color.fromCssColorString("#475569").withAlpha(0.85), outline: true, outlineColor: Cesium.Color.fromCssColorString(color) } });
        viewer.entities.add({ position: Cesium.Cartesian3.fromDegrees(node.lon + 0.0004, node.lat - 0.0002, 20), cylinder: { length: 40, topRadius: 1.5, bottomRadius: 3, material: Cesium.Color.fromCssColorString("#94a3b8"), outline: true, outlineColor: Cesium.Color.fromCssColorString(color) } });
      } else if (node.type === "logistic") {
        viewer.entities.add({ position: Cesium.Cartesian3.fromDegrees(node.lon, node.lat, 5), box: { dimensions: new Cesium.Cartesian3(120, 25, 10), material: Cesium.Color.fromCssColorString("#475569").withAlpha(0.85), outline: true, outlineColor: Cesium.Color.fromCssColorString(color) } });
        viewer.entities.add({ position: Cesium.Cartesian3.fromDegrees(node.lon, node.lat + 0.0003, 2), box: { dimensions: new Cesium.Cartesian3(200, 8, 4), material: Cesium.Color.fromCssColorString("#64748b").withAlpha(0.7), outline: true, outlineColor: Cesium.Color.fromCssColorString(color) } });
      } else if (node.type === "transit") {
        viewer.entities.add({ position: Cesium.Cartesian3.fromDegrees(node.lon, node.lat, 12), box: { dimensions: new Cesium.Cartesian3(18, 200, 4), material: Cesium.Color.fromCssColorString("#64748b").withAlpha(0.9), outline: true, outlineColor: Cesium.Color.fromCssColorString(color) } });
        viewer.entities.add({ position: Cesium.Cartesian3.fromDegrees(node.lon - 0.0003, node.lat + 0.0006, 22), cylinder: { length: 44, topRadius: 2, bottomRadius: 3, material: Cesium.Color.fromCssColorString("#475569"), outline: true, outlineColor: Cesium.Color.fromCssColorString(color) } });
        viewer.entities.add({ position: Cesium.Cartesian3.fromDegrees(node.lon + 0.0003, node.lat - 0.0006, 22), cylinder: { length: 44, topRadius: 2, bottomRadius: 3, material: Cesium.Color.fromCssColorString("#475569"), outline: true, outlineColor: Cesium.Color.fromCssColorString(color) } });
      } else if (node.type === "hq") {
        viewer.entities.add({ position: Cesium.Cartesian3.fromDegrees(node.lon, node.lat, 8), cylinder: { length: 16, topRadius: 22, bottomRadius: 22, slices: 6, material: Cesium.Color.fromCssColorString("#334155").withAlpha(0.9), outline: true, outlineColor: Cesium.Color.fromCssColorString(color) } });
        viewer.entities.add({ position: Cesium.Cartesian3.fromDegrees(node.lon, node.lat, 22), cylinder: { length: 12, topRadius: 1, bottomRadius: 3, material: Cesium.Color.fromCssColorString("#64748b"), outline: true, outlineColor: Cesium.Color.fromCssColorString(color) } });
        viewer.entities.add({ position: Cesium.Cartesian3.fromDegrees(node.lon, node.lat, 30), ellipsoid: { radii: new Cesium.Cartesian3(5, 5, 5), material: Cesium.Color.fromCssColorString(color).withAlpha(0.8), outline: true, outlineColor: Cesium.Color.fromCssColorString(color) } });
      }

      viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(node.lon, node.lat),
        ellipse: { semiMajorAxis: 100, semiMinorAxis: 100, material: Cesium.Color.fromCssColorString(color).withAlpha(0.1), outline: true, outlineColor: Cesium.Color.fromCssColorString(color).withAlpha(0.6), outlineWidth: 2, height: 0 }
      });

      const nodeEntity = viewer.entities.add({
        id: node.id,
        position: Cesium.Cartesian3.fromDegrees(node.lon, node.lat, 180),
        point: { pixelSize: 10, color: Cesium.Color.fromCssColorString(color), outlineColor: Cesium.Color.WHITE, outlineWidth: 2, disableDepthTestDistance: Number.POSITIVE_INFINITY },
        label: {
          text: node.name.toUpperCase(),
          font: "bold 32px Share Tech Mono, monospace",
          fillColor: Cesium.Color.fromCssColorString(color),
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineColor: Cesium.Color.fromCssColorString("#020617").withAlpha(0.85),
          outlineWidth: 3,
          showBackground: false,
          scale: 0.35,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -18),
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
      });
      nodeEntitiesRef.current[node.id] = nodeEntity;

      viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(node.lon, node.lat, 180),
        label: {
          text: `[${node.id}] ${node.lat.toFixed(4)}°N ${node.lon.toFixed(4)}°E`,
          font: "bold 24px JetBrains Mono, monospace",
          fillColor: Cesium.Color.fromCssColorString("#64748b"),
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineColor: Cesium.Color.fromCssColorString("#020617").withAlpha(0.65),
          outlineWidth: 3,
          showBackground: false,
          scale: 0.35,
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
        font: "bold 10px Share Tech Mono, monospace",
        fillColor: Cesium.Color.CYAN.withAlpha(0.7),
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        outlineWidth: 2,
        outlineColor: Cesium.Color.BLACK,
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
        font: "8px JetBrains Mono, monospace",
        fillColor: Cesium.Color.CYAN.withAlpha(0.35),
        style: Cesium.LabelStyle.FILL,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    });
    viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(22.09, 50.52, 30),
      label: {
        text: "ZONA TAKTYCZNA STW // SE",
        font: "8px JetBrains Mono, monospace",
        fillColor: Cesium.Color.CYAN.withAlpha(0.35),
        style: Cesium.LabelStyle.FILL,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    });

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

    handler.setInputAction((movement: any) => {
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
      if (!activeWeapon) return;

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
            material: Cesium.Color.fromCssColorString(newSys.color).withAlpha(0.08),
            outline: true,
            outlineColor: Cesium.Color.fromCssColorString(newSys.color).withAlpha(0.85),
            slicePartitions: 24,
            stackPartitions: 12
          }
        });

        viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(lon, lat),
          ellipse: {
            semiMajorAxis: newSys.radius,
            semiMinorAxis: newSys.radius,
            material: Cesium.Color.fromCssColorString(newSys.color).withAlpha(0.06),
            outline: true,
            outlineColor: Cesium.Color.fromCssColorString(newSys.color).withAlpha(0.4),
            outlineWidth: 2,
            height: 0
          }
        });

        viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(lon, lat, 5),
          cylinder: {
            length: 10, topRadius: 12, bottomRadius: 14,
            material: Cesium.Color.fromCssColorString("#334155").withAlpha(0.9),
            outline: true, outlineColor: Cesium.Color.fromCssColorString(newSys.color)
          }
        });
        viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(lon, lat, 30),
          cylinder: {
            length: 40, topRadius: 2, bottomRadius: 4,
            material: Cesium.Color.fromCssColorString("#64748b").withAlpha(0.9),
            outline: true, outlineColor: Cesium.Color.fromCssColorString(newSys.color)
          }
        });
        viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(lon, lat, 55),
          ellipsoid: {
            radii: new Cesium.Cartesian3(6, 6, 6),
            material: Cesium.Color.fromCssColorString(newSys.color).withAlpha(0.85),
            outline: true, outlineColor: Cesium.Color.WHITE
          }
        });
        viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(lon, lat, 70),
          label: {
            text: newSys.name,
            font: "bold 30px Share Tech Mono, monospace",
            fillColor: Cesium.Color.fromCssColorString(newSys.color),
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            outlineColor: Cesium.Color.fromCssColorString("#020617").withAlpha(0.85),
            outlineWidth: 3, showBackground: false, scale: 0.35,
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

      laserLinesRef.current.forEach((line) => {
        viewer.entities.remove(line);
      });
      laserLinesRef.current = [];

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
              text: threat.name,
              font: "8px Share Tech Mono, monospace",
              fillColor: Cesium.Color.fromCssColorString(colorStr),
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 2,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              pixelOffset: new Cesium.Cartesian2(0, -8),
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

            if (activeMatch) {
              const laser = viewer.entities.add({
                polyline: {
                  positions: [sysPos, threatPos],
                  width: 3.0,
                  material: Cesium.Color.fromCssColorString(sys.type === "PILICA" ? "#ff4d4d" : "#3b82f6"),
                  disableDepthTestDistance: Number.POSITIVE_INFINITY
                }
              });
              laserLinesRef.current.push(laser);

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
    resetViewer
  };
}
