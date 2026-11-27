import {
  AlertCircle,
  BookmarkPlus,
  CalendarCheck,
  Check,
  CheckCircle2,
  Copy,
  Flame,
  Lightbulb,
  Play,
  RotateCw,
  Scale,
  Shuffle,
  Swords,
  Target,
  Trophy,
  X,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { TOEFL_DRILLS } from '../data/toeflDrills';
import type { TranslationBundle } from '../i18n/types';
import type {
  ChallengeConfig,
  ChallengeMode,
  DrillMode,
  SupportedLang,
  ToeflDrill,
  ToeflSection,
  UserProgress,
} from '../types/toefl';
import {
  buildChallengeUrl,
  createFreshChallenge,
  generateSeedCode,
  getChallengeDeck,
} from '../utils/challenge';
import { computeOverallAccuracy } from '../utils/storage';
import { ListeningPlayer } from './ListeningPlayer';
import { SectionTimer } from './SectionTimer';

interface TrainerWorkspaceProps {
  lang: SupportedLang;
  t: TranslationBundle;
  progress: UserProgress;
  activeChallenge: ChallengeConfig | null;
  onActivateChallenge: (challenge: ChallengeConfig) => void;
  onExitChallenge: () => void;
  onRecordAnswer: (drill: ToeflDrill, isCorrect: boolean, mode: DrillMode) => void;
  onSaveRuleNote: (drill: ToeflDrill) => void;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildDeck(mode: DrillMode, mistakeIds: string[]): ToeflDrill[] {
  if (mode === 'mistakes') {
    const mistakeSet = new Set(mistakeIds);
    return shuffleArray(TOEFL_DRILLS.filter((d) => mistakeSet.has(d.id)));
  }

  if (mode === 'mixed') {
    const sections: ToeflSection[] = ['reading', 'listening', 'speaking', 'writing'];
    const picked: ToeflDrill[] = [];
    for (const sec of sections) {
      const pool = shuffleArray(TOEFL_DRILLS.filter((d) => d.section === sec));
      picked.push(...pool.slice(0, 2));
    }
    return shuffleArray(picked);
  }

  return shuffleArray(TOEFL_DRILLS.filter((d) => d.section === mode)).slice(0, 6);
}

function renderPassageWithHighlight(passage: string, term?: string) {
  if (!term) return passage;
  const idx = passage.toLowerCase().indexOf(term.toLowerCase());
  if (idx === -1) return passage;
  const before = passage.slice(0, idx);
  const match = passage.slice(idx, idx + term.length);
  const after = passage.slice(idx + term.length);
  return (
    <>
      {before}
      <mark className="rounded bg-amber-100 px-1 py-0.5 font-semibold text-slate-900">
        {match}
      </mark>
      {after}
    </>
  );
}

export function TrainerWorkspace({
  lang,
  t,
  progress,
  activeChallenge,
  onActivateChallenge,
  onExitChallenge,
  onRecordAnswer,
  onSaveRuleNote,
}: TrainerWorkspaceProps) {
  const [soloShareSeed, setSoloShareSeed] = useState<string>(() => generateSeedCode());
  const [mode, setMode] = useState<DrillMode>(() =>
    activeChallenge ? activeChallenge.mode : 'mixed'
  );
  const [deck, setDeck] = useState<ToeflDrill[]>(() =>
    activeChallenge
      ? getChallengeDeck(activeChallenge)
      : getChallengeDeck({ seed: soloShareSeed, mode: 'mixed', roundNumber: 1 })
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [roundCorrect, setRoundCorrect] = useState(0);
  const [roundAnswered, setRoundAnswered] = useState(0);
  const [roundXp, setRoundXp] = useState(0);
  const [roundDone, setRoundDone] = useState(false);
  const [savedNoteDrillId, setSavedNoteDrillId] = useState<string | null>(null);
  const [wasMistakeCleared, setWasMistakeCleared] = useState(false);

  const [challengePanelOpen, setChallengePanelOpen] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftChallenge, setDraftChallenge] = useState<ChallengeConfig>(() =>
    activeChallenge ?? {
      seed: generateSeedCode(),
      mode: 'mixed',
      roundNumber: 1,
    }
  );
  const [copiedChallenge, setCopiedChallenge] = useState(false);
  const [copiedScoreLink, setCopiedScoreLink] = useState(false);

  useEffect(() => {
    if (!activeChallenge) return;
    setMode(activeChallenge.mode);
    setDeck(getChallengeDeck(activeChallenge));
    setCurrentIdx(0);
    setSelectedOpt(null);
    setChecked(false);
    setShowHint(false);
    setRoundCorrect(0);
    setRoundAnswered(0);
    setRoundXp(0);
    setRoundDone(false);
    setSavedNoteDrillId(null);
    setWasMistakeCleared(false);
    setCopiedScoreLink(false);
  }, [activeChallenge]);

  const startRound = useCallback(
    (nextMode: DrillMode, currentMistakes: string[]) => {
      if (activeChallenge) {
        onExitChallenge();
      }
      const nextSeed = generateSeedCode();
      const nextDeck =
        nextMode === 'mistakes'
          ? buildDeck('mistakes', currentMistakes)
          : getChallengeDeck({ seed: nextSeed, mode: nextMode, roundNumber: 1 });
      setSoloShareSeed(nextSeed);
      setMode(nextMode);
      setDeck(nextDeck);
      setCurrentIdx(0);
      setSelectedOpt(null);
      setChecked(false);
      setShowHint(false);
      setRoundCorrect(0);
      setRoundAnswered(0);
      setRoundXp(0);
      setRoundDone(false);
      setSavedNoteDrillId(null);
      setWasMistakeCleared(false);
      setCopiedScoreLink(false);
    },
    [activeChallenge, onExitChallenge]
  );

  const currentDrill = deck[currentIdx] ?? null;

  const handleCheck = useCallback(() => {
    if (!currentDrill || selectedOpt === null || checked) return;
    const isCorrect = selectedOpt === currentDrill.correctIndex;
    const hadMistake = progress.mistakeIds.includes(currentDrill.id);

    setChecked(true);
    setRoundAnswered((prev) => prev + 1);
    if (isCorrect) {
      const streakBonus = progress.streak >= 2 ? 5 : 0;
      const gained = currentDrill.xpReward + streakBonus;
      setRoundCorrect((prev) => prev + 1);
      setRoundXp((prev) => prev + gained);
      setWasMistakeCleared(mode === 'mistakes' && hadMistake);
    } else {
      setWasMistakeCleared(false);
    }
    onRecordAnswer(currentDrill, isCorrect, mode);
  }, [checked, currentDrill, mode, onRecordAnswer, progress.mistakeIds, progress.streak, selectedOpt]);

  const handleContinue = useCallback(() => {
    if (!checked) return;
    if (currentIdx + 1 >= deck.length) {
      setRoundDone(true);
      return;
    }
    setCurrentIdx((prev) => prev + 1);
    setSelectedOpt(null);
    setChecked(false);
    setShowHint(false);
    setSavedNoteDrillId(null);
    setWasMistakeCleared(false);
  }, [checked, currentIdx, deck.length]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (roundDone || !currentDrill) return;

      if (!checked && ['1', '2', '3', '4'].includes(e.key)) {
        const idx = Number(e.key) - 1;
        setSelectedOpt(idx);
      } else if (!checked && (e.key === 'h' || e.key === 'H')) {
        setShowHint((prev) => !prev);
      } else if (e.key === 'Enter') {
        if (!checked && selectedOpt !== null) {
          e.preventDefault();
          handleCheck();
        } else if (checked) {
          e.preventDefault();
          handleContinue();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [checked, currentDrill, handleCheck, handleContinue, roundDone, selectedOpt]);

  const overallAccuracy = useMemo(() => computeOverallAccuracy(progress), [progress]);
  const progressPct =
    deck.length > 0
      ? Math.round(((roundDone ? deck.length : currentIdx + (checked ? 1 : 0)) / deck.length) * 100)
      : 0;

  const modeTabs: Array<{ id: DrillMode; label: string; count?: number }> = [
    { id: 'mixed', label: t.sections.mixed },
    { id: 'reading', label: t.sections.reading },
    { id: 'listening', label: t.sections.listening },
    { id: 'speaking', label: t.sections.speaking },
    { id: 'writing', label: t.sections.writing },
    { id: 'mistakes', label: t.sections.mistakes, count: progress.mistakeIds.length },
  ];

  const sectionLabel = (sec: ToeflSection) => t.sections[sec];

  return (
    <section id="trainer" className="no-print space-y-5" aria-label={t.nav.trainer}>
      {/* Stats HUD Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
          <div>
            <p className="text-xs font-medium text-slate-500">{t.hud.totalXp}</p>
            <p className="mt-0.5 text-xl font-bold text-slate-900 tabular-nums">{progress.xp}</p>
          </div>
          <Zap className="h-5 w-5 text-amber-600 shrink-0" aria-hidden="true" />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
          <div>
            <p className="text-xs font-medium text-slate-500">{t.hud.streak}</p>
            <p className="mt-0.5 text-xl font-bold text-slate-900 tabular-nums">{progress.streak}</p>
          </div>
          <Flame className="h-5 w-5 text-amber-600 shrink-0" aria-hidden="true" />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
          <div>
            <p className="text-xs font-medium text-slate-500">{t.hud.accuracy}</p>
            <p className="mt-0.5 text-xl font-bold text-slate-900 tabular-nums">{overallAccuracy}%</p>
          </div>
          <Target className="h-5 w-5 text-emerald-600 shrink-0" aria-hidden="true" />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
          <div>
            <p className="text-xs font-medium text-slate-500">{t.hud.dailyDays}</p>
            <p className="mt-0.5 text-xl font-bold text-slate-900 tabular-nums">
              {progress.dailyStreakDays}
            </p>
          </div>
          <CalendarCheck className="h-5 w-5 text-blue-800 shrink-0" aria-hidden="true" />
        </div>
      </div>

      {/* Mode Selector + New Round */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="TOEFL Section Mode"
          className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-slate-100/80 p-1"
        >
          {modeTabs.map((tab) => {
            const active = mode === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => startRound(tab.id, progress.mistakeIds)}
                className={`h-9 rounded-lg px-3 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 tabular-nums ${
                  active
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
                {typeof tab.count === 'number' && tab.count > 0 ? ` (${tab.count})` : ''}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setChallengePanelOpen((open) => !open)}
            className={`inline-flex h-10 items-center gap-1.5 rounded-lg border px-3.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              challengePanelOpen || activeChallenge
                ? 'border-blue-800 bg-blue-50 text-blue-900'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Swords className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {challengePanelOpen ? t.challenge.closeBuilder : t.challenge.openBuilder}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (activeChallenge) {
                const rotated = createFreshChallenge(
                  activeChallenge.mode,
                  activeChallenge,
                  draftName || activeChallenge.challengerName
                );
                onActivateChallenge(rotated);
              } else {
                startRound(mode, progress.mistakeIds);
              }
            }}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 whitespace-nowrap shrink-0"
          >
            <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t.trainer.startNewRound}</span>
          </button>
        </div>
      </div>

      {/* Inline Challenge Builder Panel */}
      {challengePanelOpen && (
        <div className="rounded-xl border border-blue-200 bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">{t.challenge.builderTitle}</h2>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-600">
                {t.challenge.builderSubtitle}
              </p>
            </div>
            <span className="font-mono text-xs font-semibold text-blue-800 tabular-nums">
              #{draftChallenge.seed} · {t.challenge.roundTag} {draftChallenge.roundNumber}
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr]">
            <div>
              <label htmlFor="challenge-name-input" className="block text-xs font-semibold text-slate-700">
                {t.challenge.namePlaceholder}
              </label>
              <input
                id="challenge-name-input"
                type="text"
                maxLength={24}
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder={t.challenge.namePlaceholder}
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-800 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="challenge-mode-select" className="block text-xs font-semibold text-slate-700">
                {t.challenge.modeLabel}
              </label>
              <select
                id="challenge-mode-select"
                value={draftChallenge.mode}
                onChange={(e) => {
                  const nextMode = e.target.value as ChallengeMode;
                  setDraftChallenge(createFreshChallenge(nextMode, null, draftName));
                  setCopiedChallenge(false);
                }}
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-900 focus:border-blue-800 focus:bg-white focus:outline-none"
              >
                <option value="mixed">{t.sections.mixed}</option>
                <option value="reading">{t.sections.reading}</option>
                <option value="listening">{t.sections.listening}</option>
                <option value="speaking">{t.sections.speaking}</option>
                <option value="writing">{t.sections.writing}</option>
              </select>
            </div>
          </div>

          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-600 truncate">
            {buildChallengeUrl(
              {
                ...draftChallenge,
                challengerName: draftName.trim() || undefined,
              },
              lang
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={async () => {
                const url = buildChallengeUrl(
                  {
                    ...draftChallenge,
                    challengerName: draftName.trim() || undefined,
                  },
                  lang
                );
                try {
                  await navigator.clipboard.writeText(url);
                  setCopiedChallenge(true);
                  window.setTimeout(() => setCopiedChallenge(false), 2200);
                } catch {
                  setCopiedChallenge(true);
                }
              }}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-blue-800 px-4 text-xs font-semibold text-white transition-colors hover:bg-blue-900 whitespace-nowrap shrink-0"
            >
              {copiedChallenge ? (
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>
                {copiedChallenge ? t.challenge.copiedChallengeLink : t.challenge.copyChallengeLink}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDraftChallenge((prev) => createFreshChallenge(prev.mode, prev, draftName));
                setCopiedChallenge(false);
              }}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              <Shuffle className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t.challenge.generateFreshBtn}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onActivateChallenge({
                  ...draftChallenge,
                  challengerName: draftName.trim() || undefined,
                });
                setChallengePanelOpen(false);
              }}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 whitespace-nowrap shrink-0"
            >
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t.challenge.playChallengeNow}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Drill Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-7">
        {/* Active Challenge Duel Banner */}
        {activeChallenge && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50/70 px-4 py-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-blue-900">
                <Swords className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{t.challenge.activeBannerTitle}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  #{activeChallenge.seed} · {t.challenge.roundTag} {activeChallenge.roundNumber}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-700 tabular-nums">
                {activeChallenge.targetCorrect !== undefined &&
                activeChallenge.targetTotal !== undefined ? (
                  <>
                    <span className="font-semibold">{t.challenge.targetToBeat}: </span>
                    {activeChallenge.targetCorrect}/{activeChallenge.targetTotal}
                    {activeChallenge.targetXp !== undefined ? ` · ${activeChallenge.targetXp} XP` : ''}
                    {activeChallenge.challengerName ? ` (${activeChallenge.challengerName})` : ''}
                  </>
                ) : (
                  t.challenge.freshDuelNotice
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                onExitChallenge();
                startRound(mode === 'mistakes' ? 'mixed' : mode, progress.mistakeIds);
              }}
              className="inline-flex h-8 items-center gap-1 rounded-md border border-blue-200 bg-white px-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t.challenge.exitChallenge}</span>
            </button>
          </div>
        )}

        {/* Empty Mistakes State */}
        {mode === 'mistakes' && deck.length === 0 && !roundDone && (
          <div className="py-10 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" aria-hidden="true" />
            <h2 className="mt-3 text-lg font-bold text-slate-900">{t.trainer.noMistakesEmptyTitle}</h2>
            <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-600">
              {t.trainer.noMistakesEmptyDesc}
            </p>
            <button
              type="button"
              onClick={() => startRound('mixed', progress.mistakeIds)}
              className="mt-5 inline-flex h-11 items-center rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 whitespace-nowrap shrink-0"
            >
              {t.trainer.switchMixedBtn}
            </button>
          </div>
        )}

        {/* Round Complete Summary */}
        {roundDone && (
          <div className="py-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              {activeChallenge && activeChallenge.targetCorrect !== undefined ? (
                roundCorrect > activeChallenge.targetCorrect ||
                (roundCorrect === activeChallenge.targetCorrect &&
                  roundXp > (activeChallenge.targetXp ?? 0)) ? (
                  <Trophy className="h-7 w-7 text-amber-600" aria-hidden="true" />
                ) : roundCorrect === activeChallenge.targetCorrect &&
                  roundXp === (activeChallenge.targetXp ?? 0) ? (
                  <Scale className="h-7 w-7 text-blue-800" aria-hidden="true" />
                ) : (
                  <Target className="h-7 w-7 text-blue-800" aria-hidden="true" />
                )
              ) : (
                <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
              )}
            </div>

            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
              {activeChallenge && activeChallenge.targetCorrect !== undefined
                ? roundCorrect > activeChallenge.targetCorrect ||
                  (roundCorrect === activeChallenge.targetCorrect &&
                    roundXp > (activeChallenge.targetXp ?? 0))
                  ? t.challenge.resultWin
                  : roundCorrect === activeChallenge.targetCorrect &&
                      roundXp === (activeChallenge.targetXp ?? 0)
                    ? t.challenge.resultTie
                    : t.challenge.resultLoss
                : t.trainer.roundCompleteTitle}
            </h2>
            <p className="mx-auto mt-1 max-w-lg text-sm text-slate-600">
              {t.trainer.roundCompleteSubtitle}
            </p>

            {/* Head-to-Head Duel Comparison when Challenger Score Exists */}
            {activeChallenge && activeChallenge.targetCorrect !== undefined && (
              <div className="mx-auto mt-5 grid max-w-md grid-cols-2 gap-3">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-4">
                  <p className="text-xs font-semibold text-emerald-800">{t.challenge.yourScoreLabel}</p>
                  <p className="mt-1 text-xl font-extrabold text-slate-900 tabular-nums">
                    {roundCorrect}/{deck.length} · +{roundXp} XP
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-slate-600">
                    {activeChallenge.challengerName || t.challenge.challengerScoreLabel}
                  </p>
                  <p className="mt-1 text-xl font-extrabold text-slate-900 tabular-nums">
                    {activeChallenge.targetCorrect}/{activeChallenge.targetTotal ?? deck.length} · +
                    {activeChallenge.targetXp ?? 0} XP
                  </p>
                </div>
              </div>
            )}

            <div className="mx-auto mt-4 grid max-w-md grid-cols-2 gap-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">{t.trainer.earnedXp}</p>
                <p className="mt-1 text-2xl font-extrabold text-amber-600 tabular-nums">
                  +{roundXp} XP
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">{t.trainer.roundAccuracy}</p>
                <p className="mt-1 text-2xl font-extrabold text-emerald-700 tabular-nums">
                  {roundAnswered > 0 ? Math.round((roundCorrect / roundAnswered) * 100) : 0}%
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {mode !== 'mistakes' && (
                <button
                  type="button"
                  onClick={async () => {
                    const shareConfig: ChallengeConfig = {
                      seed: activeChallenge?.seed ?? soloShareSeed,
                      mode: (activeChallenge?.mode ?? (mode === 'mixed' ? 'mixed' : mode)) as ChallengeMode,
                      roundNumber: activeChallenge?.roundNumber ?? 1,
                      challengerName: draftName.trim() || undefined,
                      targetCorrect: roundCorrect,
                      targetTotal: deck.length,
                      targetXp: roundXp,
                    };
                    const url = buildChallengeUrl(shareConfig, lang);
                    try {
                      await navigator.clipboard.writeText(url);
                      setCopiedScoreLink(true);
                      window.setTimeout(() => setCopiedScoreLink(false), 2400);
                    } catch {
                      setCopiedScoreLink(true);
                    }
                  }}
                  className="inline-flex h-11 items-center gap-1.5 rounded-lg bg-blue-800 px-5 text-sm font-semibold text-white transition-colors hover:bg-blue-900 whitespace-nowrap shrink-0"
                >
                  {copiedScoreLink ? (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Copy className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span>
                    {copiedScoreLink
                      ? t.challenge.copiedChallengeLink
                      : t.challenge.sendScoreBack}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  const nextChallenge = createFreshChallenge(
                    activeChallenge?.mode ?? (mode === 'mistakes' ? 'mixed' : (mode as ChallengeMode)),
                    activeChallenge,
                    draftName
                  );
                  setDraftChallenge(nextChallenge);
                  onActivateChallenge(nextChallenge);
                }}
                className="inline-flex h-11 items-center gap-1.5 rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 whitespace-nowrap shrink-0"
              >
                <Shuffle className="h-4 w-4" aria-hidden="true" />
                <span>{t.challenge.nextRotatingChallenge}</span>
              </button>

              {progress.mistakeIds.length > 0 && mode !== 'mistakes' && (
                <button
                  type="button"
                  onClick={() => startRound('mistakes', progress.mistakeIds)}
                  className="inline-flex h-11 items-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
                >
                  {t.trainer.reviewMissedNow} ({progress.mistakeIds.length})
                </button>
              )}
            </div>
          </div>
        )}

        {/* Active Question */}
        {!roundDone && currentDrill && (
          <div>
            {/* Progress Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <span className="font-semibold text-blue-800">
                  {sectionLabel(currentDrill.section)}
                </span>
                <span aria-hidden="true">·</span>
                <span>{currentDrill.subtype}</span>
                <span aria-hidden="true">·</span>
                <span>{currentDrill.topic}</span>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-amber-700 tabular-nums">
                  +{currentDrill.xpReward} XP
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs font-semibold text-slate-600 tabular-nums">
                <span>
                  {t.hud.questionProgress} {currentIdx + 1} / {deck.length}
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-amber-700">
                  {t.hud.roundScore}: +{roundXp}
                </span>
              </div>
            </div>

            {/* Duolingo-style Progress Bar */}
            <div
              className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-emerald-600 transition-transform duration-200 ease-out origin-left"
                style={{ transform: `scaleX(${Math.max(0.04, progressPct / 100)})` }}
              />
            </div>

            {/* Stimulus Area */}
            <div className="mt-5 space-y-3">
              {currentDrill.passage && (
                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs font-semibold text-slate-500">{t.trainer.passageLabel}</p>
                  <p lang="en" className="mt-1.5 text-[15px] leading-relaxed text-slate-800">
                    {renderPassageWithHighlight(currentDrill.passage, currentDrill.highlightTerm)}
                  </p>
                </div>
              )}

              {currentDrill.transcript && (
                <ListeningPlayer
                  drillId={currentDrill.id}
                  transcript={currentDrill.transcript}
                  t={t}
                />
              )}

              {currentDrill.recommendedTimerSeconds && (
                <SectionTimer
                  drillId={currentDrill.id}
                  section={currentDrill.section}
                  defaultSeconds={currentDrill.recommendedTimerSeconds}
                  t={t}
                />
              )}

              {currentDrill.speakingPrompt && (
                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs font-semibold text-slate-500">
                    {t.trainer.speakingPromptLabel}
                  </p>
                  <p lang="en" className="mt-1.5 text-[15px] leading-relaxed text-slate-800">
                    {currentDrill.speakingPrompt}
                  </p>
                </div>
              )}

              {currentDrill.writingContext && (
                <div className="space-y-2.5 rounded-lg border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs font-semibold text-slate-500">
                    {t.trainer.writingContextLabel}
                  </p>
                  <p lang="en" className="text-[15px] font-medium leading-relaxed text-slate-900">
                    {currentDrill.writingContext.professorPrompt}
                  </p>

                  {currentDrill.writingContext.studentA && (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700">
                        <span className="font-semibold text-slate-900">
                          {currentDrill.writingContext.studentA.name}:{' '}
                        </span>
                        <span lang="en">{currentDrill.writingContext.studentA.text}</span>
                      </div>
                      {currentDrill.writingContext.studentB && (
                        <div className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700">
                          <span className="font-semibold text-slate-900">
                            {currentDrill.writingContext.studentB.name}:{' '}
                          </span>
                          <span lang="en">{currentDrill.writingContext.studentB.text}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {(currentDrill.writingContext.readingPoint ||
                    currentDrill.writingContext.lecturePoint) && (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {currentDrill.writingContext.readingPoint && (
                        <div className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700">
                          <span className="block text-xs font-semibold text-blue-800">
                            {t.trainer.readingPointLabel}
                          </span>
                          <span lang="en" className="mt-0.5 block">
                            {currentDrill.writingContext.readingPoint}
                          </span>
                        </div>
                      )}
                      {currentDrill.writingContext.lecturePoint && (
                        <div className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700">
                          <span className="block text-xs font-semibold text-emerald-700">
                            {t.trainer.lecturePointLabel}
                          </span>
                          <span lang="en" className="mt-0.5 block">
                            {currentDrill.writingContext.lecturePoint}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Question & Hint Row */}
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <h2
                lang="en"
                className="text-base font-bold leading-snug text-slate-900 sm:text-lg"
              >
                {currentDrill.question}
              </h2>

              {!checked && (
                <button
                  type="button"
                  onClick={() => setShowHint((prev) => !prev)}
                  className="inline-flex h-9 items-center gap-1.5 self-start rounded-lg border border-amber-200 bg-amber-50 px-3 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100 whitespace-nowrap shrink-0"
                >
                  <Lightbulb className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{showHint ? t.trainer.hideHint : t.trainer.showHint}</span>
                </button>
              )}
            </div>

            {showHint && !checked && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/75 px-4 py-3 text-sm text-amber-950">
                <span className="font-semibold">{t.trainer.hintLabel}: </span>
                <span lang="en">{currentDrill.hint}</span>
              </div>
            )}

            {/* Answer Options */}
            <div className="mt-4 grid gap-2.5" role="radiogroup" aria-label={currentDrill.question}>
              {currentDrill.options.map((optionText, idx) => {
                const isSelected = selectedOpt === idx;
                const isCorrectOpt = currentDrill.correctIndex === idx;

                let cardStyle =
                  'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-800';
                if (!checked && isSelected) {
                  cardStyle = 'border-blue-800 bg-blue-50/70 text-slate-900 ring-1 ring-blue-800';
                } else if (checked && isCorrectOpt) {
                  cardStyle = 'border-emerald-500 bg-emerald-50/80 text-slate-900';
                } else if (checked && isSelected && !isCorrectOpt) {
                  cardStyle = 'border-rose-400 bg-rose-50/80 text-slate-900';
                }

                return (
                  <button
                    key={`${currentDrill.id}-opt-${idx}`}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    disabled={checked}
                    onClick={() => setSelectedOpt(idx)}
                    className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3.5 text-start text-sm leading-relaxed transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800 ${cardStyle}`}
                  >
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-bold tabular-nums ${
                        checked && isCorrectOpt
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : checked && isSelected && !isCorrectOpt
                            ? 'border-rose-600 bg-rose-600 text-white'
                            : isSelected
                              ? 'border-blue-800 bg-blue-800 text-white'
                              : 'border-slate-300 bg-slate-50 text-slate-700'
                      }`}
                    >
                      {OPTION_LETTERS[idx]}
                    </span>
                    <span lang="en" className="flex-1">
                      {optionText}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Action Bar */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-slate-500">{t.trainer.keyboardTip}</p>

              {!checked ? (
                <button
                  type="button"
                  disabled={selectedOpt === null}
                  onClick={handleCheck}
                  className="inline-flex h-11 items-center gap-2 rounded-lg bg-emerald-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 whitespace-nowrap shrink-0"
                >
                  <Check className="h-4 w-4" aria-hidden="true" />
                  <span>{t.trainer.checkAnswer}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleContinue}
                  className="inline-flex h-11 items-center gap-2 rounded-lg bg-blue-800 px-6 text-sm font-semibold text-white transition-colors hover:bg-blue-900 whitespace-nowrap shrink-0"
                >
                  <span>
                    {currentIdx + 1 >= deck.length
                      ? t.trainer.finishRound
                      : t.trainer.continueNext}
                  </span>
                </button>
              )}
            </div>

            {/* Immediate Distractor & Explanation Feedback */}
            {checked && selectedOpt !== null && (
              <div
                className={`mt-5 rounded-xl border p-4 sm:p-5 ${
                  selectedOpt === currentDrill.correctIndex
                    ? 'border-emerald-200 bg-emerald-50/60'
                    : 'border-rose-200 bg-rose-50/60'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {selectedOpt === currentDrill.correctIndex ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-emerald-700 shrink-0" aria-hidden="true" />
                        <span className="text-sm font-bold text-emerald-900">
                          {t.trainer.correctBanner} · +{currentDrill.xpReward} XP
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-5 w-5 text-rose-700 shrink-0" aria-hidden="true" />
                        <span className="text-sm font-bold text-rose-900">
                          {t.trainer.incorrectBanner}
                        </span>
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onSaveRuleNote(currentDrill);
                      setSavedNoteDrillId(currentDrill.id);
                    }}
                    className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
                  >
                    <BookmarkPlus className="h-3.5 w-3.5 text-blue-800" aria-hidden="true" />
                    <span>
                      {savedNoteDrillId === currentDrill.id
                        ? t.trainer.noteSavedToast
                        : t.trainer.saveNoteFromDrill}
                    </span>
                  </button>
                </div>

                {wasMistakeCleared && (
                  <p className="mt-1.5 text-xs font-semibold text-emerald-800">
                    {t.trainer.removedFromMistakes}
                  </p>
                )}
                {selectedOpt !== currentDrill.correctIndex && (
                  <p className="mt-1.5 text-xs font-medium text-rose-800">
                    {t.trainer.savedToMistakes}
                  </p>
                )}

                <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3.5 text-sm text-slate-800">
                  <span className="font-semibold text-slate-900">{t.trainer.keyTakeaway}: </span>
                  <span lang="en">{currentDrill.keyTakeaway}</span>
                </div>

                <div className="mt-3">
                  <p className="text-xs font-semibold text-slate-700">{t.trainer.whyOptionsWork}</p>
                  <ul className="mt-2 space-y-1.5">
                    {currentDrill.optionExplanations.map((exp, i) => {
                      const isRight = i === currentDrill.correctIndex;
                      return (
                        <li
                          key={`${currentDrill.id}-exp-${i}`}
                          className={`rounded-lg border px-3 py-2 text-xs leading-relaxed ${
                            isRight
                              ? 'border-emerald-200 bg-white text-slate-900'
                              : 'border-slate-200/80 bg-white/80 text-slate-700'
                          }`}
                        >
                          <span className="font-bold text-slate-900">{OPTION_LETTERS[i]}. </span>
                          <span lang="en">{exp}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
