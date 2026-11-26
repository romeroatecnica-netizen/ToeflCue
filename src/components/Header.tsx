import { Globe } from 'lucide-react';
import { SUPPORTED_LANGS } from '../config/seo';
import type { TranslationBundle } from '../i18n/types';
import type { SupportedLang } from '../types/toefl';

interface HeaderProps {
  lang: SupportedLang;
  t: TranslationBundle;
  onChangeLang: (next: SupportedLang) => void;
}

export function Header({ lang, t, onChangeLang }: HeaderProps) {
  return (
    <header className="no-print sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-4 py-3 sm:px-6">
        <a
          href="#trainer"
          className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-800"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            aria-hidden="true"
            className="shrink-0"
          >
            <rect width="28" height="28" rx="7" fill="#059669" />
            <path
              d="M8.5 9.5H19.5M14 9.5V19.5M17.5 17.5C18.7 16.5 19.5 15 19.5 13.5"
              stroke="#FFFFFF"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>ToeflCue</span>
        </a>

        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
        >
          <a
            href="#trainer"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            {t.nav.trainer}
          </a>
          <a
            href="#mastery"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            {t.nav.mastery}
          </a>
          <a
            href="#guide"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            {t.nav.guide}
          </a>
          <a
            href="#faq"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            {t.nav.faq}
          </a>
        </nav>

        <div className="flex items-center shrink-0">
          <label htmlFor="lang-selector" className="sr-only">
            {t.nav.languageLabel}
          </label>
          <div className="relative flex items-center">
            <Globe
              className="pointer-events-none absolute start-2.5 h-4 w-4 text-slate-500"
              aria-hidden="true"
            />
            <select
              id="lang-selector"
              value={lang}
              onChange={(e) => onChangeLang(e.target.value as SupportedLang)}
              aria-label={t.nav.languageLabel}
              className="h-10 rounded-lg border border-slate-200 bg-slate-50 ps-8 pe-7 text-xs font-semibold text-slate-800 transition-colors hover:border-slate-300 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800 whitespace-nowrap shrink-0"
            >
              {SUPPORTED_LANGS.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.nativeName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}
