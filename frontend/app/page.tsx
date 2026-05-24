"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { CriticalNode, DeployedSystem, Threat, LogEntry, HoveredCoords, SidebarTab, WeaponType, SimState, NodeRelation } from "./types";
import { INITIAL_NODES, INITIAL_RELATIONS, CENTER_LAT, CENTER_LON } from "./data/nodes";
import { WEAPONS } from "./data/weapons";
import { THREAT_TYPES } from "./data/threats";
import { useAudio } from "./hooks/useAudio";
import { useCascadingEngine } from "./hooks/useCascadingEngine";
import { useDefcon } from "./hooks/useDefcon";
import { useCesiumViewer } from "./hooks/useCesiumViewer";
import { Header } from "./components/Header";
import { AlertTicker } from "./components/AlertTicker";
import { CesiumViewport } from "./components/CesiumViewport";
import { LeftSidebar } from "./components/LeftSidebar";
import { ArsenalPanel } from "./components/ArsenalPanel";
import { ThreatMonitor } from "./components/ThreatMonitor";
import { CommandLogger } from "./components/CommandLogger";
import { TelemetryHUD } from "./components/TelemetryHUD";
import { ObjectDetailCard } from "./components/ObjectDetailCard";
import { DependencyFlow } from "./components/DependencyFlow";
import { ThreatModelViewer } from "./components/ThreatModelViewer";
import { DefconOverlay } from "./components/DefconOverlay";

export default function SteelSentinelDashboard() {
  const [nodes, setNodes] = useState<CriticalNode[]>(INITIAL_NODES);
  const [relations, setRelations] = useState<NodeRelation[]>(INITIAL_RELATIONS);
  const [deployedSystems, setDeployedSystems] = useState<DeployedSystem[]>([]);
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponType | null>(null);
  const [threats, setThreats] = useState<Threat[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([
    { timestamp: "16:30:00", text: "SYSTEM DOWODZENIA STEEL SENTINEL ZAINICJOWANY", type: "info" },
    { timestamp: "16:30:02", text: "PŁASZCZYZNA TAKTYCZNA CESIUM JS: WCZYTANO CYFROWY BLIŹNIAK STALOWA WOLA", type: "info" },
    { timestamp: "16:30:04", text: "LOGIKA KASKADOWA: WĘZŁY INFRASTRUKTURY SKONFIGUROWANE (STATUS: 100%)", type: "success" }
  ]);
  const [defcon, setDefcon] = useState<number>(5);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [playbookActive, setPlaybookActive] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [clockTime, setClockTime] = useState<string>("");
  const [hoveredCoords, setHoveredCoords] = useState<HoveredCoords>({
    lat: CENTER_LAT, lon: CENTER_LON, alt: 145, az: 0
  });
  const [coolingSecondsLeft, setCoolingSecondsLeft] = useState<number | null>(null);
  const [waterSecondsLeft, setWaterSecondsLeft] = useState<number | null>(null);

  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [radarCollapsed, setRadarCollapsed] = useState(false);
  const [loggerCollapsed, setLoggerCollapsed] = useState(false);
  const [schemaModeEnabled, setSchemaModeEnabled] = useState(false);
  const [threatViewerOpen, setThreatViewerOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [baseMapType, setBaseMapType] = useState<"standard" | "satellite" | "topo">("standard");

  useEffect(() => {
    const savedType = localStorage.getItem("steel-sentinel-basemap") as any;
    if (savedType === "standard" || savedType === "satellite" || savedType === "topo") {
      setBaseMapType(savedType);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("steel-sentinel-basemap", baseMapType);
  }, [baseMapType]);
  const [mapLayers, setMapLayers] = useState({
    baseMap: true,
    nodes: true,
    relations: true,
    domes: true,
    threats: true,
    tacticalZones: true,
    hydrology: true
  });

  const handleToggleLayer = useCallback((key: keyof typeof mapLayers) => {
    setMapLayers((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  }, []);

  // Sync theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("steel-sentinel-theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // Update theme class and save to localStorage
  useEffect(() => {
    if (theme === "dark") {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
    localStorage.setItem("steel-sentinel-theme", theme);
  }, [theme]);

  // Load nodes and relations from localStorage on client mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedNodes = localStorage.getItem("sentinel_nodes");
      if (savedNodes) {
        try {
          setNodes(JSON.parse(savedNodes));
        } catch (e) {
          console.error("Failed to parse saved nodes:", e);
        }
      }
      const savedRelations = localStorage.getItem("sentinel_relations");
      if (savedRelations) {
        try {
          setRelations(JSON.parse(savedRelations));
        } catch (e) {
          console.error("Failed to parse saved relations:", e);
        }
      }
    }
  }, []);

  // Save nodes to localStorage on update
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sentinel_nodes", JSON.stringify(nodes));
    }
  }, [nodes]);

  // Save relations to localStorage on update
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sentinel_relations", JSON.stringify(relations));
    }
  }, [relations]);

  const [selectedNode, setSelectedNode] = useState<CriticalNode | null>(null);
  const [selectedSystem, setSelectedSystem] = useState<DeployedSystem | null>(null);
  const [isRelocationDragging, setIsRelocationDragging] = useState(false);
  const [relocationConfirmation, setRelocationConfirmation] = useState<{
    sysId: string;
    lat: number;
    lon: number;
    distance: number;
    seconds: number;
    realTime: string;
  } | null>(null);

  const cesiumContainerRef = useRef<HTMLDivElement>(null);

  const simStateRef = useRef<SimState>({
    deployedSystems, threats, simSpeed, nodes, selectedWeapon
  });

  useEffect(() => {
    simStateRef.current = { deployedSystems, threats, simSpeed, nodes, selectedWeapon };
  }, [deployedSystems, threats, simSpeed, nodes, selectedWeapon]);

  useEffect(() => {
    setClockTime(new Date().toTimeString().split(" ")[0]);
    const timer = setInterval(() => {
      setClockTime(new Date().toTimeString().split(" ")[0]);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const { playBeep } = useAudio(soundEnabled);

  const addLog = useCallback((text: string, type: LogEntry["type"] = "info") => {
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

  // Distance helper
  const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Format real travel time assuming tactical convoy speeds
  const formatRealTime = (distanceKm: number, type: string) => {
    // patriot moves at 40km/h (heavy), pilica at 60km/h (medium), radar at 50km/h
    const speedKmh = type === "PATRIOT" ? 40 : type === "PILICA" ? 60 : 50;
    const hours = distanceKm / speedKmh;
    const totalSeconds = Math.round(hours * 3600);
    
    if (totalSeconds < 60) {
      return `${totalSeconds} sek.`;
    }
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    if (minutes < 60) {
      return `${minutes} min. ${remainingSeconds} sek.`;
    }
    const remainingMinutes = minutes % 60;
    const finalHours = Math.floor(minutes / 60);
    return `${finalHours} godz. ${remainingMinutes} min.`;
  };

  const handleConfirmRelocationPosition = useCallback((sysId: string, lat: number, lon: number) => {
    const matched = deployedSystems.find(s => s.id === sysId);
    if (!matched) return;

    const distance = calculateDistanceKm(matched.lat, matched.lon, lat, lon);
    const realTime = formatRealTime(distance, matched.type);
    // Demo mode: Force the actual simulation relocation countdown to exactly 5 seconds
    const seconds = 5;

    setRelocationConfirmation({
      sysId,
      lat,
      lon,
      distance,
      seconds,
      realTime
    });
  }, [deployedSystems]);

  const {
    viewerRef,
    nodeEntitiesRef,
    flyToNode,
    resetViewer,
    removeDeployedSystem,
    drawDeployedSystem,
    startRelocationDrag,
    cancelRelocationDrag
  } = useCesiumViewer({
    containerRef: cesiumContainerRef,
    simStateRef,
    centerLat: CENTER_LAT,
    centerLon: CENTER_LON,
    onAddLog: addLog,
    setDeployedSystems,
    setThreats,
    setNodes,
    setSelectedWeapon: (val) => setSelectedWeapon(val as WeaponType | null),
    setHoveredCoords,
    setSelectedNode,
    setSelectedSystem,
    theme,
    mapLayers,
    nodes,
    relations,
    baseMapType,
    onConfirmRelocationPosition: handleConfirmRelocationPosition
  });

  useEffect(() => {
    if (viewerRef.current) {
      const timeout = setTimeout(() => {
        viewerRef.current.resize();
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [schemaModeEnabled, viewerRef]);

  useCascadingEngine(
    nodes, setNodes, simSpeed,
    coolingSecondsLeft, setCoolingSecondsLeft,
    waterSecondsLeft, setWaterSecondsLeft,
    addLog, nodeEntitiesRef
  );

  useDefcon(threats, nodes, deployedSystems.length, defcon, setDefcon, addLog);

  const spawnThreat = useCallback((type: "DRONE" | "SHAHED" | "MISSILE", targetId: string) => {
    const tConfig = THREAT_TYPES[type];
    const target = nodes.find(n => n.id === targetId);
    if (!target) return;

    const startLat = CENTER_LAT - 0.04 + Math.random() * 0.08;
    const startLon = CENTER_LON + 0.08;
    const threatId = `THR_${Date.now()}_${Math.floor(Math.random() * 100)}`;
    const newThreat: Threat = {
      id: threatId,
      type,
      name: `${type === "MISSILE" ? "RAKIETA" : type === "SHAHED" ? "SHAHED" : "DRON"} #${threatId.slice(-3)}`,
      startLat, startLon,
      lat: startLat, lon: startLon,
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

  const launchScenario = useCallback((index: number) => {
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
  }, [addLog, spawnThreat]);

  const activatePlaybook = useCallback((id: string, name: string) => {
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
  }, [addLog, playBeep]);

  const handleReset = useCallback(() => {
    setNodes(INITIAL_NODES.map(n => ({ ...n })));
    setDeployedSystems([]);
    setThreats([]);
    setSelectedWeapon(null);
    setPlaybookActive(null);
    setCoolingSecondsLeft(null);
    setWaterSecondsLeft(null);
    setSelectedNode(null);
    setSelectedSystem(null);
    resetViewer();
    addLog("ZRESETOWANO SYSTEM I PRZESTRZEŃ TAKTYCZNĄ. OBIEKTY PRZYWRÓCONE DO SPRAWNOŚCI.", "success");
  }, [resetViewer, addLog]);

  const handleNodeClick = useCallback((node: CriticalNode) => {
    setSelectedNode(node);
    setSelectedSystem(null);
    flyToNode(node.lat, node.lon, node.name);
  }, [flyToNode]);

  const handleAddNode = useCallback((newNode: CriticalNode) => {
    setNodes((prev) => [...prev, newNode]);
    addLog(`DODANO NOWY WĘZEŁ STRATEGICZNY: ${newNode.name.toUpperCase()} [ID: ${newNode.id}]`, "success");
  }, [addLog]);

  const handleAddRelation = useCallback((newRel: NodeRelation) => {
    setRelations((prev) => [...prev, newRel]);
    addLog(`POWIĄZANIE SYSTEMOWE: Utworzono relację przepływu ${newRel.source} -> ${newRel.target} [${newRel.label}]`, "success");
  }, [addLog]);

  const handleActivateBackupPower = useCallback((nodeId: string) => {
    addLog(`SIECI ROZDZIELCZE: Ręczne załączenie agregatu rezerwowego dla węzła ${nodeId}.`, "success");
    setNodes((prev) =>
      prev.map((n) =>
        n.id === nodeId
          ? { ...n, backupPower: true, notes: n.notes + " (Awaryjny generator załączony lokalnie z konsoli obiektu)" }
          : n
      )
    );
    setSelectedNode((prev) => (prev && prev.id === nodeId ? { ...prev, backupPower: true } : prev));
  }, [addLog]);

  const handleResetCooling = useCallback(() => {
    addLog("OBJ_02 (Elektrownia): Krytyczne nawadnianie bloku gazowego zainicjowane! Blok chłodzenia zresetowany.", "success");
    setCoolingSecondsLeft(null);
    setNodes((prev) =>
      prev.map((n) =>
        n.id === "OBJ_02"
          ? {
              ...n,
              health: 100,
              status: "OPERATIONAL",
              notes: "CHŁODZENIE PRZYWRÓCONE: Wymuszono awaryjny obieg wody z zapasów strategicznych."
            }
          : n
      )
    );
    setSelectedNode((prev) =>
      prev && prev.id === "OBJ_02"
        ? {
            ...prev,
            health: 100,
            status: "OPERATIONAL",
            notes: "CHŁODZENIE PRZYWRÓCONE: Wymuszono awaryjny obieg wody z zapasów strategicznych."
          }
        : prev
    );
  }, [addLog, setCoolingSecondsLeft]);

  const handleResetWater = useCallback(() => {
    addLog("OBJ_03 (Ujęcie Wody): Wymuszono załączenie zapasowych głębinowych pomp wody. Zbiorniki napełnione.", "success");
    setWaterSecondsLeft(null);
    setNodes((prev) =>
      prev.map((n) =>
        n.id === "OBJ_03"
          ? {
              ...n,
              health: 100,
              status: "OPERATIONAL",
              notes: "REZERWY PEŁNE: Awaryjne napełnianie zakończone sukcesem."
            }
          : n
      )
    );
    setSelectedNode((prev) =>
      prev && prev.id === "OBJ_03"
        ? {
            ...prev,
            health: 100,
            status: "OPERATIONAL",
            notes: "REZERWY PEŁNE: Awaryjne napełnianie zakończone sukcesem."
          }
        : prev
    );
  }, [addLog, setWaterSecondsLeft]);

  const handleRemoveSystem = useCallback((sysId: string) => {
    const matched = deployedSystems.find((s) => s.id === sysId);
    if (!matched) return;

    removeDeployedSystem(sysId);

    setDeployedSystems((prev) => prev.filter((s) => s.id !== sysId));
    setSelectedSystem(null);
    addLog(`DOWÓDZTWO: Zdemontowano tarczę defensywną ${matched.name}.`, "warning");
  }, [deployedSystems, removeDeployedSystem, addLog]);

  const handleRelocateSystem = useCallback((sysId: string, lat: number, lon: number, seconds: number) => {
    const matched = deployedSystems.find(s => s.id === sysId);
    if (!matched) return;

    addLog(`ROZKAZ MARSZU: Rozpoczęto przemieszczanie baterii ${matched.name} na pozycję [${lat.toFixed(4)} N, ${lon.toFixed(4)} E]. Estymowany czas marszu: ${seconds}s.`, "info");

    const updatedSys = {
      ...matched,
      status: "RELOCATING" as const,
      relocationSecondsLeft: seconds,
      targetLat: lat,
      targetLon: lon
    };

    setDeployedSystems(prev => prev.map(s => s.id === sysId ? updatedSys : s));

    if (drawDeployedSystem) {
      drawDeployedSystem(updatedSys);
    }
  }, [deployedSystems, drawDeployedSystem, addLog]);

  // Relocation Tick countdown
  useEffect(() => {
    const relocatingUnits = deployedSystems.filter(s => s.status === "RELOCATING");
    if (relocatingUnits.length === 0) return;

    const interval = setInterval(() => {
      setDeployedSystems(prev => {
        return prev.map(sys => {
          if (sys.status === "RELOCATING") {
            const timeLeft = (sys.relocationSecondsLeft || 1) - 1;
            if (timeLeft <= 0) {
              addLog(`MARSZ TAKTYCZNY ZAKOŃCZONY: Bateria ${sys.name} osiągnęła pozycję bojową [${sys.targetLat?.toFixed(4)} N, ${sys.targetLon?.toFixed(4)} E] i jest OPERACYJNA!`, "success");
              const updatedSys = {
                ...sys,
                lat: sys.targetLat || sys.lat,
                lon: sys.targetLon || sys.lon,
                status: "OPERATIONAL" as const,
                relocationSecondsLeft: undefined,
                targetLat: undefined,
                targetLon: undefined
              };
              setTimeout(() => {
                if (drawDeployedSystem) {
                  drawDeployedSystem(updatedSys);
                }
              }, 50);
              return updatedSys;
            } else {
              const updatedSys = {
                ...sys,
                relocationSecondsLeft: timeLeft
              };
              setTimeout(() => {
                if (drawDeployedSystem) {
                  drawDeployedSystem(updatedSys);
                }
              }, 50);
              return updatedSys;
            }
          }
          return sys;
        });
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [deployedSystems, drawDeployedSystem, addLog]);

  const currentSelectedSystem = selectedSystem
    ? deployedSystems.find(s => s.id === selectedSystem.id) || selectedSystem
    : null;

  return (
    <div className="flex flex-col flex-1 h-screen relative select-none">
      <Header
        defcon={defcon}
        clockTime={clockTime}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          setSoundEnabled(!soundEnabled);
          addLog(`DŹWIĘKI SYSTEMOWE: ${!soundEnabled ? "WŁĄCZONE" : "WYŁĄCZONE"}`, "info");
        }}
        onAddLog={addLog}
        schemaModeEnabled={schemaModeEnabled}
        onToggleSchemaMode={() => {
          setSchemaModeEnabled(!schemaModeEnabled);
          addLog(`WIZUALIZACJA SIECI: Przełączono podgląd schematu na ${!schemaModeEnabled ? "AKTYWNY" : "NIEAKTYWNY"}.`, "info");
        }}
        theme={theme}
        onToggleTheme={() => {
          const nextTheme = theme === "light" ? "dark" : "light";
          setTheme(nextTheme);
          addLog(`MOTYW SYSTEMOWY: Zmieniono motyw graficzny na ${nextTheme === "light" ? "JASNY" : "CIEMNY"}.`, "info");
        }}
        onOpenThreatViewer={() => {
          setThreatViewerOpen(true);
          addLog("ROZPOZNANIE: Uruchomiono podgląd 3D modeli zagrożeń.", "info");
        }}
      />

      <AlertTicker threats={threats} />

      {schemaModeEnabled && (
        <div className="fixed top-[72px] bottom-0 left-0 right-0 z-20 theme-bg-app flex flex-col transition-all duration-500 ease-in-out">
          <DependencyFlow
            nodes={nodes}
            relations={relations}
            theme={theme}
            onAddNode={handleAddNode}
            onAddRelation={handleAddRelation}
            onFlyTo={(lat, lon, name) => {
              // Automatically switch back to 3D map view
              setSchemaModeEnabled(false);
              const matched = nodes.find(n => n.name === name);
              if (matched) {
                setSelectedNode(matched);
                setSelectedSystem(null);
              }
              // Wait slightly for the view transition to start before camera fly
              setTimeout(() => {
                flyToNode(lat, lon, name);
              }, 100);
            }}
          />
        </div>
      )}

      <CesiumViewport 
        cesiumContainerRef={cesiumContainerRef} 
        isSplitScreen={schemaModeEnabled}
      />

      {/* Unified Left Sidebar Column */}
      {!schemaModeEnabled && (
        <div className="fixed left-4 top-20 bottom-4 w-80 z-40 flex flex-col gap-3 pointer-events-none">
          <div className="pointer-events-auto flex flex-col gap-3 h-full min-h-0">
            <LeftSidebar
              nodes={nodes}
              relations={relations}
              onNodeClick={handleNodeClick}
              onAddNode={handleAddNode}
              onAddRelation={handleAddRelation}
              isCollapsed={leftPanelCollapsed}
              onToggle={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
            />

            <ThreatMonitor
              threats={threats}
              nodes={nodes}
              isCollapsed={radarCollapsed}
              onToggle={() => setRadarCollapsed(!radarCollapsed)}
            />
          </div>
        </div>
      )}

      {/* Unified Right Sidebar Column */}
      {!schemaModeEnabled && (
        <div className="fixed right-4 top-20 bottom-4 w-80 z-40 flex flex-col gap-3 pointer-events-none">
          <div className="pointer-events-auto flex flex-col gap-3 h-full min-h-0">
            <ArsenalPanel
              weapons={WEAPONS}
              deployedSystems={deployedSystems}
              selectedWeapon={selectedWeapon}
              onSelectWeapon={(type) => {
                setSelectedWeapon(type);
                if (type) {
                  addLog(`DOWÓDZTWO: Wybrano ${WEAPONS.find(w => w.type === type)?.name} do instalacji. Wskaż punkt na mapie 3D.`, "info");
                }
              }}
              onLaunchScenario={launchScenario}
              onReset={handleReset}
              simSpeed={simSpeed}
              onTogglePause={() => {
                setSimSpeed(simSpeed === 0 ? 1 : 0);
                addLog(`SYMULATOR: ${simSpeed === 0 ? "WZNOWIONY" : "WSTRZYMANY"}`, "info");
              }}
              onAddLog={addLog}
              isCollapsed={rightPanelCollapsed}
              onToggle={() => setRightPanelCollapsed(!rightPanelCollapsed)}
            />

            <CommandLogger
              logs={logs}
              clockTime={clockTime}
              isCollapsed={loggerCollapsed}
              onToggle={() => setLoggerCollapsed(!loggerCollapsed)}
            />
          </div>
        </div>
      )}

      {!schemaModeEnabled && (
        <TelemetryHUD 
          hoveredCoords={hoveredCoords} 
          mapLayers={mapLayers}
          onToggleLayer={handleToggleLayer}
          baseMapType={baseMapType}
          onSetBaseMapType={setBaseMapType}
        />
      )}

      <ObjectDetailCard
        selectedNode={selectedNode}
        selectedSystem={selectedSystem}
        onClose={() => {
          setSelectedNode(null);
          setSelectedSystem(null);
          if (isRelocationDragging) {
            setIsRelocationDragging(false);
            cancelRelocationDrag();
          }
        }}
        onActivateBackupPower={handleActivateBackupPower}
        coolingSecondsLeft={coolingSecondsLeft}
        waterSecondsLeft={waterSecondsLeft}
        onResetCooling={handleResetCooling}
        onResetWater={handleResetWater}
        onRemoveSystem={handleRemoveSystem}
        onRelocateSystem={handleRelocateSystem}
        onFlyTo={flyToNode}
        leftSidebarCollapsed={leftPanelCollapsed}
        isRelocationDragging={isRelocationDragging}
        onStartRelocationDrag={(sysId) => {
          setIsRelocationDragging(true);
          startRelocationDrag(sysId);
        }}
        onCancelRelocationDrag={() => {
          setIsRelocationDragging(false);
          cancelRelocationDrag();
        }}
      />

      {relocationConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm font-mono p-4">
          <div className="w-[450px] theme-bg-panel border border-amber-500/50 p-5 clip-chamfer shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-amber-500/30 pb-2">
              <span className="text-xs theme-neon-text font-bold tracking-wider font-rajdhani text-amber-500">
                POTWIERDZENIE PRZEMIESZCZENIA BATERII
              </span>
              <span className="text-[10px] bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-amber-400 font-bold">
                ROZKAZ MARSZU
              </span>
            </div>
            
            <p className="text-[11px] theme-text-primary leading-relaxed">
              Czy chcesz zatwierdzić rozkaz dyslokacji jednostki{" "}
              <span className="text-amber-400 font-bold uppercase">
                {deployedSystems.find(s => s.id === relocationConfirmation.sysId)?.name}
              </span>{" "}
              na nową pozycję bojową?
            </p>

            <div className="grid grid-cols-2 gap-3 text-[10px] theme-bg-app p-3 border theme-border">
              <div className="flex flex-col">
                <span className="text-[8px] theme-text-muted">POZYCJA DOCELOWA</span>
                <span className="font-bold theme-text-primary">
                  {relocationConfirmation.lat.toFixed(5)}°N, {relocationConfirmation.lon.toFixed(5)}°E
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] theme-text-muted">DYSTANS MARSZU</span>
                <span className="font-bold theme-text-primary">
                  {relocationConfirmation.distance.toFixed(2)} KM
                </span>
              </div>
              <div className="flex flex-col mt-2 col-span-2 border-t theme-border pt-2">
                <span className="text-[8px] theme-text-muted">SZACOWANY REALNY CZAS MARSZU KOLUMNY</span>
                <span className="font-bold text-amber-400 text-xs font-sharetech">
                  {relocationConfirmation.realTime}
                </span>
                <span className="text-[8px] text-slate-500 mt-1 italic block leading-snug">
                  * Na potrzeby prezentacji (demo) czas przejazdu skrócono do 5 sekund.
                </span>
              </div>
              <div className="flex flex-col mt-1 col-span-2">
                <span className="text-[8px] theme-text-muted">STAN BATERII W TRANZYCIE</span>
                <span className="font-bold text-red-500 text-[10px] uppercase">
                  NIEAKTYWNY / WYŁĄCZONY Z SYS. OBRONY
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-1">
              <button
                onClick={() => {
                  handleRelocateSystem(
                    relocationConfirmation.sysId,
                    relocationConfirmation.lat,
                    relocationConfirmation.lon,
                    relocationConfirmation.seconds
                  );
                  setIsRelocationDragging(false);
                  cancelRelocationDrag();
                  setRelocationConfirmation(null);
                }}
                className="flex-1 py-2 border border-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 transition-all font-bold text-xs clip-chamfer cursor-pointer flex items-center justify-center gap-1.5"
              >
                ZATWIERDŹ MARSZ
              </button>
              <button
                onClick={() => {
                  setIsRelocationDragging(false);
                  cancelRelocationDrag();
                  setRelocationConfirmation(null);
                }}
                className="flex-1 py-2 border border-slate-600 bg-slate-500/10 hover:bg-slate-550/25 text-slate-400 transition-all font-bold text-xs clip-chamfer cursor-pointer flex items-center justify-center gap-1.5"
              >
                ANULUJ
              </button>
            </div>
          </div>
        </div>
      )}
      <ThreatModelViewer
        isOpen={threatViewerOpen}
        onClose={() => setThreatViewerOpen(false)}
      />
      <DefconOverlay defcon={defcon} />
    </div>
  );
}
