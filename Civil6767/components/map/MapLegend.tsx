'use client';

import { useState } from 'react';
import type { LayerToggles } from '@/lib/types';

type Props = {
  layerToggles: LayerToggles;
};

const LEGEND_ITEMS = [
  {
    group: 'Szpitale',
    layer: 'hospitals' as keyof LayerToggles,
    items: [
      {
        color: '#2d6c00',
        label: 'Dostępny (≥30% wolnych łóżek)',
        shape: 'circle'
      },
      { color: '#d97706', label: 'Ograniczony (10–30%)', shape: 'circle' },
      { color: '#bb0013', label: 'Krytyczny (<10%)', shape: 'circle' },
      { color: '#ff0000', label: 'Zagrożenie powodziowe (stacja)', shape: 'ring' }
    ]
  },
  {
    group: 'Kamery miejskie',
    layer: 'cameras' as keyof LayerToggles,
    items: [
      { color: '#ef3b3b', label: 'Kamera (kliknij aby otworzyć feed)', shape: 'camera' },
      { color: '#ef3b3b', label: 'Klaster kamer przy oddaleniu', shape: 'camera-cluster' }
    ]
  },
  {
    group: 'Rzeki i hydrografia',
    layer: 'floodZones' as keyof LayerToggles,
    items: [
      { color: '#2563eb', label: 'Rzeki (Wody Polskie ISOK)', shape: 'river' },
      { color: '#0ea5e9', label: 'Stacja hydro – niskie ryzyko', shape: 'station' },
      { color: '#d97706', label: 'Stacja hydro – umiarkowane', shape: 'station' },
      { color: '#bb0013', label: 'Stacja hydro – wysokie', shape: 'station' }
    ]
  },
  {
    group: 'Strefy zalewowe',
    layer: 'floodZones' as keyof LayerToggles,
    items: [
      {
        color: 'rgba(59,130,246,0.45)',
        label: 'ISOK – woda 100-letnia',
        shape: 'fill'
      }
    ]
  },
  {
    group: 'Granice administracyjne',
    layer: null,
    items: [
      { color: '#72bf44', label: 'Powiat / Gmina', shape: 'border' },
      { color: '#ed1c24', label: 'Zaznaczony obszar', shape: 'border-selected' }
    ]
  }
];

function ShapeIcon({ shape, color }: { shape: string; color: string }) {
  switch (shape) {
    case 'circle':
      return (
        <span
          className="inline-block h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: color, border: `2px solid ${color}` }}
        />
      );
    case 'circle-sm':
      return (
        <span
          className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
          style={{
            backgroundColor: color,
            opacity: 0.7,
            border: `2px solid ${color}`
          }}
        />
      );
    case 'diamond':
      return (
        <span
          className="inline-block h-2.5 w-2.5 shrink-0"
          style={{
            backgroundColor: color,
            opacity: 0.85,
            border: `2px solid ${color}`,
            transform: 'rotate(45deg)'
          }}
        />
      );
    case 'station':
      return (
        <span
          className="relative inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-white"
          style={{
            backgroundColor: color,
            border: '2px solid #ffffff',
            boxShadow: `0 0 0 1.5px ${color}`
          }}
        >
          <svg viewBox="0 0 16 16" width="7" height="7" aria-hidden="true">
            <path
              fill="#ffffff"
              d="M2 4c2-2 4-2 6 0s4 2 6 0v2c-2 2-4 2-6 0s-4-2-6 0V4zm0 5c2-2 4-2 6 0s4 2 6 0v2c-2 2-4 2-6 0s-4-2-6 0V9z"
            />
          </svg>
        </span>
      );
    case 'camera':
      return (
        <span
          className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] text-white"
          style={{
            background: 'linear-gradient(180deg,#ef3b3b 0%,#b50d0d 100%)',
            border: '1.5px solid #ffffff',
            boxShadow: '0 0 0 1px #6d1111',
            transform: 'rotate(-6deg)'
          }}
        >
          <svg viewBox="0 0 24 24" width="9" height="9" aria-hidden="true">
            <path
              fill="#ffffff"
              d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z"
            />
          </svg>
        </span>
      );
    case 'camera-cluster':
      return (
        <span
          className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[7px] font-black text-white"
          style={{
            background: 'radial-gradient(circle at 30% 30%,#ff5a5a 0%,#b50d0d 80%)',
            border: '1.5px solid #ffffff',
            boxShadow: '0 0 0 1px #6d1111'
          }}
        >
          6
        </span>
      );
    case 'river':
      return (
        <span
          className="relative inline-flex h-3 w-5 shrink-0 items-center"
          aria-hidden
        >
          <svg viewBox="0 0 32 12" width="20" height="12">
            <path
              d="M0 6 C 6 0, 10 12, 16 6 S 26 0, 32 6"
              stroke={color}
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              opacity="0.9"
            />
          </svg>
        </span>
      );
    case 'ring':
      return (
        <span
          className="inline-block h-3 w-3 shrink-0 rounded-full"
          style={{
            backgroundColor: 'transparent',
            border: `2px dashed ${color}`
          }}
        />
      );
    case 'cluster':
      return (
        <span
          className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[8px] font-black text-white"
          style={{ backgroundColor: color, border: '2px solid #6d1111' }}
        >
          6
        </span>
      );
    case 'fill':
      return (
        <span
          className="inline-block h-3 w-4 shrink-0 rounded-sm"
          style={{ backgroundColor: color }}
        />
      );
    case 'border':
      return (
        <span
          className="inline-block h-3 w-4 shrink-0 rounded-sm"
          style={{
            backgroundColor: `${color}10`,
            border: `1.5px solid ${color}`
          }}
        />
      );
    case 'border-selected':
      return (
        <span
          className="inline-block h-3 w-4 shrink-0 rounded-sm"
          style={{
            backgroundColor: `${color}30`,
            border: `2px solid ${color}`
          }}
        />
      );
    default:
      return null;
  }
}

export function MapLegend({ layerToggles }: Props) {
  const [expanded, setExpanded] = useState(false);

  const visibleGroups = LEGEND_ITEMS.filter(g => {
    if (!g.layer) return true; // always show boundaries
    return layerToggles[g.layer];
  });

  return (
    <div className="fixed bottom-14 right-3 z-[500]">
      {expanded ? (
        <div className="w-56 rounded border border-outline bg-white/95 shadow-xl backdrop-blur-sm animate-slide-in-right">
          {/* Header */}
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="flex w-full items-center justify-between border-b border-outline px-3 py-2 transition-colors hover:bg-surface-variant/50"
          >
            <span className="font-headline text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              Legenda
            </span>
            <span className="material-symbols-outlined text-sm text-on-surface-variant">
              expand_more
            </span>
          </button>

          {/* Content */}
          <div className="max-h-72 overflow-y-auto p-2 thin-scrollbar">
            {visibleGroups.map(group => (
              <div key={group.group} className="mb-2 last:mb-0">
                <div className="mb-1 px-1 font-headline text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">
                  {group.group}
                </div>
                <div className="flex flex-col gap-0.5">
                  {group.items.map(item => (
                    <div
                      key={item.label}
                      className="flex items-center gap-2 rounded px-1.5 py-0.5"
                    >
                      <ShapeIcon shape={item.shape} color={item.color} />
                      <span className="font-headline text-[10px] text-on-surface">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex items-center gap-1.5 rounded border border-outline bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm transition-all hover:bg-surface-variant/50 hover:shadow-xl"
        >
          <span className="material-symbols-outlined text-base text-primary-dark">
            legend_toggle
          </span>
          <span className="font-headline text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            Legenda
          </span>
          <span className="material-symbols-outlined text-sm text-on-surface-variant">
            expand_less
          </span>
        </button>
      )}
    </div>
  );
}
