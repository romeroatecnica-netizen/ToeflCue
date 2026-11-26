import { Clock, Pause, Play, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { TranslationBundle } from '../i18n/types';
import type { ToeflSection } from '../types/toefl';

interface SectionTimerProps {
  drillId: string;
  section: ToeflSection;
  defaultSeconds: number;
  t: TranslationBundle;
}

export function SectionTimer({ drillId, section, defaultSeconds, t }: SectionTimerProps) {
  const [preset, setPreset] = useState<number>(defaultSeconds);
  const [remaining, setRemaining] = useState<number>(defaultSeconds);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    setPreset(defaultSeconds);
    setRemaining(defaultSeconds);
    setRunning(false);
  }, [drillId, defaultSeconds]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const selectPreset = (secs: number) => {
    setRunning(false);
    setPreset(secs);
    setRemaining(secs);
  };

  const mins = String(Math.floor(remaining / 60)).padStart(2, '0');
  const secs = String(remaining % 60).padStart(2, '0');
  const timeUp = remaining === 0;

  const presets =
    section === 'speaking'
      ? [
          { label: t.timer.prep15, value: 15 },
          { label: t.timer.speak45, value: 45 },
          { label: t.timer.speak60, value: 60 },
        ]
      : [
          { label: t.timer.speak60, value: 60 },
          { label: t.timer.write180, value: 180 },
        ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5">
      <div className="flex items-center gap-2.5">
        <Clock className="h-4 w-4 text-amber-700" aria-hidden="true" />
        <span className="text-xs font-semibold text-slate-700">{t.timer.title}</span>
        <span
          className={`font-mono text-sm font-bold tabular-nums ${
            timeUp ? 'text-rose-700' : running ? 'text-emerald-700' : 'text-slate-900'
          }`}
        >
          {mins}:{secs}
        </span>
        {timeUp && (
          <span className="text-xs font-semibold text-rose-700">{t.timer.timeUp}</span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {presets.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => selectPreset(p.value)}
            className={`h-8 rounded-md px-2.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              preset === p.value
                ? 'bg-slate-900 text-white'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            {p.label}
          </button>
        ))}

        <button
          type="button"
          onClick={() => {
            if (remaining === 0) setRemaining(preset);
            setRunning((r) => !r);
          }}
          className="inline-flex h-8 items-center gap-1 rounded-md bg-amber-600 px-2.5 text-xs font-semibold text-white transition-colors hover:bg-amber-700 whitespace-nowrap shrink-0"
        >
          {running ? (
            <>
              <Pause className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t.timer.pause}</span>
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t.timer.start}</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setRunning(false);
            setRemaining(preset);
          }}
          aria-label={t.timer.reset}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 shrink-0"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
