import { CANONICAL_ORIGIN } from '../config/seo';
import { TOEFL_DRILLS } from '../data/toeflDrills';
import type { ChallengeConfig, ChallengeMode, SupportedLang, ToeflDrill, ToeflSection } from '../types/toefl';

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seedNum: number): () => number {
  let a = seedNum >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(items: T[], rng: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function generateSeedCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

function encodeUtf8Base64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeUtf8Base64Url(token: string): string | null {
  try {
    const normalized = token.replace(/-/g, '+').replace(/_/g, '/');
    const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
    const binary = atob(normalized + pad);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

const MODE_SHORT: Record<ChallengeMode, string> = {
  mixed: 'm',
  reading: 'r',
  listening: 'l',
  speaking: 's',
  writing: 'w',
};

const SHORT_TO_MODE: Record<string, ChallengeMode> = {
  m: 'mixed',
  r: 'reading',
  l: 'listening',
  s: 'speaking',
  w: 'writing',
};

export function encodeChallengeToken(config: ChallengeConfig): string {
  const cleanName = (config.challengerName ?? '').replace(/\|/g, ' ').trim().slice(0, 24);
  const parts = [
    'v1',
    config.seed.replace(/[^A-Za-z0-9]/g, '').slice(0, 12) || generateSeedCode(),
    MODE_SHORT[config.mode] ?? 'm',
    String(Math.max(1, Math.floor(config.roundNumber || 1))),
    config.targetCorrect !== undefined ? String(Math.max(0, Math.floor(config.targetCorrect))) : '',
    config.targetTotal !== undefined ? String(Math.max(0, Math.floor(config.targetTotal))) : '',
    config.targetXp !== undefined ? String(Math.max(0, Math.floor(config.targetXp))) : '',
    cleanName,
  ];
  return encodeUtf8Base64Url(parts.join('|'));
}

export function decodeChallengeToken(token: string | null | undefined): ChallengeConfig | null {
  if (!token) return null;
  const raw = decodeUtf8Base64Url(token.trim());
  if (!raw) return null;

  const parts = raw.split('|');
  if (parts.length < 4 || parts[0] !== 'v1') return null;

  const seed = parts[1];
  const mode = SHORT_TO_MODE[parts[2]];
  const roundNumber = Number.parseInt(parts[3], 10);

  if (!seed || !mode || !Number.isFinite(roundNumber) || roundNumber < 1) {
    return null;
  }

  const parseOptInt = (val: string | undefined): number | undefined => {
    if (!val) return undefined;
    const n = Number.parseInt(val, 10);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  };

  const targetCorrect = parseOptInt(parts[4]);
  const targetTotal = parseOptInt(parts[5]);
  const targetXp = parseOptInt(parts[6]);
  const challengerName = parts[7] ? parts[7].trim().slice(0, 24) : undefined;

  return {
    seed,
    mode,
    roundNumber,
    challengerName: challengerName || undefined,
    targetCorrect,
    targetTotal,
    targetXp,
  };
}

export function readChallengeFromLocation(): ChallengeConfig | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return decodeChallengeToken(params.get('c'));
}

export function buildChallengeUrl(config: ChallengeConfig, lang: SupportedLang): string {
  const token = encodeChallengeToken(config);
  const url = new URL(`${CANONICAL_ORIGIN}/`);
  if (lang !== 'en') {
    url.searchParams.set('lang', lang);
  }
  url.searchParams.set('c', token);
  return url.toString();
}

/**
 * Deterministically builds a challenge deck from (seed, mode, roundNumber).
 * Changing roundNumber (e.g. 1 -> 2 -> 3) rotates smoothly through non-overlapping
 * slices of the 52-drill bank so each new challenge delivers fresh questions.
 */
export function getChallengeDeck(config: ChallengeConfig): ToeflDrill[] {
  const baseRng = mulberry32(hashString(`${config.seed}:${config.mode}`));

  if (config.mode === 'mixed') {
    const sections: ToeflSection[] = ['reading', 'listening', 'speaking', 'writing'];
    const perSectionCount = 2;
    const picked: ToeflDrill[] = [];

    for (const sec of sections) {
      const pool = seededShuffle(
        TOEFL_DRILLS.filter((d) => d.section === sec),
        baseRng
      );
      const start = ((config.roundNumber - 1) * perSectionCount) % pool.length;
      for (let i = 0; i < perSectionCount; i += 1) {
        picked.push(pool[(start + i) % pool.length]);
      }
    }

    const orderRng = mulberry32(hashString(`${config.seed}:${config.mode}:r${config.roundNumber}`));
    return seededShuffle(picked, orderRng);
  }

  const sectionPool = seededShuffle(
    TOEFL_DRILLS.filter((d) => d.section === config.mode),
    baseRng
  );
  const sliceCount = 6;
  const start = ((config.roundNumber - 1) * sliceCount) % sectionPool.length;
  const selected: ToeflDrill[] = [];
  for (let i = 0; i < sliceCount; i += 1) {
    selected.push(sectionPool[(start + i) % sectionPool.length]);
  }
  return selected;
}

export function createFreshChallenge(
  mode: ChallengeMode,
  previous?: ChallengeConfig | null,
  challengerName?: string
): ChallengeConfig {
  // If same seed & mode, increment roundNumber so questions deterministically rotate without repeats;
  // or if no previous challenge exists, generate a fresh seed!
  if (previous && previous.mode === mode) {
    return {
      seed: previous.seed,
      mode,
      roundNumber: previous.roundNumber + 1,
      challengerName: challengerName?.trim() || undefined,
    };
  }
  return {
    seed: generateSeedCode(),
    mode,
    roundNumber: 1,
    challengerName: challengerName?.trim() || undefined,
  };
}
