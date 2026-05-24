"use client";

import { Suspense, useState, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, ContactShadows, Center } from "@react-three/drei";
import {
  Crosshair,
  RotateCcw,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  MousePointer
} from "lucide-react";
import { Button, StatusPill, Dialog, IconButton } from "../ui";
import type { StatusTone } from "../ui";

/* ============================================================
 * VISUAL VARIANT FLAG
 * "soft"   — v2 soft-SaaS (domyślny), zgodny z app/CLAUDE.md
 * "legacy" — stary tactical-cyan styl (rollback bez ruszania importów)
 * ============================================================ */
const VISUAL: "soft" | "legacy" = "soft";

// ---- Countermeasure database ----
const COUNTERMEASURE_DB: Record<string, {
  name: string;
  type: string;
  range: string;
  effectiveness: string;
  description: string;
  specs: { label: string; value: string }[];
}> = {
  "PILICA+": {
    name: "PSR-A PILICA+",
    type: "System artyleryjsko-rakietowy VSHORAD",
    range: "5 km",
    effectiveness: "95%",
    description: "Zintegrowany system obrony przeciwlotniczej krótkiego zasięgu. Łączy podwójne działka ZU-23-2 (23 mm) z wyrzutniami rakiet GROM/PIORUN. Automatyczne śledzenie i zwalczanie dronów, amunicji krążącej oraz pocisków manewrujących na niskim pułapie.",
    specs: [
      { label: "Kaliber", value: "23 mm (2x ZU-23-2)" },
      { label: "Rakiety", value: "4x GROM / PIORUN" },
      { label: "Radar", value: "Zintegrowany IRSM" },
      { label: "Czas reakcji", value: "4–6 sekund" },
    ]
  },
  "ZRN-01 WRE": {
    name: "ZRN-01 Tajfun WRE",
    type: "Mobilny system walki radioelektronicznej",
    range: "2 km",
    effectiveness: "80% (drony cywilne)",
    description: "Mobilna stacja zakłócania radioelektronicznego pasm GPS/GLONASS i łączy C2 (2.4 / 5.8 GHz). Skutecznie neutralizuje drony komercyjne klasy I poprzez przerwanie łącza z operatorem i zakłócanie nawigacji satelitarnej.",
    specs: [
      { label: "Pasma", value: "GPS / GLONASS / C2" },
      { label: "Moc", value: "50 W na kanał" },
      { label: "Antena", value: "Kierunkowa 60°" },
      { label: "Mobilność", value: "Na pojeździe 4x4" },
    ]
  },
  "RADAR OBSERWACJI": {
    name: "Radar małogabarytowy obserwacji",
    type: "Radar dopplerowski wczesnego ostrzegania",
    range: "3.5 km (LSS)",
    effectiveness: "Wykrywanie 99%",
    description: "Kompaktowy radar dopplerowski zoptymalizowany do wykrywania celów o niskiej sygnaturze radarowej (LSS). Automatycznie klasyfikuje cele w oparciu o micro-doppler. Współpracuje bezpośrednio z systemem PILICA+ w pętli sensorowo-efektorowej.",
    specs: [
      { label: "Zasięg LSS", value: "do 3.5 km" },
      { label: "Rozdzielczość", value: "0.5° azymut" },
      { label: "Obroty", value: "30 RPM" },
      { label: "Cele śledzone", value: "do 200" },
    ]
  },
  "PPZR PIORUN": {
    name: "PPZR Grom / Piorun",
    type: "Przenośny przeciwlotniczy zestaw rakietowy",
    range: "6.5 km",
    effectiveness: "90%",
    description: "Polski MANPADS nowej generacji z głowicą samonaprowadzającą IIR (dwuzakresowa podczerwień). Zdolny do przechwycenia celów na tle ziemi i w warunkach silnych zakłóceń. Wyposażony w chłodzony detektor z możliwością pracy w trybie dziennym i nocnym.",
    specs: [
      { label: "Masa", value: "16.5 kg (gotowy)" },
      { label: "Głowica", value: "IIR dwuzakresowa" },
      { label: "Pułap", value: "10–4000 m" },
      { label: "Prędkość", value: "Mach 1.6+" },
    ]
  },
  "ZU-23-2": {
    name: "Armata p-lot ZU-23-2",
    type: "Podwójne działko przeciwlotnicze 23 mm",
    range: "2.5 km",
    effectiveness: "70%",
    description: "Radziecka podwójna armata przeciwlotnicza kal. 23 mm. Szybkostrzelność 2000 strz./min łącznie. Pomimo prostej konstrukcji nadal skuteczna przeciw nisko latającym dronom i amunicji krążącej na bliskim dystansie. Używana jako ostatnia linia obrony.",
    specs: [
      { label: "Kaliber", value: "2x 23 mm" },
      { label: "Szybkostrzelność", value: "2000 strz./min" },
      { label: "Pułap skuteczny", value: "1500 m" },
      { label: "Masa", value: "950 kg" },
    ]
  },
  "N/D — SYSTEM OBRONNY": {
    name: "System sojuszniczy",
    type: "Obiekt własnej obrony",
    range: "N/D",
    effectiveness: "N/D",
    description: "Ten obiekt jest elementem własnych sił obronnych i nie wymaga środków przeciwdziałania. Stanowi kluczowy komponent tarczy antyrakietowej chroniącej infrastrukturę krytyczną Stalowej Woli.",
    specs: [
      { label: "Klasyfikacja", value: "Sojuszniczy" },
      { label: "Rola", value: "Obrona aktywna" },
      { label: "Status", value: "Operacyjny" },
      { label: "Priorytet", value: "Krytyczny" },
    ]
  }
};

// ---- Threat catalog with model paths and metadata ----
const THREAT_CATALOG = [
  {
    id: "fpv_drone",
    name: "Dron FPV",
    designation: "UAS-X / FPV RECON",
    classification: "BPLA klasa I",
    modelPath: "/3d_models/fpv_drone.glb",
    speed: "80–140 km/h",
    range: "5–15 km",
    altitude: "50–300 m AGL",
    payload: "0.5–2 kg",
    threat: "Wysoki",
    description: "Komercyjny dron FPV używany do rozpoznania lub ataku kamikadze. Wysoka manewrowość, niski przekrój radarowy. Podatny na WRE i systemy CUAS.",
    countermeasures: ["PILICA+", "ZRN-01 WRE", "RADAR OBSERWACJI"],
    cameraDistance: 3,
  },
  {
    id: "shahed_136",
    name: "Shahed-136",
    designation: "HESA SHAHED-136 / GERAN-2",
    classification: "Amunicja krążąca",
    modelPath: "/3d_models/iranian_shahed-136_military_drone.glb",
    speed: "150–185 km/h",
    range: "1800–2500 km",
    altitude: "60–4000 m AGL",
    payload: "40–50 kg (głowica GPC)",
    threat: "Krytyczny",
    description: "Irańska amunicja krążąca eksportowana do Rosji (Geran-2). Silnik tłokowy, delta, nawigacja INS/GNSS. Odporny na podstawowe systemy WRE. Wymaga kinetycznego przechwycenia.",
    countermeasures: ["PILICA+", "PPZR PIORUN", "ZU-23-2"],
    cameraDistance: 6,
  },
  {
    id: "patriot_pac3",
    name: "MIM-104 Patriot PAC-3",
    designation: "MIM-104F PATRIOT PAC-3 MSE",
    classification: "System rakietowy OPL",
    modelPath: "/3d_models/patriot.glb",
    speed: "Mach 5+ (pocisk)",
    range: "40–160 km",
    altitude: "do 24 000 m",
    payload: "Głowica hit-to-kill",
    threat: "Sojuszniczy",
    description: "Amerykański system obrony przeciwlotniczej i przeciwrakietowej dalekiego zasięgu. Radar AN/MPQ-65 zapewnia śledzenie 100+ celów jednocześnie. Pocisk PAC-3 MSE wykorzystuje technologię kinetycznego przechwycenia (hit-to-kill).",
    countermeasures: ["N/D — SYSTEM OBRONNY"],
    cameraDistance: 8,
  },
  {
    id: "pilica",
    name: "PSR-A Pilica",
    designation: "PSR-A PILICA / PILICA+",
    classification: "System VSHORAD",
    modelPath: "/3d_models/pilica.glb",
    speed: "1000 strz./min (armaty)",
    range: "5–6.5 km",
    altitude: "do 4000 m",
    payload: "23 mm pociski, 2x rakiety Piorun",
    threat: "Sojuszniczy",
    description: "Polski przeciwlotniczy system rakietowo-artyleryjski bardzo krótkiego zasięgu (VSHORAD). Integruje podwójną armatę automatyczną kal. 23 mm oraz dwie wyrzutnie rakiet PPZR Piorun. Zaprojektowany do osłony baz lotniczych i innych kluczowych obiektów przed bezzałogowcami, śmigłowcami i pociskami manewrującymi.",
    countermeasures: ["N/D — SYSTEM OBRONNY"],
    cameraDistance: 12,
  }
];

function threatTone(threat: string): StatusTone {
  const t = threat.toLowerCase();
  if (t.includes("kryty"))     return "critical";
  if (t.includes("wysoki"))    return "warn";
  if (t.includes("sojusz"))    return "ok";
  return "info";
}

/* ============================================================
 *  COUNTERMEASURE DETAIL — używa wspólnego <Dialog>
 * ============================================================ */
function CountermeasureDialog({ cmKey, onClose }: { cmKey: string | null; onClose: () => void }) {
  const cm = cmKey ? COUNTERMEASURE_DB[cmKey] : null;

  return (
    <Dialog
      open={!!cm}
      onClose={onClose}
      eyebrow="Środek przeciwdziałania"
      title={cm?.name ?? ""}
      width="sm"
    >
      {cm && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-micro text-muted">Typ systemu</span>
            <span className="text-body text-primary">{cm.type}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-(--r-md) bg-surface-data px-3 py-2.5 flex flex-col gap-1">
              <span className="text-micro text-muted">Zasięg</span>
              <span className="text-data text-primary">{cm.range}</span>
            </div>
            <div className="rounded-(--r-md) bg-surface-data px-3 py-2.5 flex flex-col gap-1">
              <span className="text-micro text-muted">Skuteczność</span>
              <span className="text-data text-ok">{cm.effectiveness}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-micro text-muted">Opis</span>
            <p className="text-caption text-secondary leading-relaxed">{cm.description}</p>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-micro text-muted">Specyfikacja</span>
            <div className="grid grid-cols-2 gap-2">
              {cm.specs.map(({ label, value }) => (
                <div key={label} className="rounded-(--r-md) bg-surface-data px-3 py-2 flex flex-col gap-0.5">
                  <span className="text-micro text-muted">{label}</span>
                  <span className="text-data text-primary">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Dialog>
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

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color="#06b6d4" wireframe />
    </mesh>
  );
}

interface ThreatModelViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ThreatModelViewer({ isOpen, onClose }: ThreatModelViewerProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [selectedCM, setSelectedCM] = useState<string | null>(null);
  const controlsRef = useRef<{ reset: () => void } | null>(null);

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

  /* ============================================================
   *  SOFT VARIANT — v2
   * ============================================================ */
  if (VISUAL === "soft") {
    return (
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm anim-fade-in"
        onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="threat-viewer-title"
          className="relative w-[95vw] max-w-[1180px] h-[85vh] max-h-[800px] bg-surface-2 rounded-(--r-xl) elev-3 flex flex-col overflow-hidden anim-slide-down"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-4">
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-micro text-muted">Katalog 3D</span>
              <h3 id="threat-viewer-title" className="text-title text-primary truncate">
                Baza obiektów i środków przeciwdziałania
              </h3>
            </div>
            <button
              onClick={onClose}
              aria-label="Zamknij"
              className="p-1.5 rounded-(--r-sm) text-muted hover:text-primary hover:bg-surface-hover cursor-pointer transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body: split */}
          <div className="flex-1 min-h-0 flex gap-4 px-6 pb-6">
            {/* Left: 3D canvas */}
            <div className="flex-1 relative bg-surface-data rounded-(--r-lg) overflow-hidden">
              {/* Meta overlay */}
              <div className="absolute top-4 left-4 z-10 pointer-events-none flex flex-col gap-0.5">
                <span className="text-micro text-muted">Model</span>
                <span className="text-data text-primary">{threat.designation}</span>
                <span className="text-caption text-secondary">{threat.classification} · rendering PBR</span>
              </div>

              {/* Canvas controls */}
              <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1.5 bg-surface-1 elev-1 rounded-(--r-pill) p-1">
                <IconButton
                  icon={<RotateCcw />}
                  size="sm"
                  onClick={handleResetCamera}
                  tooltip="Resetuj kamerę"
                />
                <IconButton
                  icon={<Eye />}
                  size="sm"
                  active={autoRotate}
                  onClick={() => setAutoRotate(!autoRotate)}
                  tooltip={autoRotate ? "Wyłącz autorotację" : "Włącz autorotację"}
                />
                <span className="inline-flex items-center gap-1 px-2 text-micro text-muted">
                  <MousePointer className="w-3 h-3" />
                  <span>Scroll = zoom</span>
                </span>
              </div>

              {/* Three.js Canvas */}
              <Canvas
                camera={{ position: [0, 1.5, threat.cameraDistance], fov: 45 }}
                className="w-full h-full"
                gl={{ antialias: true, alpha: true }}
                shadows
              >
                <ambientLight intensity={0.55} />
                <directionalLight position={[5, 8, 5]} intensity={1.0} castShadow />
                <directionalLight position={[-3, 4, -2]} intensity={0.25} color="#bae6fd" />
                <pointLight position={[0, -2, 0]} intensity={0.12} color="#fde68a" />

                <Suspense fallback={<LoadingFallback />}>
                  <ThreatModel key={threat.id} modelPath={threat.modelPath} />
                  <ContactShadows position={[0, -1.5, 0]} opacity={0.35} scale={10} blur={2.5} far={4} />
                  <Environment preset="city" />
                </Suspense>

                <OrbitControls
                  ref={controlsRef as React.RefObject<never>}
                  autoRotate={autoRotate}
                  autoRotateSpeed={1.5}
                  enablePan={false}
                  minDistance={1.5}
                  maxDistance={15}
                  maxPolarAngle={Math.PI / 1.8}
                  minPolarAngle={0.2}
                />
              </Canvas>
            </div>

            {/* Right: info panel */}
            <div className="w-[340px] shrink-0 flex flex-col gap-4 min-h-0">
              {/* Navigation */}
              <div className="flex items-center gap-2">
                <IconButton icon={<ChevronLeft />} size="sm" onClick={handlePrev} tooltip="Poprzedni model" />
                <div className="flex-1 text-center">
                  <div className="text-heading text-primary">{threat.name}</div>
                  <div className="text-micro text-muted">{selectedIndex + 1} / {THREAT_CATALOG.length}</div>
                </div>
                <IconButton icon={<ChevronRight />} size="sm" onClick={handleNext} tooltip="Następny model" />
              </div>

              {/* Scrollable body */}
              <div className="flex-1 min-h-0 overflow-y-auto scroll-thin pr-1 flex flex-col gap-5">
                {/* Designation */}
                <div className="flex flex-col gap-1">
                  <span className="text-micro text-muted">Oznaczenie NATO</span>
                  <span className="text-data text-primary">{threat.designation}</span>
                </div>

                {/* Classification */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-micro text-muted">Klasyfikacja</span>
                  <StatusPill
                    tone={threatTone(threat.threat)}
                    size="sm"
                    dot
                    pulse={threat.threat.toLowerCase().includes("kryty")}
                  >
                    {threat.threat}
                  </StatusPill>
                </div>

                {/* Specs grid */}
                <div className="flex flex-col gap-2">
                  <span className="text-micro text-muted">Parametry techniczne</span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Prędkość", value: threat.speed },
                      { label: "Zasięg",   value: threat.range },
                      { label: "Pułap",    value: threat.altitude },
                      { label: "Ładunek",  value: threat.payload },
                    ].map(({ label, value }) => (
                      <div key={label} className="rounded-(--r-md) bg-surface-data px-3 py-2 flex flex-col gap-0.5">
                        <span className="text-micro text-muted">{label}</span>
                        <span className="text-data text-primary">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1">
                  <span className="text-micro text-muted">Analiza wywiadowcza</span>
                  <p className="text-caption text-secondary leading-relaxed">{threat.description}</p>
                </div>

                {/* Countermeasures */}
                <div className="flex flex-col gap-2">
                  <span className="text-micro text-muted">Środki przeciwdziałania</span>
                  <div className="flex flex-col gap-1.5">
                    {threat.countermeasures.map((cm) => {
                      const cmData = COUNTERMEASURE_DB[cm];
                      return (
                        <button
                          key={cm}
                          type="button"
                          onClick={() => setSelectedCM(cm)}
                          className="group flex items-center gap-3 px-3 py-2.5 rounded-(--r-md) bg-surface-data hover:bg-surface-hover transition-colors cursor-pointer text-left"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-label text-primary truncate">{cmData?.name ?? cm}</div>
                            {cmData && (
                              <div className="text-micro text-muted truncate">{cmData.type}</div>
                            )}
                          </div>
                          <span className="text-micro text-secondary group-hover:text-accent transition-colors shrink-0">
                            Szczegóły →
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <CountermeasureDialog cmKey={selectedCM} onClose={() => setSelectedCM(null)} />
      </div>
    );
  }

  /* ============================================================
   *  LEGACY VARIANT — zachowane do szybkiego rollbacku
   * ============================================================ */
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-[95vw] max-w-[1200px] h-[85vh] max-h-[800px] theme-bg-panel border theme-border rounded-lg shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b theme-border">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Crosshair className="w-5 h-5 theme-neon-text animate-pulse" />
              <span className="font-rajdhani font-extrabold tracking-widest text-[14px] theme-neon-text">BAZA OBIEKTÓW 3D</span>
            </div>
            <span className="text-[9px] theme-bg-app border theme-border px-2 py-0.5 theme-text-secondary font-mono">3D_MODEL_VIEWER v1.0</span>
          </div>
          <button onClick={onClose} className="px-3 py-1 text-[10px] font-bold font-rajdhani tracking-widest border theme-border theme-text-secondary hover:text-red-500 hover:border-red-500 transition-all cursor-pointer">
            ZAMKNIJ ✕
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          <div className="flex-1 relative bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/30">
            <Canvas camera={{ position: [0, 1.5, threat.cameraDistance], fov: 45 }} className="w-full h-full" gl={{ antialias: true, alpha: true }} shadows>
              <ambientLight intensity={0.4} />
              <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
              <directionalLight position={[-3, 4, -2]} intensity={0.3} color="#06b6d4" />
              <pointLight position={[0, -2, 0]} intensity={0.15} color="#f59e0b" />
              <Suspense fallback={<LoadingFallback />}>
                <ThreatModel key={threat.id} modelPath={threat.modelPath} />
                <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={10} blur={2.5} far={4} />
                <Environment preset="city" />
              </Suspense>
              <OrbitControls
                ref={controlsRef as React.RefObject<never>}
                autoRotate={autoRotate}
                autoRotateSpeed={1.5}
                enablePan={false}
                minDistance={1.5}
                maxDistance={15}
                maxPolarAngle={Math.PI / 1.8}
                minPolarAngle={0.2}
              />
            </Canvas>
          </div>
          <div className="w-[340px] border-l theme-border flex flex-col theme-bg-panel relative">
            <div className="p-4 text-[10px] theme-text-secondary font-mono">
              Legacy layout — przełącz VISUAL = &quot;soft&quot; w pliku, by uzyskać nowy widok.
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="secondary" onClick={handlePrev}>Poprzedni</Button>
                <Button size="sm" variant="secondary" onClick={handleNext}>Następny</Button>
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
