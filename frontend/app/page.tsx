"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Shield,
  Zap,
  Droplet,
  Flame,
  Radio,
  Target,
  Activity,
  Wifi,
  AlertTriangle,
  Play,
  Pause,
  RefreshCw,
  Crosshair,
  Compass,
  Volume2,
  VolumeX,
  Network,
  Navigation,
  CheckCircle2
} from "lucide-react";

// ==========================================
// 1. DATASETS & CONFIGURATIONS (Stalowa Wola)
// ==========================================

// Stalowa Wola Coordinates Anchor Center
const CENTER_LAT = 50.5630;
const CENTER_LON = 22.0490;

// 7 Critical Infrastructure Objects (GPS coordinates)
interface CriticalNode {
  id: string;
  name: string;
  lat: number;
  lon: number;
  type: "industrial" | "power" | "water" | "electrical" | "logistic" | "transit" | "hq";
  description: string;
  health: number; // 0 to 100
  status: "OPERATIONAL" | "DEGRADED" | "DESTROYED";
  backupPower: boolean;
  notes: string;
}

const INITIAL_NODES: CriticalNode[] = [
  {
    id: "OBJ_01",
    name: "Huta Stalowa Wola S.A.",
    lat: 50.5482,
    lon: 22.0495,
    type: "industrial",
    description: "Strategiczny przemysł obronny (producent armatohaubic Krab, BWP Borsuk). Cel krytyczny.",
    health: 100,
    status: "OPERATIONAL",
    backupPower: false,
    notes: "Zasilany z Elektrowni OBJ_02. Spadek produkcji przy braku zasilania."
  },
  {
    id: "OBJ_02",
    name: "Elektrownia Stalowa Wola",
    lat: 50.5574,
    lon: 22.0621,
    type: "power",
    description: "Blok gazowo-parowy, kluczowe źródło energii i ciepła dla miasta i przemysłu.",
    health: 100,
    status: "OPERATIONAL",
    backupPower: false,
    notes: "Zasila OBJ_01 i OBJ_03. Wymaga chłodzenia wodnego z Ujęcia OBJ_03."
  },
  {
    id: "OBJ_03",
    name: "Stacja Uzdatniania MZK",
    lat: 50.5841,
    lon: 22.0315,
    type: "water",
    description: "Ujęcie i stacja uzdatniania wody dla ludności oraz woda chłodząca dla elektrowni.",
    health: 100,
    status: "OPERATIONAL",
    backupPower: false,
    notes: "Zasilana z Elektrowni OBJ_02. Dostarcza wodę chłodzącą do bloku Elektrowni."
  },
  {
    id: "OBJ_04",
    name: "GPZ 'Maziarnia'",
    lat: 50.5395,
    lon: 22.0682,
    type: "electrical",
    description: "Główny Punkt Zasilający - stacja transformatorowa wysokiego napięcia sieci przesyłowej.",
    health: 100,
    status: "OPERATIONAL",
    backupPower: false,
    notes: "Zasila Centrum Zarządzania Kryzysowego OBJ_07."
  },
  {
    id: "OBJ_05",
    name: "Węzeł Kolejowy Rozwadów",
    lat: 50.5878,
    lon: 22.0465,
    type: "logistic",
    description: "Węzeł logistyki wojskowej (NATO Hub) i towarowej obrony strategicznej.",
    health: 100,
    status: "OPERATIONAL",
    backupPower: false,
    notes: "Autonomiczna infrastruktura kolejowa. Kluczowy dla przerzutu wojsk."
  },
  {
    id: "OBJ_06",
    name: "Most gen. Bora-Komorowskiego",
    lat: 50.5744,
    lon: 22.0678,
    type: "transit",
    description: "Kluczowa przeprawa przez rzekę San. Główny korytarz logistyczny ze wschodu.",
    health: 100,
    status: "OPERATIONAL",
    backupPower: false,
    notes: "Przeprawa drogowa. Brak bezpośrednich zależności sieciowych."
  },
  {
    id: "OBJ_07",
    name: "Centrum Zarządzania Kryzysowego",
    lat: 50.5701,
    lon: 22.0524,
    type: "hq",
    description: "Sztab dowodzenia kryzysowego obrony cywilnej i Urząd Miasta.",
    health: 100,
    status: "OPERATIONAL",
    backupPower: false,
    notes: "Zasilany z GPZ Maziarnia OBJ_04. Posiada systemy łączności bateryjnej."
  }
];

// River San Actual Winding Coordinates
const SAN_RIVER_COORDS = [
  { lat: 50.5300, lon: 22.0800 },
  { lat: 50.5400, lon: 22.0730 },
  { lat: 50.5500, lon: 22.0690 },
  { lat: 50.5600, lon: 22.0675 },
  { lat: 50.5700, lon: 22.0620 },
  { lat: 50.5780, lon: 22.0520 },
  { lat: 50.5840, lon: 22.0380 },
  { lat: 50.5900, lon: 22.0300 }
];

// Weapon Systems available to Deploy
interface WeaponSystem {
  type: "PILICA" | "WRE" | "RADAR";
  name: string;
  range: number; // in meters
  color: string;
  colorHex: string;
  description: string;
  threatsCovered: string[];
}

const WEAPONS: WeaponSystem[] = [
  {
    type: "PILICA",
    name: "PSR-A PILICA",
    range: 5000, // 5km
    color: "#ff4d4d", // Red
    colorHex: "#ff4d4d",
    description: "Kinetyczny system VSHORAD wyposażony w działka 23mm i rakiety Grom/Piorun.",
    threatsCovered: ["DRONE", "SHAHED", "MISSILE"]
  },
  {
    type: "WRE",
    name: "WRE JAMMER",
    range: 2000, // 2km
    color: "#3b82f6", // Blue
    colorHex: "#3b82f6",
    description: "Mobilna stacja zakłócania elektronicznego pasma GPS/RF na drony cywilne.",
    threatsCovered: ["DRONE"]
  },
  {
    type: "RADAR",
    name: "RADAR MAŁOGABARYTOWY",
    range: 3500, // 3.5km
    color: "#22c55e", // Green
    colorHex: "#22c55e",
    description: "Radar dopplerowski wczesnego wykrywania celów o małej sygnaturze LSS.",
    threatsCovered: ["DRONE", "SHAHED", "MISSILE"]
  }
];

interface DeployedSystem {
  id: string;
  type: "PILICA" | "WRE" | "RADAR";
  name: string;
  lat: number;
  lon: number;
  radius: number; // meters
  color: string;
}

interface ThreatType {
  type: "DRONE" | "SHAHED" | "MISSILE";
  name: string;
  speed: number; // lat/lon shift per frame
  alt: number; // height in meters
  description: string;
  immuneToWRE: boolean;
}

const THREAT_TYPES: { [key: string]: ThreatType } = {
  DRONE: {
    type: "DRONE",
    name: "Dron komercyjny / rozpoznawczy",
    speed: 0.0003,
    alt: 120,
    description: "Niski pułap, wolna prędkość. Podatny na WRE oraz Pilicę.",
    immuneToWRE: false
  },
  SHAHED: {
    type: "SHAHED",
    name: "Amunicja krążąca (Shahed-136)",
    speed: 0.0005,
    alt: 250,
    description: "Ukrycie terenowe w dolinie Sanu. Odporny na podstawowe zakłócacze WRE.",
    immuneToWRE: true
  },
  MISSILE: {
    type: "MISSILE",
    name: "Rakieta manewrująca",
    speed: 0.0014,
    alt: 600,
    description: "Wysoka prędkość i pułap. Wyłącznie Pilica kinetycznie może ją zestrzelić.",
    immuneToWRE: true
  }
};

interface Threat {
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
  progress: number; // 0 to 1
  status: "FLYING" | "JAMMED" | "INTERCEPTED" | "IMPACTED";
  health: number;
}

interface LogEntry {
  timestamp: string;
  text: string;
  type: "info" | "success" | "warning" | "error" | "combat";
}

// ==========================================
// 2. MAIN CORE COMPONENT
// ==========================================
export default function SteelSentinelDashboard() {
  const [nodes, setNodes] = useState<CriticalNode[]>(INITIAL_NODES);
  const [deployedSystems, setDeployedSystems] = useState<DeployedSystem[]>([]);
  const [selectedWeapon, setSelectedWeapon] = useState<"PILICA" | "WRE" | "RADAR" | null>(null);
  const [threats, setThreats] = useState<Threat[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([
    { timestamp: "16:30:00", text: "SYSTEM DOWODZENIA STEEL SENTINEL ZAINICJOWANY", type: "info" },
    { timestamp: "16:30:02", text: "PŁASZCZYZNA TAKTYCZNA CESIUM JS: WCZYTANO CYFROWY BLIŹNIAK STALOWA WOLA", type: "info" },
    { timestamp: "16:30:04", text: "LOGIKA KASKADOWA: WĘZŁY INFRASTRUKTURY SKONFIGUROWANE (STATUS: 100%)", type: "success" }
  ]);
  const [defcon, setDefcon] = useState<number>(5);
  const [simSpeed, setSimSpeed] = useState<number>(1); // 1 = running, 0 = paused
  const [playbookActive, setPlaybookActive] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"details" | "cascades" | "playbooks">("details");
  const [isCesiumLoaded, setIsCesiumLoaded] = useState<boolean>(false);
  const [clockTime, setClockTime] = useState<string>("");

  useEffect(() => {
    setClockTime(new Date().toTimeString().split(" ")[0]);
    const timer = setInterval(() => {
      setClockTime(new Date().toTimeString().split(" ")[0]);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Live coordinates overlay
  const [hoveredCoords, setHoveredCoords] = useState<{ lat: number; lon: number; alt: number; az: number }>({
    lat: CENTER_LAT,
    lon: CENTER_LON,
    alt: 145,
    az: 0
  });

  // Cascade failures countdowns
  const [coolingSecondsLeft, setCoolingSecondsLeft] = useState<number | null>(null);
  const [waterSecondsLeft, setWaterSecondsLeft] = useState<number | null>(null);

  // References for Cesium JS Viewer
  const cesiumContainerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  
  // Refs for tracking entities
  const nodeEntitiesRef = useRef<{ [id: string]: any }>({});
  const domeEntitiesRef = useRef<{ [id: string]: any }>({});
  const threatEntitiesRef = useRef<{ [id: string]: any }>({});
  const laserLinesRef = useRef<any[]>([]);

  // Ref to hold states for the frame rendering loops
  const simStateRef = useRef({
    deployedSystems,
    threats,
    simSpeed,
    nodes,
    selectedWeapon
  });

  useEffect(() => {
    simStateRef.current = {
      deployedSystems,
      threats,
      simSpeed,
      nodes,
      selectedWeapon
    };
  }, [deployedSystems, threats, simSpeed, nodes, selectedWeapon]);

  // Audio system oscillator beep
  const playBeep = useCallback((freq: number, type: OscillatorType, duration: number) => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn("Blocked Audio Context:", e);
    }
  }, [soundEnabled]);

  // Log append helper
  const addLog = useCallback((text: string, type: "info" | "success" | "warning" | "error" | "combat" = "info") => {
    const now = new Date();
    const timestamp = now.toTimeString().split(" ")[0];
    setLogs((prev) => {
      const next = [...prev, { timestamp, text, type }];
      if (next.length > 35) next.shift();
      return next;
    });

    if (type === "error") {
      playBeep(220, "sawtooth", 0.35);
      setTimeout(() => playBeep(180, "sawtooth", 0.25), 120);
    } else if (type === "warning") {
      playBeep(350, "sine", 0.2);
    } else if (type === "combat") {
      playBeep(880, "triangle", 0.08);
    } else if (type === "success") {
      playBeep(520, "sine", 0.15);
    } else {
      playBeep(440, "sine", 0.04);
    }
  }, [playBeep]);

  // ==========================================
  // 3. CASCADING ENGINE TIMERS
  // ==========================================

  useEffect(() => {
    const interval = setInterval(() => {
      if (simSpeed === 0) return;

      const nodeMap = { ...nodes.reduce((acc, n) => ({ ...acc, [n.id]: n }), {} as { [id: string]: CriticalNode }) };
      let changed = false;

      const elektrownia = nodeMap["OBJ_02"];
      const huta = nodeMap["OBJ_01"];
      const woda = nodeMap["OBJ_03"];

      // 1. Elektrownia fails -> impacts Huta & Ujęcie Wody pumps
      if (elektrownia.status === "DESTROYED" || elektrownia.status === "DEGRADED") {
        if (huta.health > 15) {
          const newHutaHealth = Math.max(15, huta.health - 5 * simSpeed);
          nodeMap["OBJ_01"] = {
            ...huta,
            health: newHutaHealth,
            status: "DEGRADED",
            notes: "KRYTYCZNE: Spadek zasilania! Awaryjne generatory podtrzymują piec na 15%."
          };
          changed = true;
          if (newHutaHealth === 15) {
            addLog("OBJ_01 (Huta Stalowa Wola): Utrata zasilania sieciowego ustabilizowana na 15% mocy.", "warning");
          }
        }

        if (woda.status === "OPERATIONAL" && waterSecondsLeft === null) {
          addLog("OBJ_03 (Ujęcie Wody): Pompy sieciowe odłączone z braku zasilania z Elektrowni! Rozpoczęto awaryjny drenaż rezerw (Zapas: 12h).", "error");
          setWaterSecondsLeft(12);
          changed = true;
        }
      }

      // Water reserve decay countdown
      if (waterSecondsLeft !== null && waterSecondsLeft > 0) {
        const nextTime = Math.max(0, waterSecondsLeft - 1 * simSpeed);
        setWaterSecondsLeft(nextTime);
        if (nextTime === 0) {
          nodeMap["OBJ_03"] = {
            ...woda,
            health: 0,
            status: "DESTROYED",
            notes: "ZATRZYMANIE PUMP: Zbiorniki rezerwowe puste. Brak wody do celów chłodniczych i komunalnych."
          };
          changed = true;
          addLog("OBJ_03 (Ujęcie Wody): CAŁKOWITY PARALIŻ - zbiorniki puste!", "error");
          setWaterSecondsLeft(null);
        }
      }

      // 2. Ujęcie wody fails -> cuts cooling to Elektrownia (feedback loop)
      if (woda.status === "DESTROYED" || woda.status === "DEGRADED") {
        if (elektrownia.status === "OPERATIONAL" && coolingSecondsLeft === null) {
          addLog("OBJ_02 (Elektrownia): Alarm wysokiej temperatury bloku gazowego! Odcięcie dopływu chłodziwa z Ujęcia MZK. Rozpoczęto sekwencję wygaszania (Czas: 6s).", "error");
          setCoolingSecondsLeft(6);
          changed = true;
        }
      }

      if (coolingSecondsLeft !== null && coolingSecondsLeft > 0) {
        const nextTime = Math.max(0, coolingSecondsLeft - 1 * simSpeed);
        setCoolingSecondsLeft(nextTime);
        if (nextTime === 0) {
          nodeMap["OBJ_02"] = {
            ...elektrownia,
            health: 0,
            status: "DESTROYED",
            notes: "WYLĄCZONA AWARYJNIE: Turbina odłączona w celu ochrony przed stopieniem reaktora."
          };
          changed = true;
          addLog("OBJ_02 (Elektrownia): BLOK ENERGETYCZNY WYGASZONY. Całkowity blackout Stalowej Woli!", "error");
          setCoolingSecondsLeft(null);
        }
      }

      // 3. GPZ Maziarnia fails -> cuts power to CZK
      const maziarnia = nodeMap["OBJ_04"];
      const czk = nodeMap["OBJ_07"];
      if (maziarnia.status === "DESTROYED" && czk.status === "OPERATIONAL") {
        nodeMap["OBJ_07"] = {
          ...czk,
          health: 40,
          status: "DEGRADED",
          notes: "AWARIA ZASILANIA: Sztab kryzysowy zasilany z UPS i radiostacji VHF."
        };
        changed = true;
        addLog("OBJ_07 (Centrum Kryzysowe): Utracono główne zasilanie sieci przesyłowej GPZ Maziarnia! Uruchomiono radiotelefony VHF.", "error");
      }

      if (changed) {
        const updatedNodes = nodes.map((n) => nodeMap[n.id] || n);
        setNodes(updatedNodes);

        // Update Cesium visual entities point color
        const Cesium = (window as any).Cesium;
        if (Cesium) {
          updatedNodes.forEach((node) => {
            const entity = nodeEntitiesRef.current[node.id];
            if (entity) {
              const colorStr = node.status === "OPERATIONAL" ? "#22c55e" : node.status === "DEGRADED" ? "#eab308" : "#ef4444";
              entity.point.color = Cesium.Color.fromCssColorString(colorStr);
            }
          });
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [nodes, simSpeed, coolingSecondsLeft, waterSecondsLeft, addLog]);

  // DEFCON state updates based on threats
  useEffect(() => {
    let targetDefcon = 5;
    const activeThreatCount = threats.filter((t) => t.status === "FLYING").length;
    const destroyedCount = nodes.filter((n) => n.status === "DESTROYED").length;

    if (destroyedCount >= 3) {
      targetDefcon = 1;
    } else if (destroyedCount >= 1 || activeThreatCount >= 3) {
      targetDefcon = 2;
    } else if (activeThreatCount >= 1) {
      targetDefcon = 3;
    } else if (deployedSystems.length > 0) {
      targetDefcon = 4;
    }

    if (targetDefcon !== defcon) {
      setDefcon(targetDefcon);
      addLog(`AKTUALIZACJA DEFCON: POZIOM ${targetDefcon}`, targetDefcon <= 2 ? "error" : targetDefcon === 3 ? "warning" : "info");
    }
  }, [threats, nodes, deployedSystems, defcon, addLog]);

  // ==========================================
  // 4. CESIUM VIEWER SETUP (EFFECT)
  // ==========================================

  useEffect(() => {
    const Cesium = (window as any).Cesium;
    if (!Cesium || !cesiumContainerRef.current) return;

    // ======================================================
    // CESIUM VIEWER — 100% TOKEN-FREE DARK TACTICAL MAP
    // ======================================================

    // Remove Cesium's broken default imagery (Bing needs token)
    const viewer = new Cesium.Viewer(cesiumContainerRef.current, {
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
      // NO terrain — flat globe, no Cesium Ion token needed
      terrain: undefined,
      imageryProvider: false as any // Disable default Bing imagery completely
    });

    viewerRef.current = viewer;
    setIsCesiumLoaded(true);

    // --- LIGHT BASEMAP: CartoDB Voyager (clean, light, with road labels) ---
    viewer.imageryLayers.addImageryProvider(
      new Cesium.UrlTemplateImageryProvider({
        url: "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
        credit: "CartoDB",
        maximumLevel: 19
      })
    );

    // --- SCENE: Light atmosphere with visible sky ---
    viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString("#e8e8e8");
    viewer.scene.skyAtmosphere.show = true;
    viewer.scene.fog.enabled = true;
    viewer.scene.globe.showGroundAtmosphere = true;
    viewer.scene.globe.enableLighting = false;

    // --- CAMERA: Scope to Stalowa Wola, tilted tactical view ---
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(CENTER_LON, CENTER_LAT - 0.018, 4500),
      orientation: {
        heading: Cesium.Math.toRadians(15.0),
        pitch: Cesium.Math.toRadians(-42.0),
        roll: 0.0
      }
    });

    // --- NODE TYPE COLORS (darker for light map visibility) ---
    const nodeColors: { [key: string]: string } = {
      industrial: "#0e7490",
      power: "#c2410c",
      water: "#1d4ed8",
      electrical: "#a16207",
      logistic: "#475569",
      transit: "#7c3aed",
      hq: "#047857"
    };

    // ======================================================
    // RENDER 7 STRATEGIC NODES WITH 3D BUILDINGS + LABELS
    // ======================================================
    INITIAL_NODES.forEach((node) => {
      const color = nodeColors[node.type] || "#16a34a";

      // --- 3D BUILDING MODEL per node type ---
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

      // Ground ring
      viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(node.lon, node.lat),
        ellipse: { semiMajorAxis: 100, semiMinorAxis: 100, material: Cesium.Color.fromCssColorString(color).withAlpha(0.1), outline: true, outlineColor: Cesium.Color.fromCssColorString(color).withAlpha(0.6), outlineWidth: 2, height: 0 }
      });

      // Top marker point + label (elevated above 3D model)
      const nodeEntity = viewer.entities.add({
        id: node.id,
        position: Cesium.Cartesian3.fromDegrees(node.lon, node.lat, 180),
        point: { pixelSize: 10, color: Cesium.Color.fromCssColorString(color), outlineColor: Cesium.Color.WHITE, outlineWidth: 2, disableDepthTestDistance: Number.POSITIVE_INFINITY },
        label: {
          text: node.name.toUpperCase(),
          font: "bold 11px Share Tech Mono, monospace",
          fillColor: Cesium.Color.fromCssColorString(color),
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineWidth: 4,
          outlineColor: Cesium.Color.WHITE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -14),
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
      });
      nodeEntitiesRef.current[node.id] = nodeEntity;

      // GPS sub-label
      viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(node.lon, node.lat, 180),
        label: {
          text: `[${node.id}] ${node.lat.toFixed(4)}°N ${node.lon.toFixed(4)}°E`,
          font: "9px JetBrains Mono, monospace",
          fillColor: Cesium.Color.fromCssColorString("#64748b"),
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineWidth: 3,
          outlineColor: Cesium.Color.WHITE,
          verticalOrigin: Cesium.VerticalOrigin.TOP,
          pixelOffset: new Cesium.Cartesian2(0, 6),
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
      });
    });

    // ======================================================
    // SAN RIVER — glowing neon path
    // ======================================================
    const riverCoordsArray = SAN_RIVER_COORDS.flatMap(c => [c.lon, c.lat]);
    // Outer wide glow
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
    // Inner bright core
    viewer.entities.add({
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArray(riverCoordsArray),
        width: 2.5,
        material: Cesium.Color.CYAN,
        clampToGround: true
      }
    });
    // River label
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

    // ======================================================
    // TACTICAL ZONE BOUNDARY RECTANGLE
    // ======================================================
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
    // Zone corners labels
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

    // Screen interaction handlers (raycasting coords under cursor)
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

    // Track mouse move coordinates for real-time telemetry HUD
    handler.setInputAction((movement: any) => {
      const cartesian = viewer.camera.pickEllipsoid(movement.endPosition, viewer.scene.globe.ellipsoid);
      if (cartesian) {
        const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        const lon = Cesium.Math.toDegrees(cartographic.longitude);
        const lat = Cesium.Math.toDegrees(cartographic.latitude);
        
        // Calculate camera height
        const cameraHeight = Math.round(viewer.camera.positionCartographic.height);
        
        setHoveredCoords({
          lat,
          lon,
          alt: cameraHeight,
          az: Math.round(Cesium.Math.toDegrees(viewer.camera.heading))
        });
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // LEFT CLICK: Deploy selected weapon dome system
    handler.setInputAction((click: any) => {
      const activeWeapon = simStateRef.current.selectedWeapon;
      if (!activeWeapon) return;

      const cartesian = viewer.camera.pickEllipsoid(click.position, viewer.scene.globe.ellipsoid);
      if (cartesian) {
        const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        const lon = Cesium.Math.toDegrees(cartographic.longitude);
        const lat = Cesium.Math.toDegrees(cartographic.latitude);

        // Grid boundaries to Stalowa Wola area
        if (lat < 50.51 || lat > 50.61 || lon < 22.01 || lon > 22.09) {
          addLog("DOWÓDZTWO: Lokacja poza dozwoloną strefą obronną miasta Stalowa Wola.", "error");
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

        // Add matching dome HEMISPHERE entity to Cesium 3D Viewport
        const domeEntity = viewer.entities.add({
          id: newSys.id,
          position: Cesium.Cartesian3.fromDegrees(lon, lat, 0),
          ellipsoid: {
            radii: new Cesium.Cartesian3(newSys.radius, newSys.radius, newSys.radius),
            material: Cesium.Color.fromCssColorString(newSys.color).withAlpha(0.08),
            outline: false,
            minimumCone: 0,
            maximumCone: Cesium.Math.PI_OVER_TWO // Only top hemisphere
          }
        });

        // Ground ring showing coverage area footprint
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

        // === 3D WEAPON TURRET / RADAR OBJECT AT CENTER ===
        // Base platform
        viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(lon, lat, 5),
          cylinder: {
            length: 10,
            topRadius: 12,
            bottomRadius: 14,
            material: Cesium.Color.fromCssColorString("#334155").withAlpha(0.9),
            outline: true,
            outlineColor: Cesium.Color.fromCssColorString(newSys.color)
          }
        });
        // Weapon mast / antenna tower
        viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(lon, lat, 30),
          cylinder: {
            length: 40,
            topRadius: 2,
            bottomRadius: 4,
            material: Cesium.Color.fromCssColorString("#64748b").withAlpha(0.9),
            outline: true,
            outlineColor: Cesium.Color.fromCssColorString(newSys.color)
          }
        });
        // Top sensor/weapon sphere
        viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(lon, lat, 55),
          ellipsoid: {
            radii: new Cesium.Cartesian3(6, 6, 6),
            material: Cesium.Color.fromCssColorString(newSys.color).withAlpha(0.85),
            outline: true,
            outlineColor: Cesium.Color.WHITE
          }
        });
        // System label
        viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(lon, lat, 70),
          label: {
            text: newSys.name,
            font: "bold 10px Share Tech Mono, monospace",
            fillColor: Cesium.Color.fromCssColorString(newSys.color),
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            outlineWidth: 3,
            outlineColor: Cesium.Color.WHITE,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -8),
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          }
        });
        domeEntitiesRef.current[newSys.id] = domeEntity;

        setDeployedSystems((prev) => [...prev, newSys]);
        setSelectedWeapon(null); // Clear selected weapon state
        
        addLog(`ZAINSTALOWANO SYSTEM: ${newSys.name} na pozycji GPS [${lat.toFixed(4)} N, ${lon.toFixed(4)} E]`, "success");
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // ==========================================
    // 5. REAL-TIME INTERCEPTION RENDERING LOOP
    // ==========================================
    let animationFrameId: number;

    const tick = () => {
      animationFrameId = requestAnimationFrame(tick);
      
      const speed = simStateRef.current.simSpeed;
      if (speed === 0) return; // Paused

      const activeThreats = [...simStateRef.current.threats].filter(t => t.status === "FLYING");
      const currentNodes = simStateRef.current.nodes;
      const systems = simStateRef.current.deployedSystems;

      // Clean up previous frame lasers
      laserLinesRef.current.forEach((line) => {
        viewer.entities.remove(line);
      });
      laserLinesRef.current = [];

      activeThreats.forEach((threat) => {
        const target = currentNodes.find(n => n.id === threat.targetId);
        if (!target) return;

        // Move threat GPS coordinates
        threat.progress += 0.003 * speed;
        
        if (threat.pathType === "RIVER") {
          // Slide along river coordinates
          const routeProgress = Math.min(1.0, threat.progress * 1.15);
          const pointsCount = SAN_RIVER_COORDS.length;
          
          if (routeProgress < 0.8) {
            // Traverse river nodes
            const rawIdx = routeProgress * 1.25 * (pointsCount - 1);
            const idx = Math.min(pointsCount - 2, Math.floor(rawIdx));
            const subProgress = rawIdx - idx;
            
            const startNode = SAN_RIVER_COORDS[idx];
            const endNode = SAN_RIVER_COORDS[idx + 1];
            
            threat.lat = startNode.lat + (endNode.lat - startNode.lat) * subProgress;
            threat.lon = startNode.lon + (endNode.lon - startNode.lon) * subProgress;
          } else {
            // Banking from river turn toward target node
            const lastRiverNode = SAN_RIVER_COORDS[pointsCount - 3];
            const bankProgress = (routeProgress - 0.8) / 0.2;
            
            threat.lat = lastRiverNode.lat + (target.lat - lastRiverNode.lat) * bankProgress;
            threat.lon = lastRiverNode.lon + (target.lon - lastRiverNode.lon) * bankProgress;
          }
        } else {
          // Direct straight flight path
          threat.lat = threat.startLat + (target.lat - threat.startLat) * Math.min(1.0, threat.progress);
          threat.lon = threat.startLon + (target.lon - threat.startLon) * Math.min(1.0, threat.progress);
        }

        // Draw threat billboard or point marker in 3D
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

        // Update threat 3D position in Cesium
        threatEntity.position = Cesium.Cartesian3.fromDegrees(threat.lon, threat.lat, threat.alt);

        // --- CHECK SYSTEM RANGE INTERCEPTIONS ---
        let interceptedThisFrame = false;
        const threatPos = Cesium.Cartesian3.fromDegrees(threat.lon, threat.lat, threat.alt);

        systems.forEach((sys) => {
          if (interceptedThisFrame) return;

          const sysPos = Cesium.Cartesian3.fromDegrees(sys.lon, sys.lat, 145);
          const distance = Cesium.Cartesian3.distance(sysPos, threatPos); // Real spatial distance in meters!

          // If threat inside sphere range
          if (distance <= sys.radius) {
            const pathConfig = THREAT_TYPES[threat.type];
            const activeMatch = sys.type === "PILICA" || (sys.type === "WRE" && !pathConfig.immuneToWRE);

            if (activeMatch) {
              // Fire interception laser polyline in 3D scene
              const laser = viewer.entities.add({
                polyline: {
                  positions: [sysPos, threatPos],
                  width: 3.0,
                  material: Cesium.Color.fromCssColorString(sys.type === "PILICA" ? "#ff4d4d" : "#3b82f6"),
                  disableDepthTestDistance: Number.POSITIVE_INFINITY
                }
              });
              laserLinesRef.current.push(laser);

              // Deduct health
              const dmg = sys.type === "PILICA" ? 0.9 : 2.5; // Jamming is faster
              threat.health -= dmg * speed;

              if (threat.health <= 0) {
                interceptedThisFrame = true;
                threat.status = sys.type === "PILICA" ? "INTERCEPTED" : "JAMMED";

                // Cleanup entity
                viewer.entities.remove(threatEntity);
                delete threatEntitiesRef.current[threat.id];

                // Sync state
                setThreats(prev => prev.map(t => t.id === threat.id ? { ...t, status: threat.status } : t));
                
                if (sys.type === "PILICA") {
                  addLog(`KINETYCZNE ZESTRZELEŃIE: PSR-A PILICA zneutralizował rakietami cel ${threat.name}!`, "combat");
                } else {
                  addLog(`ZAKŁÓCENIE WRE: Jammer zakłócił GPS cywilnego drona ${threat.name}. Spadek na ziemię!`, "combat");
                }
              }
            }
          }
        });

        // Bypassed defenses impact target object
        if (!interceptedThisFrame && threat.progress >= 1.0) {
          threat.status = "IMPACTED";
          
          viewer.entities.remove(threatEntity);
          delete threatEntitiesRef.current[threat.id];

          // Damage target node
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
          addLog(`IMPAKT NIEPRZYJACIELA: Obiekt ${target.name} uległ zniszczeniu przez ${threat.type}! Spadek sprawności do 0%!`, "error");
        }
      });
    };

    tick();

    return () => {
      cancelAnimationFrame(animationFrameId);
      handler.destroy();
      viewer.destroy();
    };
  }, [isCesiumLoaded, addLog]);

  // Reset core simulation
  const handleReset = () => {
    setNodes(INITIAL_NODES.map(n => ({ ...n })));
    setDeployedSystems([]);
    setThreats([]);
    setSelectedWeapon(null);
    setPlaybookActive(null);
    setCoolingSecondsLeft(null);
    setWaterSecondsLeft(null);

    const viewer = viewerRef.current;
    if (viewer) {
      // Clear domes
      Object.keys(domeEntitiesRef.current).forEach((key) => {
        viewer.entities.remove(domeEntitiesRef.current[key]);
      });
      domeEntitiesRef.current = {};

      // Clear threats
      Object.keys(threatEntitiesRef.current).forEach((key) => {
        viewer.entities.remove(threatEntitiesRef.current[key]);
      });
      threatEntitiesRef.current = {};

      // Reset markers color to operational green
      INITIAL_NODES.forEach((node) => {
        const entity = nodeEntitiesRef.current[node.id];
        const Cesium = (window as any).Cesium;
        if (entity && Cesium) {
          entity.point.color = Cesium.Color.fromCssColorString("#22c55e");
        }
      });
    }

    addLog("ZRESETOWANO SYSTEM I PRZESTRZEŃ TAKTYCZNĄ. OBIEKTY PRZYWRÓCONE DO SPRAWNOŚCI.", "success");
  };

  // ==========================================
  // 6. THREAT TRIGGERING ACTIONS
  // ==========================================

  const spawnThreat = useCallback((type: "DRONE" | "SHAHED" | "MISSILE", targetId: string) => {
    const tConfig = THREAT_TYPES[type];
    const target = nodes.find(n => n.id === targetId);
    if (!target) return;

    // Spawn point from eastern/northeast sector boundaries
    const startLat = CENTER_LAT - 0.04 + Math.random() * 0.08;
    const startLon = CENTER_LON + 0.08; // East boundary

    const threatId = `THR_${Date.now()}_${Math.floor(Math.random() * 100)}`;
    const newThreat: Threat = {
      id: threatId,
      type,
      name: `${type === "MISSILE" ? "RAKIETA" : type === "SHAHED" ? "SHAHED" : "DRON"} #${threatId.slice(-3)}`,
      startLat,
      startLon,
      lat: startLat,
      lon: startLon,
      alt: tConfig.alt,
      targetId,
      pathType: type === "SHAHED" ? "RIVER" : "DIRECT",
      progress: 0,
      status: "FLYING",
      health: 100
    };

    setThreats((prev) => [...prev, newThreat]);
    addLog(`WYKRYTO ECHO RADAROWE: Zbliża się ${newThreat.name} ➡️ Cel: ${target.name}!`, "error");
    playBeep(580, "sawtooth", 0.3);
  }, [nodes, addLog, playBeep]);

  const launchScenario = (index: number) => {
    if (index === 1) {
      addLog("ROZPOCZĘTO SCENARIUSZ: Swarm of commercial recon drones on HSW & GPZ.", "warning");
      spawnThreat("DRONE", "OBJ_01");
      setTimeout(() => spawnThreat("DRONE", "OBJ_04"), 1500);
      setTimeout(() => spawnThreat("DRONE", "OBJ_03"), 3000);
    } else if (index === 2) {
      addLog("ROZPOCZĘTO SCENARIUSZ: Amunicja Shahed-136 ukrywa się w korycie Sanu.", "warning");
      spawnThreat("SHAHED", "OBJ_02");
      setTimeout(() => spawnThreat("SHAHED", "OBJ_06"), 2000);
    } else if (index === 3) {
      addLog("ROZPOCZĘTO SCENARIUSZ: Taktyczny pocisk rakietowy zmierza w kierunku HSW S.A.", "warning");
      spawnThreat("MISSILE", "OBJ_01");
    } else if (index === 4) {
      addLog("ROZPOCZĘTO SCENARIUSZ: Zmasowany nalot saturacyjny na sieć energetyczną.", "warning");
      spawnThreat("MISSILE", "OBJ_02");
      setTimeout(() => spawnThreat("SHAHED", "OBJ_04"), 2000);
      setTimeout(() => spawnThreat("DRONE", "OBJ_03"), 3500);
    }
  };

  const activatePlaybook = (id: string, name: string) => {
    setPlaybookActive(id);
    addLog(`DOWÓDZTWO: Uruchomiono alarmową procedurę ${name}`, "success");
    
    if (id === "ALERT_SMS") {
      addLog("RCB BROADCAST: Rozesłano kryzysowy komunikat SMS do mieszkańców powiatu Stalowa Wola.", "info");
      playBeep(480, "sine", 0.5);
    } else if (id === "SIREN") {
      addLog("OBRONA CYWILNA: Miejskie syreny akustyczne nadają sygnał alarmowy modulowany (Zagrożenie napowietrzne).", "warning");
      playBeep(320, "sawtooth", 1.2);
    } else if (id === "BACKUP_GEN") {
      addLog("SIECI ROZDZIELCZE: Wymuszono załączenie rezerwowych agregatów we wszystkich 7 obiektach.", "success");
      setNodes(prev => prev.map(n => ({
        ...n,
        backupPower: true,
        notes: n.notes + " (Generatory aktywowane ręcznie z sztabu)"
      })));
    }
  };

  // ==========================================
  // 7. HTML/JSX RENDERING INTERFACE
  // ==========================================
  return (
    <div className="flex flex-col flex-1 h-screen relative select-none">
      {/* Header HUD */}
      <header className="fixed top-0 left-0 w-full z-[60] flex justify-between items-center px-4 h-12 border-b border-slate-800 bg-slate-950 font-rajdhani">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-500 animate-pulse" />
            <span className="font-extrabold tracking-widest text-[14px] text-cyan-500">STEEL SENTINEL</span>
            <span className="text-[9px] bg-slate-800 border border-slate-700 px-1.5 py-0.5 text-slate-400 font-mono tracking-normal">
              CESIUM_COP v4.0.2
            </span>
          </div>

          <div className="hidden md:flex items-center gap-4 border-l border-slate-800 pl-6 h-8 text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-slate-500" />
              <span>STALOWA WOLA DIGITAL TWIN / REAL 3D GIS</span>
            </div>
          </div>
        </div>

        {/* Tactical controls */}
        <div className="flex items-center gap-4 font-mono">
          {/* DEFCON Box */}
          <div className={`flex items-center gap-2 px-3 py-1 border transition-all ${
            defcon === 1 
              ? "border-red-600 bg-red-950/20 text-red-500 animate-pulse font-bold" 
              : defcon === 2 
              ? "border-orange-500 bg-orange-950/20 text-orange-500 animate-pulse" 
              : defcon === 3 
              ? "border-amber-400 bg-amber-900/10 text-amber-400" 
              : "border-emerald-500 bg-emerald-950/10 text-emerald-400"
          }`}>
            <span className="text-[10px] font-bold tracking-widest">DEFCON {defcon}</span>
            <span className={`w-2 h-2 rounded-full ${
              defcon === 1 ? "bg-red-500" : defcon === 2 ? "bg-orange-500" : defcon === 3 ? "bg-amber-400" : "bg-emerald-500"
            }`} />
          </div>

          {/* Clock */}
          <div className="text-[11px] text-slate-400 tabular-nums border-l border-slate-800 pl-4 h-12 flex items-center">
            {clockTime || "--:--:--"} UTC
          </div>

          {/* Mute toggle */}
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              addLog(`DŹWIĘKI SYSTEMOWE: ${!soundEnabled ? "WŁĄCZONE" : "WYŁĄCZONE"}`, "info");
            }}
            className={`p-1.5 border transition-all flex items-center justify-center hover:bg-slate-900 ${
              soundEnabled ? "border-cyan-500 text-cyan-400 bg-cyan-950/10" : "border-slate-800 text-slate-500"
            }`}
            title="Włącz/Wyłącz sygnały dźwiękowe"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Alert Ribbon Ticker */}
      <div className="fixed top-12 left-0 w-full h-6 bg-slate-900 border-b border-slate-800 z-[55] flex items-center font-mono">
        <div className="bg-slate-800 px-3 h-full flex items-center text-[9px] text-slate-300 font-bold border-r border-slate-700 font-rajdhani tracking-wider">
          TACTICAL FEED
        </div>
        <div className="ticker-wrap flex-1">
          <div className="ticker text-[10px] text-slate-400 py-1 font-sharetech select-none">
            {threats.filter(t => t.status === "FLYING").length > 0 ? (
              <span className="text-red-500 animate-pulse font-bold">
                ⚠️ ALARM BOJOWY: WYKRYTO ZBLIŻAJĄCE SIĘ POCISKI I DRONY NIEPRZYJACIELA !!! STREFA OBRONY PILICA PRZECHODZI W TRYB STRZELANIA OSTRĄ AMUNICJĄ...
              </span>
            ) : (
              <span>
                SAT FEED: STALOWA WOLA NOMINALNA /// HUTA STALOWA WOLA S.A. SPRAWNA /// GPZ MAZIARNIA TRANZYTUJE PRĄD BEZ ZAKŁÓCEŃ /// MOST SAN DRĄŻONY RADARAMI /// CESIUM 3D TERRAIN RENDERER AKTYWNY
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3D Map Viewport container (Cesium JS canvas) */}
      <main className="fixed inset-0 pt-[72px] z-10 bg-slate-950">
        <div 
          ref={cesiumContainerRef} 
          className="w-full h-full cursor-crosshair relative"
        />
        


        {/* Floating tactical sector tags */}
        <div className="absolute top-6 left-6 pointer-events-none z-30 font-mono text-slate-500 flex flex-col gap-1 border border-slate-850 bg-slate-950/90 p-2.5 clip-chamfer">
          <div className="text-[9px] text-slate-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-500 animate-pulse" />
            <span>CESIUM_GIS_LINK</span>
          </div>
          <div className="font-bold text-[10px] text-slate-300">STW_GRID: 3D TERRAIN ACTIVE</div>
        </div>
      </main>

      {/* ==========================================
          LEFT SIDEBAR: INFRASTRUCTURE & CASCADES
          ========================================== */}
      <aside className="fixed left-4 top-20 w-80 h-[calc(100vh-230px)] z-40 flex flex-col gap-3 font-mono bg-slate-950/90 border border-slate-800/80 p-3 clip-chamfer text-[11px] shadow-2xl backdrop-blur-md">
        
        {/* Sidebar tabs navigation */}
        <div className="grid grid-cols-3 border-b border-slate-800 pb-1 text-slate-400 font-rajdhani font-semibold">
          <button 
            onClick={() => setActiveTab("details")}
            className={`pb-1 text-center border-b transition-all ${activeTab === "details" ? "text-cyan-400 border-cyan-400" : "border-transparent hover:text-slate-200"}`}
          >
            SZCZEGÓŁY
          </button>
          <button 
            onClick={() => setActiveTab("cascades")}
            className={`pb-1 text-center border-b transition-all flex items-center justify-center gap-1 ${activeTab === "cascades" ? "text-cyan-400 border-cyan-400" : "border-transparent hover:text-slate-200"}`}
          >
            KASKADY
            {(coolingSecondsLeft !== null || waterSecondsLeft !== null) && (
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
            )}
          </button>
          <button 
            onClick={() => setActiveTab("playbooks")}
            className={`pb-1 text-center border-b transition-all ${activeTab === "playbooks" ? "text-cyan-400 border-cyan-400" : "border-transparent hover:text-slate-200"}`}
          >
            ALERT_CMD
          </button>
        </div>

        {/* Tab 1: Nodes list */}
        {activeTab === "details" && (
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 terminal-scroll">
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-rajdhani tracking-wider pb-1 border-b border-slate-900">
              <span>WĘZŁY INFRASTRUKTURY</span>
              <span>{nodes.filter(n => n.status === "OPERATIONAL").length}/07 NOMINAL</span>
            </div>

            <div className="space-y-1.5">
              {nodes.map((node) => (
                <div
                  key={node.id}
                  onClick={() => {
                    // Fly Cesium camera to focus object coordinates
                    const viewer = viewerRef.current;
                    const Cesium = (window as any).Cesium;
                    if (viewer && Cesium) {
                      viewer.camera.flyTo({
                        destination: Cesium.Cartesian3.fromDegrees(node.lon, node.lat - 0.012, 1000), // closer view
                        orientation: {
                          heading: Cesium.Math.toRadians(0.0),
                          pitch: Cesium.Math.toRadians(-35.0),
                          roll: 0.0
                        }
                      });
                      addLog(`KAMERA: Skupiono widok 3D na ${node.name}`, "info");
                    }
                  }}
                  className={`border p-2 cursor-pointer transition-all hover:bg-slate-900/50 flex flex-col gap-1 ${
                    node.status === "DESTROYED" 
                      ? "border-red-950 bg-red-950/10 text-red-400" 
                      : node.status === "DEGRADED"
                      ? "border-amber-900/60 bg-amber-900/5 text-amber-300"
                      : "border-slate-800/80 bg-slate-950 text-slate-300"
                  }`}
                >
                  <div className="flex justify-between items-center font-bold">
                    <div className="flex items-center gap-1.5">
                      {node.type === "power" && <Zap className="w-3.5 h-3.5 text-cyan-500" />}
                      {node.type === "water" && <Droplet className="w-3.5 h-3.5 text-blue-500" />}
                      {node.type === "industrial" && <Flame className="w-3.5 h-3.5 text-orange-500" />}
                      {node.type === "electrical" && <Wifi className="w-3.5 h-3.5 text-cyan-400" />}
                      {node.type === "logistic" && <Network className="w-3.5 h-3.5 text-slate-400" />}
                      {node.type === "transit" && <Navigation className="w-3.5 h-3.5 text-slate-450" />}
                      {node.type === "hq" && <Shield className="w-3.5 h-3.5 text-emerald-500" />}
                      <span className="text-[11px] truncate font-rajdhani">{node.name}</span>
                    </div>
                    <span className={`text-[9px] px-1 font-bold ${
                      node.status === "OPERATIONAL" ? "text-emerald-400" : node.status === "DEGRADED" ? "text-amber-400" : "text-red-500"
                    }`}>
                      {node.status}
                    </span>
                  </div>

                  <p className="text-[9px] text-slate-400 leading-tight">
                    {node.description}
                  </p>

                  <div className="mt-1">
                    <div className="flex justify-between text-[8px] text-slate-500 mb-0.5 font-sharetech">
                      <span>FIZYCZNA SPRAWNOŚĆ</span>
                      <span>{Math.round(node.health)}%</span>
                    </div>
                    <div className="h-1 bg-slate-900 border border-slate-800">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          node.health > 50 ? "bg-emerald-500" : node.health > 15 ? "bg-amber-500" : "bg-red-500"
                        }`}
                        style={{ width: `${node.health}%` }}
                      />
                    </div>
                  </div>

                  {node.notes && (
                    <span className="text-[8px] text-slate-400/80 mt-1 italic leading-tight block border-t border-slate-900 pt-1">
                      {node.notes}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Dependency Cascades Graph */}
        {activeTab === "cascades" && (
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 terminal-scroll flex flex-col">
            <div className="text-[10px] text-slate-400 font-rajdhani tracking-wider pb-1 border-b border-slate-900">
              <span>GRAF ZALEŻNOŚCI MIĘDZYWĘZŁOWYCH</span>
            </div>

            {/* Timers list */}
            {(coolingSecondsLeft !== null || waterSecondsLeft !== null) && (
              <div className="bg-red-950/20 border border-red-800 p-2 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-red-500 font-bold">
                  <AlertTriangle className="w-4 h-4 animate-ping" />
                  <span>AKTYWNE ODPOWIEDZI KASKADOWE:</span>
                </div>
                {waterSecondsLeft !== null && (
                  <div className="text-[10px] text-red-400 flex justify-between">
                    <span>Pompy Ujęcia MZK stają za:</span>
                    <span className="font-bold text-red-500 animate-pulse">{waterSecondsLeft}h</span>
                  </div>
                )}
                {coolingSecondsLeft !== null && (
                  <div className="text-[10px] text-red-400 flex justify-between">
                    <span>Wyłączenie bloku Elektrowni za:</span>
                    <span className="font-bold text-red-500 animate-pulse">{coolingSecondsLeft}h</span>
                  </div>
                )}
              </div>
            )}

            {/* Tactical SVG network dependency graph */}
            <div className="h-44 bg-slate-950 border border-slate-800 flex flex-col relative justify-center items-center overflow-hidden">
              <span className="absolute top-1 left-1 text-[8px] text-slate-500 font-mono">NET_DEPENDENCY_COP</span>
              
              <svg className="w-full h-full" viewBox="0 0 280 160">
                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 2 L 10 5 L 0 8 z" fill="#64748b" />
                  </marker>
                  <marker id="arrow-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 2 L 10 5 L 0 8 z" fill="#22c55e" />
                  </marker>
                  <marker id="arrow-red" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 2 L 10 5 L 0 8 z" fill="#ef4444" />
                  </marker>
                </defs>

                {/* Draw arrows */}
                {/* Elektrownia -> Huta */}
                <path 
                  d="M 120,40 L 70,80" 
                  stroke={nodes[1].status === "DESTROYED" ? "#ef4444" : "#22c55e"} 
                  strokeWidth="1.5" 
                  strokeDasharray={nodes[1].status === "DESTROYED" ? "3" : "none"} 
                  markerEnd={nodes[1].status === "DESTROYED" ? "url(#arrow-red)" : "url(#arrow-green)"}
                />
                
                {/* Elektrownia -> Ujęcie Wody */}
                <path 
                  d="M 120,40 L 190,40" 
                  stroke={nodes[1].status === "DESTROYED" ? "#ef4444" : "#22c55e"} 
                  strokeWidth="1.5" 
                  strokeDasharray={nodes[1].status === "DESTROYED" ? "3" : "none"}
                  markerEnd={nodes[1].status === "DESTROYED" ? "url(#arrow-red)" : "url(#arrow-green)"}
                />

                {/* Ujęcie Wody -> Elektrownia (Cooling feedback loop) */}
                <path 
                  d="M 190,50 L 120,50" 
                  stroke={nodes[2].status === "DESTROYED" ? "#ef4444" : "#22c55e"} 
                  strokeWidth="1.5" 
                  strokeDasharray={nodes[2].status === "DESTROYED" ? "3" : "none"}
                  markerEnd={nodes[2].status === "DESTROYED" ? "url(#arrow-red)" : "url(#arrow-green)"}
                />

                {/* GPZ Maziarnia -> Centrum Kryzysowe */}
                <path 
                  d="M 210,105 L 140,105" 
                  stroke={nodes[3].status === "DESTROYED" ? "#ef4444" : "#22c55e"} 
                  strokeWidth="1.5" 
                  strokeDasharray={nodes[3].status === "DESTROYED" ? "3" : "none"}
                  markerEnd={nodes[3].status === "DESTROYED" ? "url(#arrow-red)" : "url(#arrow-green)"}
                />

                {/* Node graphics */}
                <g transform="translate(120,45)">
                  <circle r="12" fill="#020617" stroke={nodes[1].status === "DESTROYED" ? "#ef4444" : nodes[1].status === "DEGRADED" ? "#eab308" : "#22c55e"} strokeWidth="2" />
                  <text textAnchor="middle" dy="4" fill="#cbd5e1" fontSize="8" fontWeight="bold">E2</text>
                </g>

                <g transform="translate(60,85)">
                  <circle r="12" fill="#020617" stroke={nodes[0].status === "DESTROYED" ? "#ef4444" : nodes[0].status === "DEGRADED" ? "#eab308" : "#22c55e"} strokeWidth="2" />
                  <text textAnchor="middle" dy="4" fill="#cbd5e1" fontSize="8" fontWeight="bold">H1</text>
                </g>

                <g transform="translate(200,45)">
                  <circle r="12" fill="#020617" stroke={nodes[2].status === "DESTROYED" ? "#ef4444" : nodes[2].status === "DEGRADED" ? "#eab308" : "#22c55e"} strokeWidth="2" />
                  <text textAnchor="middle" dy="4" fill="#cbd5e1" fontSize="8" fontWeight="bold">W3</text>
                </g>

                <g transform="translate(220,105)">
                  <circle r="12" fill="#020617" stroke={nodes[3].status === "DESTROYED" ? "#ef4444" : nodes[3].status === "DEGRADED" ? "#eab308" : "#22c55e"} strokeWidth="2" />
                  <text textAnchor="middle" dy="4" fill="#cbd5e1" fontSize="8" fontWeight="bold">G4</text>
                </g>

                <g transform="translate(130,105)">
                  <circle r="12" fill="#020617" stroke={nodes[6].status === "DESTROYED" ? "#ef4444" : nodes[6].status === "DEGRADED" ? "#eab308" : "#22c55e"} strokeWidth="2" />
                  <text textAnchor="middle" dy="4" fill="#cbd5e1" fontSize="8" fontWeight="bold">K7</text>
                </g>
              </svg>
            </div>

            <div className="flex-1 space-y-1.5 text-[9px] leading-tight text-slate-400">
              <div className="border border-slate-900 p-1.5 bg-slate-900/10">
                <span className="font-bold text-slate-300">Elektrownia (E2) ➡️ Huta HSW (H1):</span>
                <p>Utrata zasilania Pieców Hutniczych. Generatory podtrzymują minimalne dogrzanie blach (15% mocy).</p>
              </div>

              <div className="border border-slate-900 p-1.5 bg-slate-900/10">
                <span className="font-bold text-slate-300">Pętla sprzężenia chłodzenia (W3) 🔄 (E2):</span>
                <p>Wodociągi (W3) dostarczają wodę chłodzącą do Elektrowni (E2). Jej odcięcie wygasza blok turbin w 2h. Z kolei brak zasilania z E2 odcina pompy w W3 (bufor zapasów w zbiornikach: 12h).</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Command playbooks */}
        {activeTab === "playbooks" && (
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 terminal-scroll">
            <div className="text-[10px] text-slate-400 font-rajdhani tracking-wider pb-1 border-b border-slate-900">
              <span>PROCEDURY BEZPIECZEŃSTWA (PLAYBOOKS)</span>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => activatePlaybook("SIREN", "Miejski Alarm Akustyczny Syren")}
                className="w-full text-left py-2 px-3 border border-amber-500/60 bg-amber-500/5 hover:bg-amber-500/10 text-amber-400 transition-all font-rajdhani font-semibold flex items-center justify-between"
              >
                <span>🚨 SYRENY ALARMOWE</span>
                <span className="text-[8px] bg-amber-500/20 px-1 border border-amber-500/30">ODPAL</span>
              </button>

              <button
                onClick={() => activatePlaybook("ALERT_SMS", "Ogólnokrajowy System SMS RCB")}
                className="w-full text-left py-2 px-3 border border-cyan-500/60 bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-400 transition-all font-rajdhani font-semibold flex items-center justify-between"
              >
                <span>📱 ALERTY SMS RCB</span>
                <span className="text-[8px] bg-cyan-500/20 px-1 border border-cyan-500/30">ODPAL</span>
              </button>

              <button
                onClick={() => activatePlaybook("BACKUP_GEN", "Włączenie Agregatów Przemysłowych")}
                className="w-full text-left py-2 px-3 border border-emerald-500/60 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 transition-all font-rajdhani font-semibold flex items-center justify-between"
              >
                <span>⚡ START GENERATORÓW</span>
                <span className="text-[8px] bg-emerald-500/20 px-1 border border-emerald-500/30">ODPAL</span>
              </button>
            </div>

            {playbookActive && (
              <div className="mt-4 p-2 bg-slate-900 border border-slate-800 text-[10px] text-cyan-400">
                <div className="flex justify-between items-center font-bold mb-1 border-b border-slate-800 pb-1">
                  <span>PROCEDURA W TOKU</span>
                  <button onClick={() => setPlaybookActive(null)} className="text-red-500 hover:text-red-450">STOP</button>
                </div>
                <span className="text-slate-350 font-sharetech italic">
                  {playbookActive === "SIREN" && "Nadawanie miejskiego ostrzeżenia dźwiękowego. Ludność skierowana do schronów."}
                  {playbookActive === "ALERT_SMS" && "SMS RCB wysłany w strefie Stalowej Woli o trasie ataku korytem rzeki San."}
                  {playbookActive === "BACKUP_GEN" && "Agregaty generatorów Huty i stacji pomp podtrzymują krytyczny przesył."}
                </span>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* ==========================================
          RIGHT SIDEBAR: ARSENAL & TEST SCENARIOS
          ========================================== */}
      <aside className="fixed right-4 top-20 w-80 h-[calc(100vh-230px)] z-40 flex flex-col gap-3 font-mono bg-slate-950/90 border border-slate-800/80 p-3 clip-chamfer text-[11px] shadow-2xl backdrop-blur-md">
        
        {/* Arsenal selection */}
        <div className="flex flex-col gap-1.5 flex-1">
          <div className="text-[10px] text-slate-400 font-rajdhani tracking-wider pb-1 border-b border-slate-900 flex justify-between items-center">
            <span>ARSENAŁ DEFENSYWNY (KLIKNIJ I ROZSTAW)</span>
            <span className="text-[9px] text-slate-500">3D COVERS</span>
          </div>

          <p className="text-[9px] text-slate-400 leading-tight">
            Wybierz broń, a następnie **kliknij na mapę 3D Cesium** w rejonie Stalowej Woli, aby rozciągnąć półprzezroczystą sferę przechwytującą.
          </p>

          <div className="space-y-2 mt-1.5">
            {WEAPONS.map((weap) => {
              const count = deployedSystems.filter((s) => s.type === weap.type).length;
              const isSelected = selectedWeapon === weap.type;
              return (
                <div
                  key={weap.type}
                  onClick={() => {
                    setSelectedWeapon(isSelected ? null : weap.type);
                    addLog(`DOWÓDZTWO: Wybrano ${weap.name} do instalacji. Wskaż punkt na mapie 3D.`, "info");
                  }}
                  className={`border p-2.5 cursor-pointer transition-all hover:bg-slate-900/60 flex flex-col gap-1 relative ${
                    isSelected 
                      ? "border-cyan-500 bg-cyan-950/20 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]" 
                      : "border-slate-800/80 bg-slate-950 text-slate-300"
                  }`}
                >
                  {count > 0 && (
                    <span className="absolute top-2 right-2 text-[8px] bg-slate-850 border border-slate-750 text-slate-300 px-1 py-0.5">
                      AKTYWNE: {count}
                    </span>
                  )}

                  <div className="flex items-center gap-1.5 font-bold font-rajdhani text-[12px]">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: weap.color }} />
                    <span>{weap.name}</span>
                  </div>

                  <p className="text-[9px] text-slate-400 leading-tight mt-0.5">
                    {weap.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mt-1 font-sharetech text-[8px] text-slate-400">
                    <span className="bg-slate-900 px-1 border border-slate-850">Zasięg: {weap.range}m ({weap.range / 1000}km)</span>
                    <span className="bg-slate-900 px-1 border border-slate-850">Cele: {weap.threatsCovered.join(", ")}</span>
                  </div>

                  {isSelected && (
                    <div className="mt-2 text-[8px] bg-cyan-950/50 border border-cyan-800 text-cyan-400 flex items-center gap-1 animate-pulse font-bold">
                      <Crosshair className="w-3.5 h-3.5" />
                      <span>TRYB CELOWANIA AKTYWNY: KLIKNIJ NA MAPĘ</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Attack scenarios triggering */}
        <div className="border-t border-slate-900 pt-2.5 flex flex-col gap-1.5">
          <div className="text-[10px] text-slate-400 font-rajdhani tracking-wider pb-1 border-b border-slate-900 flex justify-between items-center">
            <span>SYMULACJA ZAGROŻEŃ POWIETRZNYCH</span>
            <span className="text-[8px] text-red-500 font-bold">LIVE STRIKE</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => launchScenario(1)}
              className="py-1.5 px-2 border border-slate-800 hover:border-amber-500/60 hover:bg-slate-900 text-[9px] font-semibold text-slate-350 font-rajdhani text-left flex flex-col justify-between"
            >
              <span className="text-slate-500 text-[7px]">SCEN_01 // CYWILNY RÓJ</span>
              <span>Inwazja dronów cywilnych</span>
            </button>
            <button
              onClick={() => launchScenario(2)}
              className="py-1.5 px-2 border border-slate-800 hover:border-amber-500/60 hover:bg-slate-900 text-[9px] font-semibold text-slate-355 font-rajdhani text-left flex flex-col justify-between"
            >
              <span className="text-slate-500 text-[7px]">SCEN_02 // SHAHED RZEKA</span>
              <span>Zasłona korytem Sanu</span>
            </button>
            <button
              onClick={() => launchScenario(3)}
              className="py-1.5 px-2 border border-slate-800 hover:border-red-500/60 hover:bg-slate-900 text-[9px] font-semibold text-slate-350 font-rajdhani text-left flex flex-col justify-between"
            >
              <span className="text-slate-500 text-[7px]">SCEN_03 // RAKIETA TAKT.</span>
              <span>Wysoka prędkość rakiety</span>
            </button>
            <button
              onClick={() => launchScenario(4)}
              className="py-1.5 px-2 border border-slate-800 hover:border-red-500/60 hover:bg-slate-900 text-[9px] font-semibold text-slate-350 font-rajdhani text-left flex flex-col justify-between"
            >
              <span className="text-slate-500 text-[7px]">SCEN_04 // CZAS KASKADY</span>
              <span>Kombinowany zmasowany atak</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 mt-1 border-t border-slate-900 pt-2">
            <button
              onClick={handleReset}
              className="py-1.5 px-2 bg-slate-900 border border-slate-800 text-[9px] text-slate-300 hover:bg-slate-800 flex items-center justify-center gap-1 font-semibold font-rajdhani"
            >
              <RefreshCw className="w-3 h-3 text-slate-400" />
              RESET SYSTEMU
            </button>

            <button
              onClick={() => {
                setSimSpeed(simSpeed === 0 ? 1 : 0);
                addLog(`SYMULATOR: ${simSpeed === 0 ? "WZNOWIONY" : "WSTRZYMANY"}`, "info");
              }}
              className={`py-1.5 px-2 border text-[9px] font-semibold font-rajdhani flex items-center justify-center gap-1 ${
                simSpeed === 0 ? "border-amber-500 bg-amber-950/20 text-amber-400 animate-pulse" : "border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800"
              }`}
            >
              {simSpeed === 0 ? <Play className="w-3 h-3 text-amber-400" /> : <Pause className="w-3 h-3 text-slate-400" />}
              {simSpeed === 0 ? "WZNÓW SIM" : "PAUZA SIM"}
            </button>
          </div>
        </div>
      </aside>

      {/* ==========================================
          BOTTOM LEFT: MONITOR ACTIVE THREATS
          ========================================== */}
      <section className="fixed left-4 bottom-4 w-80 h-36 z-40 font-mono bg-slate-950/90 border border-slate-800/80 p-3 clip-chamfer text-[11px] shadow-2xl backdrop-blur-md flex flex-col">
        <div className="text-[10px] text-slate-400 font-rajdhani tracking-wider pb-1 border-b border-slate-900 flex justify-between items-center mb-1">
          <span>MONITOR WYKRYWANIA RADAROWEGO</span>
          <span className="text-[9px] bg-red-950/20 px-1 border border-red-550/40 text-red-500 font-bold font-sharetech">
            {threats.filter(t => t.status === "FLYING").length} ECHO CELE
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 pr-1 terminal-scroll">
          {threats.length === 0 ? (
            <div className="h-full flex items-center justify-center text-[10px] text-slate-600 font-sharetech italic select-none">
              BRAK AKTYWNYCH ECH W ZAKRESIE RADAROWYM
            </div>
          ) : (
            [...threats].reverse().map((threat) => {
              const targetNode = nodes.find(n => n.id === threat.targetId);
              return (
                <div 
                  key={threat.id}
                  className={`p-1.5 border flex items-center justify-between ${
                    threat.status === "FLYING"
                      ? "border-red-950 bg-red-950/10 text-red-400"
                      : threat.status === "INTERCEPTED"
                      ? "border-emerald-950 bg-emerald-950/10 text-emerald-400 font-semibold"
                      : threat.status === "JAMMED"
                      ? "border-blue-950 bg-blue-950/10 text-blue-400"
                      : "border-slate-900 bg-slate-900/50 text-slate-550 line-through"
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-[9px] font-sharetech">
                      {threat.name} ({threat.type})
                    </span>
                    <span className="text-[8px] text-slate-400/80">
                      Zmierza ku: {targetNode?.name || "Nieznany"}
                    </span>
                  </div>

                  <span className="text-[9px] font-bold font-rajdhani px-1 py-0.5">
                    {threat.status === "FLYING" && "AKTYWNY"}
                    {threat.status === "INTERCEPTED" && "ZESTRZELONY"}
                    {threat.status === "JAMMED" && "ZAKŁÓCONY"}
                    {threat.status === "IMPACTED" && "TRAFIENIE"}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* ==========================================
          BOTTOM RIGHT: COMMAND LOGGER CONSOLE
          ========================================== */}
      <section className="fixed right-4 bottom-4 w-96 h-36 z-40 font-mono bg-slate-950/95 border border-slate-800/80 p-3 clip-chamfer text-[11px] shadow-2xl backdrop-blur-md flex flex-col">
        <div className="text-[10px] text-slate-400 font-rajdhani tracking-wider pb-1 border-b border-slate-900 flex justify-between items-center mb-1">
          <span>KONSOLA ZDARZEŃ BOJOWYCH I ALARMOWYCH</span>
          <span className="text-[8px] text-slate-500 font-sharetech">SECURE FEED // STW_COP</span>
        </div>

        <div className="flex-1 overflow-y-auto text-[10px] leading-relaxed text-slate-400 space-y-1 terminal-scroll pr-1 font-sharetech">
          {logs.map((log, idx) => (
            <div key={idx} className="flex gap-2">
              <span className="text-cyan-500/80 font-bold">[{log.timestamp}]</span>
              <span className={`flex-1 ${
                log.type === "error" 
                  ? "text-red-500 font-bold" 
                  : log.type === "warning" 
                  ? "text-amber-400" 
                  : log.type === "success" 
                  ? "text-emerald-400 font-semibold" 
                  : log.type === "combat"
                  ? "text-red-400 font-bold tracking-wide"
                  : "text-slate-300"
              }`}>
                {log.text}
              </span>
            </div>
          ))}
          <div className="flex gap-2">
            <span className="text-cyan-500/80 font-bold">[{clockTime || "--:--:--"}]</span>
            <span className="w-1.5 h-3 bg-cyan-400 animate-pulse" />
          </div>
        </div>
      </section>

      {/* ==========================================
          BOTTOM CENTER: TACTICAL TELEMETRY HUD
          ========================================== */}
      <footer className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 px-6 py-2 bg-slate-950/90 border border-slate-850 flex gap-6 text-[10px] font-mono shadow-2xl backdrop-blur-md clip-chamfer text-slate-400">
        <div className="flex flex-col">
          <span className="text-slate-500 text-[8px] font-bold font-rajdhani tracking-wider">CESIUM COORDINATES</span>
          <span className="text-cyan-400 font-bold tabular-nums">
            {hoveredCoords.lat.toFixed(6)}° N / {hoveredCoords.lon.toFixed(6)}° E
          </span>
        </div>

        <div className="flex flex-col border-l border-slate-800 pl-6">
          <span className="text-slate-500 text-[8px] font-bold font-rajdhani tracking-wider">ALTITUDE (EYE)</span>
          <span className="text-slate-300 font-sharetech font-semibold tabular-nums">{hoveredCoords.alt} m</span>
        </div>

        <div className="flex flex-col border-l border-slate-800 pl-6">
          <span className="text-slate-500 text-[8px] font-bold font-rajdhani tracking-wider">AZIMUTH (CAMERA)</span>
          <span className="text-slate-300 font-sharetech font-semibold tabular-nums">{hoveredCoords.az}°</span>
        </div>

        <div className="flex flex-col border-l border-slate-800 pl-6">
          <span className="text-slate-500 text-[8px] font-bold font-rajdhani tracking-wider">TACTICAL SCALE</span>
          <span className="text-emerald-450 font-bold font-rajdhani">B2G / STALOWA WOLA DIGITAL TWIN</span>
        </div>
      </footer>
    </div>
  );
}
