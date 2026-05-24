"use client";

import { useEffect } from "react";

export type ShortcutMap = Record<string, (e: KeyboardEvent) => void>;

/**
 * Register global keyboard shortcuts.
 * Keys are case-insensitive. Use "shift+s", "alt+1", etc. for modifiers.
 * Shortcuts are ignored when focus is inside an input/textarea/select/contenteditable.
 */
export function useKeyboardShortcuts(shortcuts: ShortcutMap, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          target.isContentEditable
        ) {
          // Allow Escape to bubble through inputs (handy for closing dialogs)
          if (e.key !== "Escape") return;
        }
      }

      const parts: string[] = [];
      if (e.ctrlKey || e.metaKey) parts.push("mod");
      if (e.shiftKey) parts.push("shift");
      if (e.altKey) parts.push("alt");

      const key = e.key.toLowerCase();
      // Normalise the key part
      const keyPart = key === " " ? "space" : key;
      parts.push(keyPart);

      const combo = parts.join("+");
      const fn = shortcuts[combo] || shortcuts[keyPart];
      if (fn) {
        fn(e);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shortcuts, enabled]);
}
