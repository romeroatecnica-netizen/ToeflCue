import { TOEFL_DRILLS } from '../data/toeflDrills';
import type { TranslationBundle } from '../i18n/types';
import type { ToeflSection, UserProgress } from '../types/toefl';
import { getTodayIsoDate } from '../utils/storage';

interface PrintStudySheetProps {
  t: TranslationBundle;
  progress: UserProgress;
}

export function PrintStudySheet({ t, progress }: PrintStudySheetProps) {
  const missedDrills = TOEFL_DRILLS.filter((d) => progress.mistakeIds.includes(d.id));
  const sections: ToeflSection[] = ['reading', 'listening', 'speaking', 'writing'];

  return (
    <aside className="hidden print-only space-y-6 p-2 text-slate-900" aria-label={t.print.title}>
      <div className="border-b border-slate-300 pb-3">
        <h1 className="text-xl font-bold">{t.print.title}</h1>
        <p className="mt-1 text-xs text-slate-600 tabular-nums">
          {t.print.generatedOn}: {getTodayIsoDate()} · XP: {progress.xp} ·{' '}
          {t.hud.streak}: {progress.streak}
        </p>
      </div>

      <div className="print-avoid-break">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">
          {t.print.masterySummary}
        </h2>
        <div className="mt-2 grid grid-cols-4 gap-3">
          {sections.map((sec) => {
            const st = progress.sectionStats[sec];
            const pct = st.total > 0 ? Math.round((st.correct / st.total) * 100) : 0;
            return (
              <div key={sec} className="rounded border border-slate-300 p-2.5 text-xs tabular-nums">
                <p className="font-bold">{t.sections[sec]}</p>
                <p className="mt-1">
                  {pct}% ({st.correct}/{st.total})
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">
          {t.print.mistakesReviewTitle}
        </h2>
        {missedDrills.length === 0 ? (
          <p className="mt-2 text-xs text-slate-600">{t.print.noMistakesPrint}</p>
        ) : (
          <div className="mt-2 space-y-3">
            {missedDrills.map((drill, idx) => (
              <div key={drill.id} className="print-avoid-break rounded border border-slate-300 p-3">
                <p className="text-xs font-semibold text-slate-600">
                  {idx + 1}. {t.sections[drill.section]} · {drill.subtype} · {drill.topic}
                </p>
                <p className="mt-1 text-sm font-bold">{drill.question}</p>
                <p className="mt-1 text-xs">
                  <span className="font-semibold">{t.print.correctAnswerLabel}: </span>
                  {drill.options[drill.correctIndex]}
                </p>
                <p className="mt-1 text-xs text-slate-700">
                  {drill.optionExplanations[drill.correctIndex]}
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-800">{drill.keyTakeaway}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {progress.notes.length > 0 && (
        <div className="print-avoid-break">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">
            {t.print.notesTitle}
          </h2>
          <ul className="mt-2 space-y-1.5 text-xs">
            {progress.notes.map((n) => (
              <li key={n.id} className="border-b border-slate-200 pb-1.5">
                <span className="font-bold">{n.title}: </span>
                <span>{n.content}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
