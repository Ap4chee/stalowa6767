"use client";

import { useEffect, useState } from "react";
import { Play, RotateCcw, Pause } from "lucide-react";
import { Panel, Button, StatusPill, Kbd } from "../ui";
import { Threat } from "../types";

interface ScenariosPanelProps {
  threats: Threat[];
  onLaunchScenario: (index: number) => void;
  onReset: () => void;
  simSpeed: number;
  onTogglePause: () => void;
}

const SCENARIOS: Array<{
  kbd: string;
  title: string;
  hint: string;
  duration: string;
  featured?: boolean;
}> = [
  { kbd: "1", title: "Rój dronów rozpoznawczych", hint: "3 drony · HSW, GPZ, MZK", duration: "~45 s" },
  { kbd: "2", title: "Shahed korytem Sanu", hint: "2 jednostki · ukrycie w dolinie", duration: "~60 s" },
  { kbd: "3", title: "Taktyczna rakieta manewrująca", hint: "1 pocisk · cel: Huta SW", duration: "~25 s" },
  { kbd: "4", title: "Saturacyjny atak kombinowany", hint: "Rakieta + Shahed + dron", duration: "~70 s", featured: true }
];

export function ScenariosPanel({
  threats,
  onLaunchScenario,
  onReset,
  simSpeed,
  onTogglePause
}: ScenariosPanelProps) {
  const activeThreats = threats.filter(t => t.status === "FLYING").length;
  const simRunning = activeThreats > 0;
  const paused = simSpeed === 0;

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!simRunning) setActiveIndex(null);
  }, [simRunning]);

  const handleLaunch = (index: number) => {
    setActiveIndex(index);
    onLaunchScenario(index);
  };

  return (
    <Panel variant="floating" rounded="xl" className="flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div className="flex flex-col leading-tight">
          <span className="text-micro text-muted">Symulacja</span>
          <span className="text-title text-primary">Scenariusze ataku</span>
        </div>
        {simRunning ? (
          <StatusPill tone="error" size="xs" dot pulse>{activeThreats} aktywne</StatusPill>
        ) : paused ? (
          <StatusPill tone="warn" size="xs" dot>Pauza</StatusPill>
        ) : (
          <StatusPill tone="ok" size="xs" dot>Gotowy</StatusPill>
        )}
      </div>

      <div className="flex flex-col px-3 pb-2 gap-0.5">
        {SCENARIOS.map((s) => {
          const isActive = activeIndex === Number(s.kbd) && simRunning;
          return (
            <ScenarioRow
              key={s.kbd}
              kbd={s.kbd}
              title={s.title}
              hint={s.hint}
              duration={s.duration}
              featured={s.featured}
              active={isActive}
              onClick={() => handleLaunch(Number(s.kbd))}
            />
          );
        })}
      </div>

      <div className="flex items-center gap-2 px-3 pt-2 pb-3 border-t border-subtle">
        <Button
          variant="ghost"
          size="sm"
          icon={<RotateCcw className="w-3.5 h-3.5" />}
          onClick={onReset}
        >
          Reset
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon={paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          onClick={onTogglePause}
          active={paused}
          className="ml-auto"
        >
          {paused ? "Wznów" : "Pauza"}
        </Button>
      </div>
    </Panel>
  );
}

interface ScenarioRowProps {
  kbd: string;
  title: string;
  hint: string;
  duration: string;
  featured?: boolean;
  active?: boolean;
  onClick: () => void;
}

function ScenarioRow({ kbd, title, hint, duration, featured, active, onClick }: ScenarioRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center gap-3 px-2 py-2 rounded-(--r-md) transition-colors cursor-pointer text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-(--accent) ${
        active ? "bg-error-soft" : "hover:bg-surface-hover"
      }`}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-full bg-(--error)" />
      )}
      <Kbd>{kbd}</Kbd>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-body truncate ${active ? "text-error font-medium" : "text-primary"}`}>
            {title}
          </span>
          {active ? (
            <span className="flex items-center gap-1 text-micro text-error shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-(--error) anim-pulse" />
              W toku
            </span>
          ) : featured ? (
            <span className="text-micro text-accent shrink-0">Polecane</span>
          ) : null}
        </div>
        <span className="text-micro text-muted block truncate">{hint}</span>
      </div>
      <span className="text-micro text-muted shrink-0 tabular-nums">{duration}</span>
    </button>
  );
}
