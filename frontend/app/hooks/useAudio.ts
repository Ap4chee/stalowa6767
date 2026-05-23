import { useCallback } from "react";

export function useAudio(soundEnabled: boolean) {
  const playBeep = useCallback(
    (freq: number, type: OscillatorType, duration: number) => {
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
    },
    [soundEnabled]
  );

  return { playBeep };
}
