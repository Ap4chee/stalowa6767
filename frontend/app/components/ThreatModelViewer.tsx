"use client";

import { Suspense, useState, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, ContactShadows, Center } from "@react-three/drei";
import { Crosshair, RotateCcw, ZoomIn, Eye, ChevronLeft, ChevronRight } from "lucide-react";

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
  }
];

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
  const controlsRef = useRef<any>(null);

  if (!isOpen) return null;

  const threat = THREAT_CATALOG[selectedIndex];

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev - 1 + THREAT_CATALOG.length) % THREAT_CATALOG.length);
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev + 1) % THREAT_CATALOG.length);
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
                ROZPOZNANIE ZAGROŻEŃ
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
                className={`p-1.5 bg-black/50 border transition-all rounded cursor-pointer ${
                  autoRotate ? "border-cyan-500 text-cyan-400 bg-cyan-500/20" : "border-cyan-500/30 text-cyan-400/50"
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
          <div className="w-[340px] border-l theme-border flex flex-col theme-bg-panel">
            
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
                <div className="text-[8px] font-bold font-rajdhani tracking-widest theme-text-muted mb-1">POZIOM ZAGROŻENIA</div>
                <span className={`text-[11px] font-bold font-rajdhani tracking-widest px-2.5 py-1 border rounded ${
                  threat.threat === "KRYTYCZNY" 
                    ? "text-red-500 border-red-500/40 bg-red-500/10 animate-pulse" 
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

              {/* Countermeasures */}
              <div>
                <div className="text-[8px] font-bold font-rajdhani tracking-widest theme-text-muted mb-2">ŚRODKI PRZECIWDZIAŁANIA</div>
                <div className="space-y-1">
                  {threat.countermeasures.map((cm) => (
                    <div key={cm} className="flex items-center gap-2 text-[10px] font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="theme-text-primary font-semibold">{cm}</span>
                    </div>
                  ))}
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
