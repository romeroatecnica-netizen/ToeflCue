export type SupportedLang =
  | 'en'
  | 'es'
  | 'fr'
  | 'de'
  | 'pt'
  | 'ar'
  | 'hi'
  | 'ru'
  | 'zh'
  | 'ja';

export type ToeflSection = 'reading' | 'listening' | 'speaking' | 'writing';

export type DrillMode = 'mixed' | ToeflSection | 'mistakes';

export interface TranscriptLine {
  speaker: string;
  text: string;
}

export interface ToeflDrill {
  id: string;
  section: ToeflSection;
  subtype: string;
  topic: string;
  xpReward: number;
  passage?: string;
  highlightTerm?: string;
  transcript?: TranscriptLine[];
  speakingPrompt?: string;
  writingContext?: {
    professorPrompt: string;
    studentA?: { name: string; text: string };
    studentB?: { name: string; text: string };
    readingPoint?: string;
    lecturePoint?: string;
  };
  recommendedTimerSeconds?: number;
  question: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  hint: string;
  optionExplanations: [string, string, string, string];
  keyTakeaway: string;
}

export interface SectionStat {
  correct: number;
  total: number;
}

export interface StudyNote {
  id: string;
  section: ToeflSection | 'general';
  title: string;
  content: string;
  updatedAt: string;
}

export interface UserProgress {
  version: 1;
  xp: number;
  streak: number;
  bestStreak: number;
  dailyStreakDays: number;
  lastPracticeDate: string | null;
  sectionStats: Record<ToeflSection, SectionStat>;
  mistakeIds: string[];
  masteredIds: string[];
  notes: StudyNote[];
}

export interface LangMeta {
  code: SupportedLang;
  nativeName: string;
  ogLocale: string;
  dir: 'ltr' | 'rtl';
}
