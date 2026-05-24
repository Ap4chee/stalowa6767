"use client";

import { Suspense, useState, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, ContactShadows, Center } from "@react-three/drei";
import { Crosshair, RotateCcw, ZoomIn, Eye, ChevronLeft, ChevronRight, X, Shield, Zap, Radio, Rocket } from "lucide-react";

// ---- Countermeasure database ----
const COUNTERMEASURE_DB: Record<string, {
  name: string;
  type: string;
  icon: "shield" | "zap" | "radio" | "rocket";
  range: string;
  effectiveness: string;
  description: string;
  specs: { label: string; value: string }[];
}> = {
  "PILICA+": {
    name: "PSR-A PILICA+",
    type: "SYSTEM ARTYLERYJSKO-RAKIETOWY VSHORAD",
    icon: "zap",
    range: "5 km",
    effectiveness: "95%",
    description: "Zintegrowany system obrony przeciwlotniczej krótkiego zasięgu. Łączy podwójne działka ZU-23-2 (23mm) z wyrzutniami rakiet GROM/PIORUN. Zdolność do automatycznego śledzenia i zestrzeliwania dronów, amunicji krążącej oraz pocisków manewrujących na niskim pułapie.",
    specs: [
      { label: "KALIBER", value: "23mm (2xZU-23-2)" },
      { label: "RAKIETY", value: "4x GROM/PIORUN" },
      { label: "RADAR", value: "Zintegrowany IRSM" },
      { label: "CZAS REAKCJI", value: "4-6 sekund" },
    ]
  },
  "ZRN-01 WRE": {
    name: "ZRN-01 TAJFUN WRE",
    type: "MOBILNY SYSTEM WALKI RADIOELEKTRONICZNEJ",
    icon: "radio",
    range: "2 km",
    effectiveness: "80% (drony cywilne)",
    description: "Mobilna stacja zakłócania radioelektronicznego pasm GPS/GLONASS i łączy C2 (2.4/5.8 GHz). Skutecznie neutralizuje drony komercyjne klasy I poprzez przerwanie łącza z operatorem i zakłócanie nawigacji satelitarnej.",
    specs: [
      { label: "PASMA", value: "GPS/GLONASS/C2" },
      { label: "MOC", value: "50W per kanał" },
      { label: "ANTENA", value: "Kierunkowa 60°" },
      { label: "MOBILNOŚĆ", value: "Na pojeździe 4x4" },
    ]
  },
  "RADAR OBSERWACJI": {
    name: "RADAR MAŁOGABARYTOWY OBSERWACJI",
    type: "RADAR DOPPLEROWSKI WCZESNEGO OSTRZEGANIA",
    icon: "radio",
    range: "3.5 km (LSS)",
    effectiveness: "Wykrywanie 99%",
    description: "Kompaktowy radar dopplerowski zoptymalizowany do wykrywania celów o niskiej sygnaturze radarowej (LSS). Automatycznie klasyfikuje cele w oparciu o micro-doppler (rozróżnianie dronów od ptaków). Współpracuje bezpośrednio z systemem PILICA+ w pętli sensorowo-efektorowej.",
    specs: [
      { label: "ZASIĘG LSS", value: "do 3.5 km" },
      { label: "ROZDZIELCZOŚĆ", value: "0.5° azymut" },
      { label: "OBROTY", value: "30 RPM" },
      { label: "CELE ŚLEDZONE", value: "do 200" },
    ]
  },
  "PPZR PIORUN": {
    name: "PPZR GROM PIORUN",
    type: "PRZENOŚNY PRZECIWLOTNICZY ZESTAW RAKIETOWY",
    icon: "rocket",
    range: "6.5 km",
    effectiveness: "90%",
    description: "Polskie MANPADS nowej generacji z głowicą samonaprowadzającą IIR (dwuzakresowa podczerwień). Zdolny do przechwycenia celów na tle ziemi i w warunkach silnych zakłóceń. Wyposażony w chłodzony detektor z możliwością pracy w trybie dziennym i nocnym.",
    specs: [
      { label: "MASA", value: "16.5 kg (gotowy)" },
      { label: "GŁOWICA", value: "IIR dwuzakresowa" },
      { label: "PUŁAP", value: "10-4000m" },
      { label: "PRĘDKOŚĆ", value: "Mach 1.6+" },
    ]
  },
  "ZU-23-2": {
    name: "ARMATA PLOT ZU-23-2",
    type: "PODWÓJNE DZIAŁKO PRZECIWLOTNICZE 23MM",
    icon: "zap",
    range: "2.5 km",
    effectiveness: "70%",
    description: "Radziecka podwójna armata przeciwlotnicza kal. 23mm. Szybkostrzelność 2000 strz./min łącznie. Pomimo prostej konstrukcji, nadal skuteczna przeciwko nisko latającym dronom i amunicji krążącej na bliskim dystansie. Używana jako ostatnia linia obrony.",
    specs: [
      { label: "KALIBER", value: "2x 23mm" },
      { label: "SZYBKOSTR.", value: "2000 strz./min" },
      { label: "PUŁAP SKUTECZNY", value: "1500m" },
      { label: "MASA", value: "950 kg" },
    ]
  },
  "N/D — SYSTEM OBRONNY": {
    name: "SYSTEM SOJUSZNICZY",
    type: "OBIEKT WŁASNEJ OBRONY",
    icon: "shield",
    range: "N/D",
    effectiveness: "N/D",
    description: "Ten obiekt jest elementem własnych sił obronnych i nie wymaga środków przeciwdziałania. Stanowi kluczowy komponent tarczy antyrakietowej chroniącej infrastrukturę krytyczną Stalowej Woli.",
    specs: [
      { label: "KLASYFIKACJA", value: "SOJUSZNICZY" },
      { label: "ROLA", value: "OBRONA AKTYWNA" },
      { label: "STATUS", value: "OPERACYJNY" },
      { label: "PRIORYTET", value: "KRYTYCZNY" },
    ]
  }
};

// ---- Threat catalog with model paths and metadata ----
const THREAT_CATALOG = [
  {
    id: "fpv_drone",
    name: "Dron FPV",
    designation: "UAS-X / FPV RECON",
    classification: "BPLA KLASA I",
    modelPath: "/3d_models/fpv_drone.glb",
    speed: "80-140 km/h",
    range: "5-15 km",
    altitude: "50-300m AGL",
    payload: "0.5-2 kg",
    threat: "WYSOKI",
    description: "Komercyjny dron FPV używany do rozpoznania lub ataku kamikadze. Wysoka manewrowość, niski przekrój radarowy. Podatny na WRE i systemy CUAS.",
    countermeasures: ["PILICA+", "ZRN-01 WRE", "RADAR OBSERWACJI"],
    cameraDistance: 3,
  },
  {
    id: "shahed_136",
    name: "Shahed-136",
    designation: "HESA SHAHED-136 / GERAN-2",
    classification: "AMUNICJA KRĄŻĄCA",
    modelPath: "/3d_models/iranian_shahed-136_military_drone.glb",
    speed: "150-185 km/h",
    range: "1800-2500 km",
    altitude: "60-4000m AGL",
    payload: "40-50 kg (głowica GPC)",
    threat: "KRYTYCZNY",
    description: "Irańska amunicja krążąca eksportowana do Rosji (Geran-2). Silnik tłokowy, delta, nawigacja INS/GNSS. Odporny na podstawowe systemy WRE. Wymaga kinetycznego przechwycenia.",
    countermeasures: ["PILICA+", "PPZR PIORUN", "ZU-23-2"],
    cameraDistance: 6,
  },
  {
    id: "patriot_pac3",
    name: "MIM-104 Patriot PAC-3",
    designation: "MIM-104F PATRIOT PAC-3 MSE",
    classification: "SYSTEM RAKIETOWY OPL",
    modelPath: "/3d_models/patriot.glb",
    speed: "Mach 5+ (pocisk)",
    range: "40-160 km",
    altitude: "do 24 000m",
    payload: "Głowica hit-to-kill",
    threat: "SOJUSZNICZY",
    description: "Amerykański system obrony przeciwlotniczej i przeciwrakietowej dalekiego zasięgu. Radar AN/MPQ-65 zapewnia śledzenie 100+ celów jednocześnie. Pocisk PAC-3 MSE wykorzystuje technologię kinetycznego przechwycenia (hit-to-kill).",
    countermeasures: ["N/D — SYSTEM OBRONNY"],
    cameraDistance: 8,
  },
  {
    id: "pilica",
    name: "PSR-A Pilica",
    designation: "PSR-A PILICA / PILICA+",
    classification: "SYSTEM VSHORAD",
    modelPath: "/3d_models/pilica.glb",
    speed: "1000 strz./min (armaty)",
    range: "5-6.5 km",
    altitude: "do 4000m",
    payload: "23mm pociski, 2x rakiety Piorun",
    threat: "SOJUSZNICZY",
    description: "Polski Przeciwlotniczy System Rakietowo-Artyleryjski bardzo krótkiego zasięgu (VSHORAD). Integruje podwójną armatę automatyczną kalibru 23 mm oraz dwie wyrzutnie rakiet PPZR Piorun. Zaprojektowany do osłony baz lotniczych i innych kluczowych obiektów przed bezzałogowcami, śmigłowcami i pociskami manewrującymi.",
    countermeasures: ["N/D — SYSTEM OBRONNY"],
    cameraDistance: 12,
  }
];

// ---- Countermeasure Icon helper ----
function CountermeasureIcon({ type }: { type: string }) {
  switch (type) {
    case "shield": return <Shield className="w-4 h-4" />;
    case "zap": return <Zap className="w-4 h-4" />;
    case "radio": return <Radio className="w-4 h-4" />;
    case "rocket": return <Rocket className="w-4 h-4" />;
    default: return <Shield className="w-4 h-4" />;
  }
}

// ---- Countermeasure Detail Modal ----
function CountermeasureModal({ cmKey, onClose }: { cmKey: string; onClose: () => void }) {
  const cm = COUNTERMEASURE_DB[cmKey];
  if (!cm) return null;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="w-[90%] max-w-[300px] theme-bg-panel border theme-border rounded-lg shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b theme-border bg-emerald-500/5">
          <div className="flex items-center gap-2 theme-neon-text">
            <CountermeasureIcon type={cm.icon} />
            <span className="text-[10px] font-bold font-rajdhani tracking-widest">{cm.name}</span>
          </div>
          <button onClick={onClose} className="p-0.5 theme-text-muted hover:text-red-500 transition-all cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3 space-y-3">
          <div>
            <div className="text-[7px] font-bold font-rajdhani tracking-widest theme-text-muted">TYP SYSTEMU</div>
            <div className="text-[9px] font-bold font-rajdhani theme-text-primary mt-0.5">{cm.type}</div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1 p-1.5 theme-bg-app border theme-border rounded text-center">
              <div className="text-[7px] font-bold font-rajdhani tracking-widest theme-text-muted">ZASIĘG</div>
              <div className="text-[10px] font-bold font-sharetech theme-neon-text">{cm.range}</div>
            </div>
            <div className="flex-1 p-1.5 theme-bg-app border theme-border rounded text-center">
              <div className="text-[7px] font-bold font-rajdhani tracking-widest theme-text-muted">SKUTECZNOŚĆ</div>
              <div className="text-[10px] font-bold font-sharetech text-emerald-500">{cm.effectiveness}</div>
            </div>
          </div>

          <div>
            <div className="text-[7px] font-bold font-rajdhani tracking-widest theme-text-muted mb-1">OPIS</div>
            <p className="text-[9px] theme-text-secondary leading-relaxed font-mono">{cm.description}</p>
          </div>

          <div>
            <div className="text-[7px] font-bold font-rajdhani tracking-widest theme-text-muted mb-1.5">SPECYFIKACJA</div>
            <div className="grid grid-cols-2 gap-1">
              {cm.specs.map(({ label, value }) => (
                <div key={label} className="p-1.5 theme-bg-app border theme-border rounded">
                  <div className="text-[6px] font-bold font-rajdhani tracking-widest theme-text-muted">{label}</div>
                  <div className="text-[9px] font-bold font-sharetech theme-text-primary mt-0.5">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- 3D Model component ----
function ThreatModel({ modelPath }: { modelPath: string }) {
  const { scene } = useGLTF(modelPath);

  return (
    <Center>
      <primitive object={scene} />
    </Center>
  );
}

// ---- Loading fallback inside Canvas ----
function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color="#06b6d4" wireframe />
    </mesh>
  );
}

// ---- Main component ----
interface ThreatModelViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ThreatModelViewer({ isOpen, onClose }: ThreatModelViewerProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [selectedCM, setSelectedCM] = useState<string | null>(null);
  const controlsRef = useRef<any>(null);

  if (!isOpen) return null;

  const threat = THREAT_CATALOG[selectedIndex];

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev - 1 + THREAT_CATALOG.length) % THREAT_CATALOG.length);
    setSelectedCM(null);
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev + 1) % THREAT_CATALOG.length);
    setSelectedCM(null);
  };

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* Main container */}
      <div className="w-[95vw] max-w-[1200px] h-[85vh] max-h-[800px] theme-bg-panel border theme-border rounded-lg shadow-2xl flex flex-col overflow-hidden">

        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b theme-border">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Crosshair className="w-5 h-5 theme-neon-text animate-pulse" />
              <span className="font-rajdhani font-extrabold tracking-widest text-[14px] theme-neon-text">
                BAZA OBIEKTÓW 3D
              </span>
            </div>
            <span className="text-[9px] theme-bg-app border theme-border px-2 py-0.5 theme-text-secondary font-mono">
              3D_MODEL_VIEWER v1.0
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 text-[10px] font-bold font-rajdhani tracking-widest border theme-border theme-text-secondary hover:text-red-500 hover:border-red-500 transition-all cursor-pointer"
          >
            ZAMKNIJ ✕
          </button>
        </div>

        {/* Content area: 3D viewport + info panel */}
        <div className="flex flex-1 min-h-0">

          {/* Left: 3D Canvas */}
          <div className="flex-1 relative bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/30 dark:from-slate-950 dark:via-slate-900 dark:to-cyan-950/30">
            {/* Canvas corner decorations */}
            <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-cyan-500/40 z-10 pointer-events-none" />
            <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-cyan-500/40 z-10 pointer-events-none" />
            <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-cyan-500/40 z-10 pointer-events-none" />
            <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-cyan-500/40 z-10 pointer-events-none" />

            {/* Canvas HUD overlay */}
            <div className="absolute top-4 left-4 z-10 pointer-events-none">
              <div className="text-[9px] font-mono text-cyan-500/60 leading-relaxed">
                <div>▸ MODEL: {threat.designation}</div>
                <div>▸ KLASYFIKACJA: {threat.classification}</div>
                <div>▸ RENDERING: REAL-TIME PBR</div>
              </div>
            </div>

            {/* Canvas controls toolbar */}
            <div className="absolute bottom-4 left-4 z-10 flex gap-1.5">
              <button
                onClick={handleResetCamera}
                className="p-1.5 bg-black/50 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition-all rounded cursor-pointer"
                title="Resetuj kamerę"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setAutoRotate(!autoRotate)}
                className={`p-1.5 bg-black/50 border transition-all rounded cursor-pointer ${autoRotate ? "border-cyan-500 text-cyan-400 bg-cyan-500/20" : "border-cyan-500/30 text-cyan-400/50"
                  }`}
                title="Autorotacja"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              <div className="p-1.5 bg-black/50 border border-cyan-500/30 text-cyan-500/60 rounded flex items-center gap-1">
                <ZoomIn className="w-3.5 h-3.5" />
                <span className="text-[8px] font-mono">SCROLL</span>
              </div>
            </div>

            {/* Three.js Canvas */}
            <Canvas
              camera={{ position: [0, 1.5, threat.cameraDistance], fov: 45 }}
              className="w-full h-full"
              gl={{ antialias: true, alpha: true }}
              shadows
            >
              <ambientLight intensity={0.4} />
              <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
              <directionalLight position={[-3, 4, -2]} intensity={0.3} color="#06b6d4" />
              <pointLight position={[0, -2, 0]} intensity={0.15} color="#f59e0b" />

              <Suspense fallback={<LoadingFallback />}>
                <ThreatModel key={threat.id} modelPath={threat.modelPath} />
                <ContactShadows
                  position={[0, -1.5, 0]}
                  opacity={0.4}
                  scale={10}
                  blur={2.5}
                  far={4}
                />
                <Environment preset="city" />
              </Suspense>

              <OrbitControls
                ref={controlsRef}
                autoRotate={autoRotate}
                autoRotateSpeed={1.5}
                enablePan={false}
                minDistance={1.5}
                maxDistance={15}
                maxPolarAngle={Math.PI / 1.8}
                minPolarAngle={0.2}
              />
            </Canvas>

            {/* Grid overlay effect */}
            <div
              className="absolute inset-0 pointer-events-none z-[5] opacity-[0.03]"
              style={{
                backgroundImage: "linear-gradient(rgba(6,182,212,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.3) 1px, transparent 1px)",
                backgroundSize: "40px 40px"
              }}
            />
          </div>

          {/* Right: Info panel */}
          <div className="w-[340px] border-l theme-border flex flex-col theme-bg-panel relative">

            {/* Countermeasure detail modal overlay */}
            {selectedCM && (
              <CountermeasureModal cmKey={selectedCM} onClose={() => setSelectedCM(null)} />
            )}

            {/* Threat selector */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b theme-border">
              <button
                onClick={handlePrev}
                className="p-1 theme-bg-button border theme-border hover:theme-bg-button-hover rounded transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 theme-text-secondary" />
              </button>
              <div className="text-center">
                <div className="text-[10px] font-bold font-rajdhani tracking-widest theme-neon-text">
                  {threat.name.toUpperCase()}
                </div>
                <div className="text-[8px] theme-text-muted font-mono">
                  {selectedIndex + 1} / {THREAT_CATALOG.length}
                </div>
              </div>
              <button
                onClick={handleNext}
                className="p-1 theme-bg-button border theme-border hover:theme-bg-button-hover rounded transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 theme-text-secondary" />
              </button>
            </div>

            {/* Threat info body */}
            <div className="flex-1 overflow-y-auto terminal-scroll p-4 space-y-4">

              {/* Designation */}
              <div>
                <div className="text-[8px] font-bold font-rajdhani tracking-widest theme-text-muted mb-1">OZNACZENIE NATO</div>
                <div className="text-[12px] font-bold font-rajdhani theme-text-primary tracking-wide">{threat.designation}</div>
              </div>

              {/* Threat level */}
              <div>
                <div className="text-[8px] font-bold font-rajdhani tracking-widest theme-text-muted mb-1">KLASYFIKACJA</div>
                <span className={`text-[11px] font-bold font-rajdhani tracking-widest px-2.5 py-1 border rounded ${threat.threat === "KRYTYCZNY"
                  ? "text-red-500 border-red-500/40 bg-red-500/10 animate-pulse"
                  : threat.threat === "SOJUSZNICZY"
                    ? "text-emerald-500 border-emerald-500/40 bg-emerald-500/10"
                    : "text-amber-500 border-amber-500/40 bg-amber-500/10"
                  }`}>
                  {threat.threat}
                </span>
              </div>

              {/* Specs grid */}
              <div>
                <div className="text-[8px] font-bold font-rajdhani tracking-widest theme-text-muted mb-2">PARAMETRY TECHNICZNE</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: "PRĘDKOŚĆ", value: threat.speed },
                    { label: "ZASIĘG", value: threat.range },
                    { label: "PUŁAP", value: threat.altitude },
                    { label: "ŁADUNEK", value: threat.payload },
                  ].map(({ label, value }) => (
                    <div key={label} className="p-2 theme-bg-app border theme-border rounded">
                      <div className="text-[7px] font-bold font-rajdhani tracking-widest theme-text-muted">{label}</div>
                      <div className="text-[10px] font-bold font-sharetech theme-text-primary mt-0.5">{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <div className="text-[8px] font-bold font-rajdhani tracking-widest theme-text-muted mb-1">ANALIZA WYWIADOWCZA</div>
                <p className="text-[10px] theme-text-secondary leading-relaxed font-mono">
                  {threat.description}
                </p>
              </div>

              {/* Countermeasures - now clickable cards */}
              <div>
                <div className="text-[8px] font-bold font-rajdhani tracking-widest theme-text-muted mb-2">ŚRODKI PRZECIWDZIAŁANIA</div>
                <div className="space-y-1.5">
                  {threat.countermeasures.map((cm) => {
                    const cmData = COUNTERMEASURE_DB[cm];
                    return (
                      <button
                        key={cm}
                        onClick={() => setSelectedCM(cm)}
                        className="w-full flex items-center gap-2.5 p-2 theme-bg-app border theme-border rounded hover:theme-neon-border hover:bg-cyan-500/5 transition-all cursor-pointer text-left group"
                      >
                        <div className="w-7 h-7 rounded flex items-center justify-center theme-bg-panel border theme-border group-hover:theme-neon-border group-hover:theme-neon-text theme-text-muted transition-all shrink-0">
                          {cmData && <CountermeasureIcon type={cmData.icon} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[9px] font-bold font-rajdhani theme-text-primary group-hover:theme-neon-text transition-all truncate">{cm}</div>
                          {cmData && (
                            <div className="text-[7px] theme-text-muted font-mono truncate">{cmData.type}</div>
                          )}
                        </div>
                        <div className="text-[7px] theme-text-muted font-rajdhani font-bold tracking-wider shrink-0">
                          SZCZEGÓŁY →
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Preload models
THREAT_CATALOG.forEach(t => {
  useGLTF.preload(t.modelPath);
});
