import type { SupportedLang } from '../types/toefl';
import { TRANSLATIONS_PART_1 } from './translationsPart1';
import { TRANSLATIONS_PART_2 } from './translationsPart2';
import type { TranslationBundle } from './types';

export const TRANSLATIONS: Record<SupportedLang, TranslationBundle> = {
  ...TRANSLATIONS_PART_1,
  ...TRANSLATIONS_PART_2,
};

export function getTranslations(lang: SupportedLang): TranslationBundle {
  return TRANSLATIONS[lang] ?? TRANSLATIONS.en;
}
