import { useCallback, useEffect, useState } from 'react';
import { AdSlot } from './components/AdSlot';
import { AffiliateGearSection } from './components/AffiliateGearSection';
import { DataAndNotesPanel } from './components/DataAndNotesPanel';
import { EditorialSeoSection } from './components/EditorialSeoSection';
import { Header } from './components/Header';
import { PrintStudySheet } from './components/PrintStudySheet';
import { SectionMasterySvg } from './components/SectionMasterySvg';
import { TrainerWorkspace } from './components/TrainerWorkspace';
import {
  detectInitialLanguage,
  getLangMeta,
  syncHeadSeo,
} from './config/seo';
import { getTranslations } from './i18n';
import type {
  DrillMode,
  StudyNote,
  SupportedLang,
  ToeflDrill,
  UserProgress,
} from './types/toefl';
import {
  createDefaultProgress,
  loadProgress,
  saveProgress,
  updateDailyStreak,
} from './utils/storage';

export default function App() {
  const [lang, setLang] = useState<SupportedLang>(() => detectInitialLanguage());
  const [progress, setProgress] = useState<UserProgress>(() => loadProgress());

  const t = getTranslations(lang);
  const langMeta = getLangMeta(lang);

  useEffect(() => {
    syncHeadSeo({
      lang,
      title: t.seo.title,
      description: t.seo.description,
      howToName: t.seo.howToName,
      howToDescription: t.seo.howToDescription,
      howToSteps: t.seo.howToSteps,
      faqs: t.editorial.faqs,
    });
  }, [lang, t]);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const handleChangeLang = useCallback((nextLang: SupportedLang) => {
    setLang(nextLang);
    try {
      window.localStorage.setItem('toeflcue_lang', nextLang);
    } catch {
      // Ignore storage access errors
    }
    if (typeof window !== 'undefined') {
      const nextUrl = new URL(window.location.href);
      if (nextLang === 'en') {
        nextUrl.searchParams.delete('lang');
      } else {
        nextUrl.searchParams.set('lang', nextLang);
      }
      const relativeTarget = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
      window.history.replaceState(null, '', relativeTarget);
    }
  }, []);

  const handleRecordAnswer = useCallback(
    (drill: ToeflDrill, isCorrect: boolean, mode: DrillMode) => {
      setProgress((prev) => {
        const secStat = prev.sectionStats[drill.section];
        const nextStreak = isCorrect ? prev.streak + 1 : 0;
        const streakBonus = isCorrect && prev.streak >= 2 ? 5 : 0;
        const gainedXp = isCorrect ? drill.xpReward + streakBonus : 0;
        const daily = updateDailyStreak(prev.lastPracticeDate, prev.dailyStreakDays);

        let nextMistakes = [...prev.mistakeIds];
        let nextMastered = [...prev.masteredIds];

        if (isCorrect) {
          if (mode === 'mistakes') {
            nextMistakes = nextMistakes.filter((id) => id !== drill.id);
          }
          if (!nextMastered.includes(drill.id)) {
            nextMastered.push(drill.id);
          }
        } else {
          if (!nextMistakes.includes(drill.id)) {
            nextMistakes.push(drill.id);
          }
        }

        return {
          ...prev,
          xp: prev.xp + gainedXp,
          streak: nextStreak,
          bestStreak: Math.max(prev.bestStreak, nextStreak),
          dailyStreakDays: daily.dailyStreakDays,
          lastPracticeDate: daily.lastPracticeDate,
          sectionStats: {
            ...prev.sectionStats,
            [drill.section]: {
              correct: secStat.correct + (isCorrect ? 1 : 0),
              total: secStat.total + 1,
            },
          },
          mistakeIds: nextMistakes,
          masteredIds: nextMastered,
        };
      });
    },
    []
  );

  const handleSaveRuleNote = useCallback((drill: ToeflDrill) => {
    setProgress((prev) => {
      const exists = prev.notes.some(
        (n) => n.title === `${drill.topic} (${drill.subtype})` && n.content === drill.keyTakeaway
      );
      if (exists) return prev;
      const note: StudyNote = {
        id: `note-${drill.id}-${Date.now()}`,
        section: drill.section,
        title: `${drill.topic} (${drill.subtype})`,
        content: drill.keyTakeaway,
        updatedAt: new Date().toISOString(),
      };
      return {
        ...prev,
        notes: [note, ...prev.notes],
      };
    });
  }, []);

  const handleAddNote = useCallback((note: StudyNote) => {
    setProgress((prev) => ({
      ...prev,
      notes: [note, ...prev.notes],
    }));
  }, []);

  const handleDeleteNote = useCallback((id: string) => {
    setProgress((prev) => ({
      ...prev,
      notes: prev.notes.filter((n) => n.id !== id),
    }));
  }, []);

  const handleImportProgress = useCallback((next: UserProgress) => {
    setProgress(next);
  }, []);

  const handleResetProgress = useCallback(() => {
    setProgress(createDefaultProgress());
  }, []);

  return (
    <div dir={langMeta.dir} className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <Header lang={lang} t={t} onChangeLang={handleChangeLang} />

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-7 sm:px-6 sm:py-9">
        {/* Hero Intro */}
        <div className="no-print max-w-3xl">
          <h1
            className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl"
            style={{ textWrap: 'balance' }}
          >
            {t.hero.h1}
          </h1>
          <p className="mt-2.5 text-sm leading-relaxed text-slate-600 sm:text-base">
            {t.hero.subtitle}
          </p>
        </div>

        {/* Duolingo-Style TOEFL Trainer */}
        <TrainerWorkspace
          t={t}
          progress={progress}
          onRecordAnswer={handleRecordAnswer}
          onSaveRuleNote={handleSaveRuleNote}
        />

        {/* Static SVG Mastery Visualization */}
        <SectionMasterySvg progress={progress} t={t} />

        {/* JSON Backup, Study Notes & Print */}
        <DataAndNotesPanel
          lang={lang}
          t={t}
          progress={progress}
          onImportProgress={handleImportProgress}
          onResetProgress={handleResetProgress}
          onAddNote={handleAddNote}
          onDeleteNote={handleDeleteNote}
        />

        {/* Media.net Ad Slot (Between Trainer/Chart and Editorial Guide) */}
        <AdSlot slotId="medianet-toeflcue-mid" placement="top" t={t} />

        {/* Contextual Study Gear / Affiliate Block */}
        <AffiliateGearSection t={t} />

        {/* SEO Editorial Guide, Connectors & Interactive FAQ */}
        <EditorialSeoSection t={t} />

        {/* Media.net Bottom Ad Slot */}
        <AdSlot slotId="medianet-toeflcue-bottom" placement="bottom" t={t} />

        {/* Dedicated Print-Only Mistake & Notes Sheet */}
        <PrintStudySheet t={t} progress={progress} />
      </main>

      <footer className="no-print border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>{t.footer.copyright}</p>
          <p>{t.footer.canonicalNote}</p>
        </div>
      </footer>
    </div>
  );
}
