import type { ToeflSection, UserProgress } from '../types/toefl';

const STORAGE_KEY = 'toeflcue_progress_v1';

export function createDefaultProgress(): UserProgress {
  return {
    version: 1,
    xp: 0,
    streak: 0,
    bestStreak: 0,
    dailyStreakDays: 0,
    lastPracticeDate: null,
    sectionStats: {
      reading: { correct: 0, total: 0 },
      listening: { correct: 0, total: 0 },
      speaking: { correct: 0, total: 0 },
      writing: { correct: 0, total: 0 },
    },
    mistakeIds: [],
    masteredIds: [],
    notes: [
      {
        id: 'starter-note-1',
        section: 'general',
        title: 'TOEFL Elimination Rule',
        content:
          'Avoid extreme modifiers ("always", "never", "exclusively") unless explicitly supported in the passage or lecture.',
        updatedAt: new Date().toISOString(),
      },
    ],
  };
}

export function loadProgress(): UserProgress {
  if (typeof window === 'undefined') return createDefaultProgress();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultProgress();
    const parsed = JSON.parse(raw) as Partial<UserProgress>;
    return sanitizeProgress(parsed);
  } catch {
    return createDefaultProgress();
  }
}

export function saveProgress(progress: UserProgress): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function sanitizeProgress(input: unknown): UserProgress {
  const fallback = createDefaultProgress();
  if (!input || typeof input !== 'object') return fallback;
  const obj = input as Record<string, unknown>;

  const safeNum = (val: unknown): number =>
    typeof val === 'number' && Number.isFinite(val) && val >= 0 ? Math.floor(val) : 0;

  const rawStats = (obj.sectionStats && typeof obj.sectionStats === 'object'
    ? obj.sectionStats
    : {}) as Record<string, unknown>;

  const parseStat = (sec: ToeflSection) => {
    const s = rawStats[sec];
    if (!s || typeof s !== 'object') return { correct: 0, total: 0 };
    const rec = s as Record<string, unknown>;
    const total = safeNum(rec.total);
    const correct = Math.min(safeNum(rec.correct), total);
    return { correct, total };
  };

  const safeStringArray = (val: unknown): string[] => {
    if (!Array.isArray(val)) return [];
    return Array.from(new Set(val.filter((item): item is string => typeof item === 'string' && item.length > 0)));
  };

  const parseNoteSection = (val: unknown): 'general' | ToeflSection => {
    if (val === 'reading' || val === 'listening' || val === 'speaking' || val === 'writing') {
      return val;
    }
    return 'general';
  };

  const rawNotes = Array.isArray(obj.notes) ? obj.notes : fallback.notes;
  const notes = rawNotes
    .filter((n): n is Record<string, unknown> => Boolean(n && typeof n === 'object'))
    .map((n, idx) => ({
      id: typeof n.id === 'string' && n.id ? n.id : `note-${idx}`,
      section: parseNoteSection(n.section),
      title: typeof n.title === 'string' ? n.title.slice(0, 120) : 'Note',
      content: typeof n.content === 'string' ? n.content.slice(0, 2000) : '',
      updatedAt: typeof n.updatedAt === 'string' ? n.updatedAt : new Date().toISOString(),
    }));

  const streak = safeNum(obj.streak);
  const bestStreak = Math.max(streak, safeNum(obj.bestStreak));

  return {
    version: 1,
    xp: safeNum(obj.xp),
    streak,
    bestStreak,
    dailyStreakDays: safeNum(obj.dailyStreakDays),
    lastPracticeDate: typeof obj.lastPracticeDate === 'string' ? obj.lastPracticeDate : null,
    sectionStats: {
      reading: parseStat('reading'),
      listening: parseStat('listening'),
      speaking: parseStat('speaking'),
      writing: parseStat('writing'),
    },
    mistakeIds: safeStringArray(obj.mistakeIds),
    masteredIds: safeStringArray(obj.masteredIds),
    notes,
  };
}

export function getTodayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function updateDailyStreak(
  lastPracticeDate: string | null,
  currentDailyStreak: number
): { dailyStreakDays: number; lastPracticeDate: string } {
  const today = getTodayIsoDate();
  if (lastPracticeDate === today) {
    return {
      dailyStreakDays: Math.max(1, currentDailyStreak),
      lastPracticeDate: today,
    };
  }
  if (!lastPracticeDate) {
    return { dailyStreakDays: 1, lastPracticeDate: today };
  }
  const last = new Date(`${lastPracticeDate}T00:00:00`);
  const now = new Date(`${today}T00:00:00`);
  const diffDays = Math.round((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 1) {
    return { dailyStreakDays: currentDailyStreak + 1, lastPracticeDate: today };
  }
  return { dailyStreakDays: 1, lastPracticeDate: today };
}

export function computeOverallAccuracy(progress: UserProgress): number {
  const sections: ToeflSection[] = ['reading', 'listening', 'speaking', 'writing'];
  let total = 0;
  let correct = 0;
  for (const s of sections) {
    total += progress.sectionStats[s].total;
    correct += progress.sectionStats[s].correct;
  }
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}
