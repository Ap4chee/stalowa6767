"use client";

interface PlaybookControlsProps {
  playbookActive: string | null;
  onActivatePlaybook: (id: string, name: string) => void;
  onStopPlaybook: () => void;
}

export function PlaybookControls({ playbookActive, onActivatePlaybook, onStopPlaybook }: PlaybookControlsProps) {
  return (
    <div className="flex-1 overflow-y-auto space-y-2 pr-1 terminal-scroll">
      <div className="text-[10px] theme-text-secondary font-rajdhani tracking-wider pb-1 border-b theme-border">
        <span>PROCEDURY BEZPIECZEŃSTWA (PLAYBOOKS)</span>
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <button
          onClick={() => onActivatePlaybook("SIREN", "Miejski Alarm Akustyczny Syren")}
          className="w-full text-left py-2 px-3 border border-amber-500/60 bg-amber-500/5 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 transition-all font-rajdhani font-semibold flex items-center justify-between cursor-pointer"
        >
          <span>🚨 SYRENY ALARMOWE</span>
          <span className="text-[8px] bg-amber-500/20 px-1 border border-amber-500/30">ODPAL</span>
        </button>
        <button
          onClick={() => onActivatePlaybook("ALERT_SMS", "Ogólnokrajowy System SMS RCB")}
          className="w-full text-left py-2 px-3 border border-cyan-550 bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 transition-all font-rajdhani font-semibold flex items-center justify-between cursor-pointer"
        >
          <span>📱 ALERTY SMS RCB</span>
          <span className="text-[8px] bg-cyan-500/20 px-1 border border-cyan-500/30">ODPAL</span>
        </button>
        <button
          onClick={() => onActivatePlaybook("BACKUP_GEN", "Włączenie Agregatów Przemysłowych")}
          className="w-full text-left py-2 px-3 border border-emerald-500/60 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition-all font-rajdhani font-semibold flex items-center justify-between cursor-pointer"
        >
          <span>⚡ START GENERATORÓW</span>
          <span className="text-[8px] bg-emerald-500/20 px-1 border border-emerald-500/30">ODPAL</span>
        </button>
      </div>

      {playbookActive && (
        <div className="mt-4 p-2 theme-bg-app border theme-border text-[10px] theme-neon-text">
          <div className="flex justify-between items-center font-bold mb-1 border-b theme-border pb-1">
            <span>PROCEDURA W TOKU</span>
            <button onClick={onStopPlaybook} className="text-red-500 hover:text-red-400 cursor-pointer">STOP</button>
          </div>
          <span className="theme-text-primary font-sharetech italic">
            {playbookActive === "SIREN" && "Nadawanie miejskiego ostrzeżenia dźwiękowego. Ludność skierowana do schronów."}
            {playbookActive === "ALERT_SMS" && "SMS RCB wysłany w strefie Stalowej Woli o trasie ataku korytem rzeki San."}
            {playbookActive === "BACKUP_GEN" && "Agregaty generatorów Huty i stacji pomp podtrzymują krytyczny przesył."}
          </span>
        </div>
      )}
    </div>
  );
}
