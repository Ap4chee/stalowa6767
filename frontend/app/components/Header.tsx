"use client";

import { Volume2, VolumeX, Sun, Moon, Network, Crosshair, Brain } from "lucide-react";
import { Button, IconButton } from "../ui";
import { LogType } from "../types";

interface HeaderProps {
  defcon: number;
  clockTime: string;
  soundEnabled: boolean;
  onToggleSound: () => void;
  schemaModeEnabled: boolean;
  onToggleSchemaMode: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onOpenThreatViewer: () => void;
  strategOpen: boolean;
  onToggleStrateg: () => void;
  onAddLog?: (text: string, type: LogType) => void;
}

type DefconMeta = {
  label: string;
  bg: string;
  textTone: string;
  dotVar: string;
  pulse: boolean;
};

const defconMeta: Record<number, DefconMeta> = {
  5: { label: "Stan pokoju",     bg: "bg-surface-data",  textTone: "text-ok",       dotVar: "bg-(--ok)",       pulse: false },
  4: { label: "Czujność",        bg: "bg-surface-data",  textTone: "text-info",     dotVar: "bg-(--info)",     pulse: false },
  3: { label: "Gotowość bojowa", bg: "bg-warn-soft",     textTone: "text-warn",     dotVar: "bg-(--warn)",     pulse: false },
  2: { label: "Zagrożenie",      bg: "bg-error-soft",    textTone: "text-error",    dotVar: "bg-(--error)",    pulse: true  },
  1: { label: "Aktywny nalot",   bg: "bg-critical-soft", textTone: "text-critical", dotVar: "bg-(--critical)", pulse: true  }
};

export function Header({
  defcon,
  clockTime,
  soundEnabled,
  onToggleSound,
  schemaModeEnabled,
  onToggleSchemaMode,
  theme,
  onToggleTheme,
  onOpenThreatViewer,
  strategOpen,
  onToggleStrateg
}: HeaderProps) {
  const meta = defconMeta[defcon] || defconMeta[5];

  return (
    <header className="fixed top-3 left-3 right-3 z-60 h-14 bg-surface-1 elev-2 rounded-(--r-lg) flex items-center pl-3 pr-2.5 gap-3">
      {/* Brand */}
      <div className="flex items-center gap-2.5 pr-1">
        <div className="w-8 h-8 rounded-(--r-sm) bg-(--text-1) flex items-center justify-center">
          <span className="text-(--canvas) font-semibold text-caption leading-none">S</span>
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-heading text-primary tracking-tight">Steel Sentinel</span>
          <span className="text-micro text-muted">Stalowa Wola · Digital Twin</span>
        </div>
      </div>

      {/* DEFCON — unified chip (escalates with status) */}
      <div
        className={[
          "flex items-center gap-3 pl-3 pr-3.5 h-10 rounded-(--r-md) border border-subtle",
          meta.bg
        ].join(" ")}
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.dotVar} ${meta.pulse ? "anim-pulse" : ""}`} />
        <span className="text-display text-primary leading-none">{defcon}</span>
        <div className="flex flex-col leading-tight">
          <span className="text-micro text-muted">DEFCON</span>
          <span className={`text-label ${meta.textTone}`}>{meta.label}</span>
        </div>
      </div>

      <div className="flex-1" />

      {/* Clock */}
      <div className="flex items-baseline gap-1.5 pr-1">
        <span className="text-data text-primary">{clockTime || "--:--:--"}</span>
        <span className="text-micro text-muted">UTC</span>
      </div>

      {/* Action cluster — named view shortcuts + preference toggles */}
      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          icon={<Network className="w-3.5 h-3.5" />}
          active={schemaModeEnabled}
          kbd="S"
          onClick={onToggleSchemaMode}
          title="Otwórz schemat zależności sieci przesyłowych"
        >
          Schemat sieci
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon={<Crosshair className="w-3.5 h-3.5" />}
          kbd="M"
          onClick={onOpenThreatViewer}
          title="Otwórz katalog 3D zagrożeń i środków przeciwdziałania"
        >
          Katalog 3D
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon={<Brain className="w-3.5 h-3.5" />}
          active={strategOpen}
          kbd="A"
          onClick={onToggleStrateg}
          title="STRATEG AI — analiza strategiczna z wizją mapy"
        >
          STRATEG AI
        </Button>
        <span className="w-px h-5 bg-(--border-subtle) mx-1" />
        <IconButton
          icon={theme === "light" ? <Moon /> : <Sun />}
          onClick={onToggleTheme}
          tooltip={theme === "light" ? "Tryb ciemny" : "Tryb jasny"}
        />
        <IconButton
          icon={soundEnabled ? <Volume2 /> : <VolumeX />}
          active={soundEnabled}
          onClick={onToggleSound}
          tooltip={soundEnabled ? "Wycisz" : "Włącz dźwięki"}
        />
      </div>
    </header>
  );
}
