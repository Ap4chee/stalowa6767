import { useEffect } from 'react';
import type { PanelId } from '@/lib/types';
import type { TopTab } from '@/components/layout/TopNavBar';

const PANEL_KEYS: Record<string, PanelId> = {
  '1': 'map',
  '2': 'live',
  '3': 'layers',
  '4': 'risk',
  '5': 'files'
};

type Handlers = {
  onSwitchTab: (tab: TopTab) => void;
  onTogglePanel: (panel: PanelId) => void;
  onCloseAll: () => void;
  onToggleVoice?: () => void;
};

export function useKeyboardShortcuts({
  onSwitchTab,
  onTogglePanel,
  onCloseAll,
  onToggleVoice
}: Handlers) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      // Skip when user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      // Escape → close panel / deselect
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseAll();
        return;
      }

      // M → map tab, H → hospitals tab
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        onSwitchTab('map');
        return;
      }
      if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        onSwitchTab('hospitals');
        return;
      }

      // 1-5 → toggle side panels
      const panel = PANEL_KEYS[e.key];
      if (panel) {
        e.preventDefault();
        onTogglePanel(panel);
        return;
      }

      // Space → push-to-talk
      if (e.key === ' ' && onToggleVoice) {
        e.preventDefault();
        onToggleVoice();
        return;
      }
    }

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onSwitchTab, onTogglePanel, onCloseAll, onToggleVoice]);
}
