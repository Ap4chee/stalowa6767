'use client';

import type { EmergencyCall } from '@/lib/types';

const PRIORITY_META: Record<
  string,
  { label: string; bg: string; fg: string; icon: string }
> = {
  critical: {
    label: 'Krytyczne',
    bg: 'bg-red-600',
    fg: 'text-white',
    icon: 'crisis_alert'
  },
  high: {
    label: 'Wysokie',
    bg: 'bg-orange-600',
    fg: 'text-white',
    icon: 'warning'
  },
  medium: {
    label: 'Średnie',
    bg: 'bg-amber-500',
    fg: 'text-white',
    icon: 'priority_high'
  },
  low: {
    label: 'Niskie',
    bg: 'bg-gray-500',
    fg: 'text-white',
    icon: 'info'
  }
};

const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  medical: { label: 'Medyczne', icon: 'local_hospital' },
  fire: { label: 'Pożar', icon: 'local_fire_department' },
  accident: { label: 'Wypadek', icon: 'car_crash' },
  flood: { label: 'Powódź', icon: 'flood' },
  infrastructure: { label: 'Infrastruktura', icon: 'engineering' },
  other: { label: 'Inne', icon: 'report' }
};

const STATUS_META: Record<
  string,
  { label: string; color: string; icon: string }
> = {
  new: { label: 'Nowe', color: 'text-red-600', icon: 'fiber_new' },
  dispatched: {
    label: 'Dysponowane',
    color: 'text-amber-600',
    icon: 'local_shipping'
  },
  'in-progress': {
    label: 'W toku',
    color: 'text-blue-600',
    icon: 'pending_actions'
  },
  resolved: {
    label: 'Zakończone',
    color: 'text-green-600',
    icon: 'check_circle'
  }
};

function formatTime(ts: string) {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return ts;
  }
}

type Props = {
  call: EmergencyCall;
  onClose: () => void;
};

export function EmergencyCallDetailPanel({ call, onClose }: Props) {
  const priority = PRIORITY_META[call.priority] ?? PRIORITY_META.low;
  const category = CATEGORY_META[call.category] ?? CATEGORY_META.other;
  const status = STATUS_META[call.status] ?? STATUS_META.new;

  return (
    <div className="flex flex-col rounded border border-outline bg-white shadow-lg">
      {/* Priority header */}
      <div
        className={`flex items-center justify-between rounded-t px-4 py-3 pr-10 ${priority.bg}`}
      >
        <div className="flex items-center gap-2">
          <span className={`material-symbols-outlined text-lg ${priority.fg}`}>
            {priority.icon}
          </span>
          <div>
            <div
              className={`font-headline text-[10px] font-bold uppercase tracking-widest ${priority.fg}`}
            >
              Zgłoszenie 112 · {priority.label}
            </div>
            <div className={`text-xs ${priority.fg} opacity-80`}>
              {formatTime(call.timestamp)} · {category.label}
            </div>
          </div>
        </div>
      </div>

      {/* Title + description */}
      <div className="border-b border-outline px-4 py-3">
        <h3 className="font-headline text-sm font-bold text-on-surface">
          {call.title}
        </h3>
        <p className="mt-1.5 text-xs leading-relaxed text-on-surface-variant">
          {call.description}
        </p>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-px border-b border-outline bg-outline">
        <div className="flex items-center gap-2 bg-white px-4 py-2.5">
          <span className="material-symbols-outlined text-sm text-on-surface-variant">
            location_on
          </span>
          <div>
            <div className="font-headline text-[9px] uppercase tracking-wider text-on-surface-variant">
              Lokalizacja
            </div>
            <div className="text-xs font-medium text-on-surface">
              {call.location}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2.5">
          <span className={`material-symbols-outlined text-sm ${status.color}`}>
            {status.icon}
          </span>
          <div>
            <div className="font-headline text-[9px] uppercase tracking-wider text-on-surface-variant">
              Status
            </div>
            <div className={`text-xs font-bold ${status.color}`}>
              {status.label}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2.5">
          <span className="material-symbols-outlined text-sm text-on-surface-variant">
            {category.icon}
          </span>
          <div>
            <div className="font-headline text-[9px] uppercase tracking-wider text-on-surface-variant">
              Kategoria
            </div>
            <div className="text-xs font-medium text-on-surface">
              {category.label}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2.5">
          <span className="material-symbols-outlined text-sm text-on-surface-variant">
            schedule
          </span>
          <div>
            <div className="font-headline text-[9px] uppercase tracking-wider text-on-surface-variant">
              Czas zgłoszenia
            </div>
            <div className="text-xs font-medium text-on-surface">
              {formatTime(call.timestamp)}
            </div>
          </div>
        </div>
      </div>

      {/* Caller info */}
      <div className="border-b border-outline px-4 py-2.5">
        <div className="font-headline text-[9px] uppercase tracking-wider text-on-surface-variant">
          Zgłaszający
        </div>
        <div className="mt-1 flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-variant">
            <span className="material-symbols-outlined text-sm text-on-surface-variant">
              person
            </span>
          </div>
          <div>
            <div className="text-xs font-semibold text-on-surface">
              {call.callerName}
            </div>
            <div className="text-[10px] text-on-surface-variant">
              {call.callerPhone}
            </div>
          </div>
        </div>
      </div>

      {/* Assigned unit */}
      {call.assignedUnit && (
        <div className="border-b border-outline px-4 py-2.5">
          <div className="font-headline text-[9px] uppercase tracking-wider text-on-surface-variant">
            Przydzielona jednostka
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-primary-dark">
              fire_truck
            </span>
            <span className="text-xs font-bold text-on-surface">
              {call.assignedUnit}
            </span>
          </div>
        </div>
      )}

      {/* Notes */}
      {call.notes && (
        <div className="px-4 py-2.5">
          <div className="font-headline text-[9px] uppercase tracking-wider text-on-surface-variant">
            Notatki dyspozytora
          </div>
          <p className="mt-1 rounded bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900 border border-amber-200">
            {call.notes}
          </p>
        </div>
      )}
    </div>
  );
}
