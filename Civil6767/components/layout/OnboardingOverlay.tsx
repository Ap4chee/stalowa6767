'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

type SpotlightTarget = {
  /** CSS selector to find the element to spotlight */
  selector: string;
  /** Manual fallback position if selector not found */
  fallback: { top: number; left: number; width: number; height: number };
};

type Step = {
  icon: string;
  title: string;
  description: string;
  accent: string;
  /** Where to place the tooltip relative to the spotlight */
  tooltipPosition: 'right' | 'bottom' | 'left' | 'bottom-right';
  /** What to spotlight in the UI */
  target: SpotlightTarget;
  /** Numbered tips shown as a checklist */
  tips: string[];
};

const STEPS: Step[] = [
  {
    icon: 'emergency',
    title: 'Centrum dowodzenia',
    description:
      'To jest główny widok mapy. Widzisz tutaj cały region lubelski z warstwami zagrożeń, szpitalami i zgłoszeniami alarmowymi.',
    accent: 'from-primary-dark to-primary',
    tooltipPosition: 'bottom',
    target: {
      selector: 'nav[class*="fixed top-0"],.fixed.top-0.z-50,header',
      fallback: {
        top: 0,
        left: 0,
        width: 1200,
        height: 64
      }
    },
    tips: [
      'Przełączaj między widokami Mapa i Szpitale',
      'Wyszukuj lokalizacje, szpitale i gminy',
      'Steruj głosem za pomocą mikrofonu'
    ]
  },
  {
    icon: 'menu',
    title: 'Panel nawigacji',
    description:
      'Boczny panel pozwala przełączać się między kluczowymi modułami systemu.',
    accent: 'from-blue-600 to-blue-400',
    tooltipPosition: 'right',
    target: {
      selector: 'aside[class*="fixed left-0"]',
      fallback: { top: 64, left: 0, width: 72, height: 500 }
    },
    tips: [
      'Mapa — filtruj terytoria',
      'Na żywo — kamery miejskie',
      'Warstwy — włączaj/wyłączaj dane',
      'Ryzyko, Dane, Social — dodatkowe panele'
    ]
  },
  {
    icon: 'map',
    title: 'Interaktywna mapa',
    description:
      'Mapa pokazuje dane z IMGW, strefy zalewowe ISOK, kamery i markery. Klikaj na elementy, żeby otworzyć ich szczegóły po prawej stronie.',
    accent: 'from-emerald-600 to-emerald-400',
    tooltipPosition: 'bottom-right',
    target: {
      selector: '.leaflet-container',
      fallback: { top: 64, left: 72, width: 800, height: 600 }
    },
    tips: [
      '🏥 Ikony szpitali — kliknij, by zobaczyć łóżka i ryzyko',
      '📹 Kamery — podgląd na żywo z Lublina',
      '🌊 112 markery — zgłoszenia alarmowe',
      'Scroll = zoom, kliknij powiat = filtruj'
    ]
  },
  {
    icon: 'call',
    title: 'Zgłoszenia 112 i panele',
    description:
      'Po prawej stronie znajdziesz wysuwane karty z podsumowaniami: przegląd zagrożeń powodziowych, status szpitali oraz listę zgłoszeń alarmowych 112.',
    accent: 'from-red-600 to-red-400',
    tooltipPosition: 'left',
    target: {
      selector: '.animate-slide-in-right,[class*="w-[420px]"]',
      fallback: {
        top: 80,
        left: 760,
        width: 420,
        height: 500
      }
    },
    tips: [
      'Kliknij nagłówek karty, żeby ją zwinąć/rozwinąć',
      'Lista 112 — filtruj po priorytecie i kategorii',
      'Kliknij zgłoszenie, by zobaczyć pełne info',
      'Karty: Szpitale – powódż, Przegląd zagrożeń, Zgłoszenia 112'
    ]
  },
  {
    icon: 'smart_toy',
    title: 'Symulacja i predykcja ML',
    description:
      'Na karcie statusu kryzysu (u góry po lewej) znajdziesz przełącznik symulacji powodzi — włącz go, żeby zobaczyć scenariusz ewakuacji pacjentów generowany przez AI.',
    accent: 'from-violet-600 to-violet-400',
    tooltipPosition: 'right',
    target: {
      selector:
        '[class*="pointer-events-auto"]:has([class*="CrisisHeaderCard"]),.pointer-events-auto:first-child',
      fallback: { top: 80, left: 84, width: 320, height: 180 }
    },
    tips: [
      'Przełącznik „Symulacja powodzi" aktywuje scenariusz',
      'System wyznaczy trasy ewakuacji do szpitali',
      'Model ML ocenia ryzyko na podstawie danych IMGW',
      'Klawisze: M=mapa, H=szpitale, L=warstwy, Esc=zamknij'
    ]
  }
];

function getTargetRect(step: Step): DOMRect | null {
  if (typeof document === 'undefined') return null;
  // Try multiple selectors separated by comma
  const selectors = step.target.selector.split(',');
  for (const sel of selectors) {
    try {
      const el = document.querySelector(sel.trim());
      if (el) return el.getBoundingClientRect();
    } catch {
      // invalid selector, try next
    }
  }
  return null;
}

export function OnboardingOverlay({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Measure target element on step change
  useEffect(() => {
    const measure = () => {
      const rect = getTargetRect(STEPS[step]);
      setTargetRect(rect);
    };
    measure();
    // Re-measure on resize
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [step]);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const finish = useCallback(() => {
    setExiting(true);
    setTimeout(() => {
      localStorage.setItem('cd:onboarding-done', '1');
      onComplete();
    }, 400);
  }, [onComplete]);

  const next = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else finish();
  };

  const prev = () => {
    if (step > 0) setStep(s => s - 1);
  };

  const current = STEPS[step];

  // Spotlight rectangle (with padding)
  const pad = 8;
  const spot = targetRect
    ? {
        top: targetRect.top - pad,
        left: targetRect.left - pad,
        width: targetRect.width + pad * 2,
        height: targetRect.height + pad * 2
      }
    : current.target.fallback;

  // Tooltip positioning — always clamped to viewport
  const getTooltipStyle = (): React.CSSProperties => {
    const pos = current.tooltipPosition;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const tooltipH = 340; // estimated max tooltip height
    const tooltipW = 420;

    if (pos === 'right') {
      const left = spot.left + spot.width + 16;
      const fitsRight = left + tooltipW < vw - 20;
      return {
        top: Math.min(Math.max(20, spot.top), vh - tooltipH - 20),
        left: fitsRight ? left : spot.left + spot.width - tooltipW,
        maxWidth: Math.min(420, vw - left - 20)
      };
    }
    if (pos === 'left') {
      return {
        top: Math.min(Math.max(20, spot.top), vh - tooltipH - 20),
        right: vw - spot.left + 16,
        maxWidth: Math.min(420, spot.left - 40)
      };
    }
    if (pos === 'bottom-right') {
      // If bottom would go offscreen, float inside the spotlight area instead
      const bottomTop = spot.top + spot.height + 16;
      const fitsBelow = bottomTop + tooltipH < vh - 20;
      return {
        top: fitsBelow
          ? bottomTop
          : Math.max(
              20,
              spot.top + Math.round(spot.height / 2) - Math.round(tooltipH / 2)
            ),
        left: Math.min(
          Math.max(
            20,
            spot.left + Math.round(spot.width / 2) - Math.round(tooltipW / 2)
          ),
          vw - tooltipW - 20
        ),
        maxWidth: tooltipW
      };
    }
    // bottom
    const bottomTop2 = spot.top + spot.height + 16;
    const fitsBelow2 = bottomTop2 + tooltipH < vh - 20;
    return {
      top: fitsBelow2
        ? bottomTop2
        : Math.max(
            20,
            spot.top + Math.round(spot.height / 2) - Math.round(tooltipH / 2)
          ),
      left: Math.max(20, spot.left),
      maxWidth: Math.min(420, vw - spot.left - 20)
    };
  };

  return (
    <div
      ref={overlayRef}
      className={`fixed inset-0 z-[9999] transition-opacity duration-400 ${
        visible && !exiting ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* SVG mask: dark overlay with a cutout for the spotlight */}
      <svg
        className="absolute inset-0 h-full w-full"
        style={{ pointerEvents: 'none' }}
      >
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              x={spot.left}
              y={spot.top}
              width={spot.width}
              height={spot.height}
              rx="8"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.65)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* Spotlight border glow */}
      <div
        className="absolute rounded-lg border-2 border-white/40 transition-all duration-500 ease-out"
        style={{
          top: spot.top,
          left: spot.left,
          width: spot.width,
          height: spot.height,
          boxShadow:
            '0 0 0 4px rgba(114,191,68,0.3), 0 0 30px rgba(114,191,68,0.15)'
        }}
      />

      {/* Click-through blocker (but allow clicking the spotlight area) */}
      <div
        className="absolute inset-0"
        onClick={e => {
          // If click is outside spotlight, prevent interaction
          const x = e.clientX;
          const y = e.clientY;
          const inSpot =
            x >= spot.left &&
            x <= spot.left + spot.width &&
            y >= spot.top &&
            y <= spot.top + spot.height;
          if (!inSpot) e.stopPropagation();
        }}
      />

      {/* Tooltip card */}
      <div
        className={`absolute z-10 transition-all duration-300 ${
          visible && !exiting
            ? 'translate-y-0 opacity-100'
            : 'translate-y-4 opacity-0'
        }`}
        style={getTooltipStyle()}
        key={step}
      >
        <div className="rounded-xl border border-outline bg-white shadow-2xl overflow-hidden">
          {/* Gradient header */}
          <div
            className={`bg-gradient-to-r ${current.accent} px-5 py-3 flex items-center justify-between`}
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-xl text-white">
                {current.icon}
              </span>
              <div>
                <h3 className="font-headline text-sm font-bold text-white">
                  {current.title}
                </h3>
                <span className="font-headline text-[9px] font-semibold uppercase tracking-widest text-white/70">
                  Krok {step + 1} / {STEPS.length}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={finish}
              className="rounded p-1 text-white/60 transition-colors hover:bg-white/20 hover:text-white"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-4">
            <p className="text-xs leading-relaxed text-on-surface-variant">
              {current.description}
            </p>

            {/* Tips list */}
            <ul className="mt-3 space-y-1.5">
              {current.tips.map((tip, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-[11px] text-on-surface"
                >
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-surface-variant text-[9px] font-bold text-on-surface-variant">
                    {i + 1}
                  </span>
                  <span className="leading-snug">{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Step dots + navigation */}
          <div className="flex items-center justify-between border-t border-outline px-5 py-3">
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setStep(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === step
                      ? 'w-6 bg-primary-dark'
                      : i < step
                        ? 'w-1.5 bg-primary'
                        : 'w-1.5 bg-outline'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {step > 0 && (
                <button
                  type="button"
                  onClick={prev}
                  className="flex items-center gap-0.5 rounded px-2 py-1.5 text-[10px] font-semibold text-on-surface-variant transition-colors hover:bg-surface-variant"
                >
                  <span className="material-symbols-outlined text-xs">
                    arrow_back
                  </span>
                  Wstecz
                </button>
              )}
              <button
                type="button"
                onClick={next}
                className={`flex items-center gap-1 rounded-lg bg-gradient-to-r ${current.accent} px-4 py-1.5 text-[10px] font-bold text-white shadow transition-all hover:shadow-md hover:brightness-110`}
              >
                {step === STEPS.length - 1 ? (
                  <>
                    Zaczynamy!
                    <span className="material-symbols-outlined text-xs">
                      rocket_launch
                    </span>
                  </>
                ) : (
                  <>
                    Dalej
                    <span className="material-symbols-outlined text-xs">
                      arrow_forward
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
