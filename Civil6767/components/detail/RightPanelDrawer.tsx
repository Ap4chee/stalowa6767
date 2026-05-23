'use client';

import { type ReactNode } from 'react';

type Props = {
  id: string;
  label: string;
  icon: string;
  isOpen: boolean;
  onToggle: (id: string) => void;
  accentColor?: string;
  children: ReactNode;
};

export function RightPanelDrawer({
  id,
  label,
  icon,
  isOpen,
  onToggle,
  accentColor = 'text-on-surface-variant',
  children
}: Props) {
  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="group flex items-center gap-2 rounded-l border border-r-0 border-outline bg-white px-3 py-2.5 shadow-md transition-all hover:bg-surface-variant/50 hover:shadow-lg"
      >
        <span
          className={`material-symbols-outlined text-base ${accentColor} transition-colors group-hover:text-on-surface`}
        >
          {icon}
        </span>
        <span className="font-headline text-[10px] font-bold uppercase tracking-widest text-on-surface-variant transition-colors group-hover:text-on-surface">
          {label}
        </span>
        <span className="material-symbols-outlined text-sm text-on-surface-variant/60">
          chevron_left
        </span>
      </button>
    );
  }

  return (
    <div className="w-[420px] animate-slide-in-right">
      <div className="relative">
        <button
          type="button"
          onClick={() => onToggle(id)}
          className="absolute right-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded bg-surface-variant/60 transition-colors hover:bg-surface-variant"
        >
          <span className="material-symbols-outlined text-base text-on-surface-variant hover:text-critical">
            close
          </span>
        </button>
        {children}
      </div>
    </div>
  );
}
