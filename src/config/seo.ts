import type { LangMeta, SupportedLang } from '../types/toefl';

export const CANONICAL_ORIGIN = 'https://toeflcue.bastelar.com';

export const SUPPORTED_LANGS: LangMeta[] = [
  { code: 'en', nativeName: 'English', ogLocale: 'en_US', dir: 'ltr' },
  { code: 'es', nativeName: 'Español', ogLocale: 'es_ES', dir: 'ltr' },
  { code: 'fr', nativeName: 'Français', ogLocale: 'fr_FR', dir: 'ltr' },
  { code: 'de', nativeName: 'Deutsch', ogLocale: 'de_DE', dir: 'ltr' },
  { code: 'pt', nativeName: 'Português', ogLocale: 'pt_BR', dir: 'ltr' },
  { code: 'ar', nativeName: 'العربية', ogLocale: 'ar_AR', dir: 'rtl' },
  { code: 'hi', nativeName: 'हिन्दी', ogLocale: 'hi_IN', dir: 'ltr' },
  { code: 'ru', nativeName: 'Русский', ogLocale: 'ru_RU', dir: 'ltr' },
  { code: 'zh', nativeName: '中文', ogLocale: 'zh_CN', dir: 'ltr' },
  { code: 'ja', nativeName: '日本語', ogLocale: 'ja_JP', dir: 'ltr' },
];

export const LANG_CODES = new Set<SupportedLang>(SUPPORTED_LANGS.map((l) => l.code));

export function isSupportedLang(value: string | null | undefined): value is SupportedLang {
  if (!value) return false;
  return LANG_CODES.has(value as SupportedLang);
}

export function getCanonicalUrlForLang(lang: SupportedLang): string {
  if (lang === 'en') {
    return `${CANONICAL_ORIGIN}/`;
  }
  return `${CANONICAL_ORIGIN}/?lang=${lang}`;
}

export function getLangMeta(lang: SupportedLang): LangMeta {
  return SUPPORTED_LANGS.find((l) => l.code === lang) ?? SUPPORTED_LANGS[0];
}

export function detectInitialLanguage(): SupportedLang {
  if (typeof window === 'undefined') return 'en';

  const params = new URLSearchParams(window.location.search);
  const urlLang = params.get('lang')?.toLowerCase();
  if (isSupportedLang(urlLang)) {
    return urlLang;
  }

  try {
    const saved = window.localStorage.getItem('toeflcue_lang');
    if (isSupportedLang(saved)) {
      return saved;
    }
  } catch {
    // Ignore storage access errors in restricted environments
  }

  const navLangs = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const raw of navLangs) {
    if (!raw) continue;
    const base = raw.toLowerCase().split('-')[0];
    if (isSupportedLang(base)) {
      return base;
    }
  }

  return 'en';
}

export interface SeoPayload {
  lang: SupportedLang;
  title: string;
  description: string;
  howToName: string;
  howToDescription: string;
  howToSteps: Array<{ name: string; text: string }>;
  faqs: Array<{ question: string; answer: string }>;
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel: string, href: string, hreflang?: string): void {
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]:not([hreflang])`;
  let el = document.head.querySelector<HTMLLinkElement>(selector);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    if (hreflang) el.setAttribute('hreflang', hreflang);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function syncHeadSeo(payload: SeoPayload): void {
  if (typeof document === 'undefined') return;

  const meta = getLangMeta(payload.lang);
  const canonicalUrl = getCanonicalUrlForLang(payload.lang);

  document.documentElement.lang = meta.code;
  document.documentElement.dir = meta.dir;
  document.title = payload.title;

  upsertMeta('name', 'description', payload.description);
  upsertMeta('property', 'og:url', canonicalUrl);
  upsertMeta('property', 'og:title', payload.title);
  upsertMeta('property', 'og:description', payload.description);
  upsertMeta('property', 'og:locale', meta.ogLocale);
  upsertMeta('name', 'twitter:title', payload.title);
  upsertMeta('name', 'twitter:description', payload.description);

  upsertLink('canonical', canonicalUrl);
  upsertLink('alternate', `${CANONICAL_ORIGIN}/`, 'x-default');
  for (const item of SUPPORTED_LANGS) {
    upsertLink('alternate', getCanonicalUrlForLang(item.code), item.code);
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: 'ToeflCue — Bite-Sized TOEFL Trainer & Interactive Drills',
        url: canonicalUrl,
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'All',
        browserRequirements: 'Requires JavaScript',
        inLanguage: meta.code,
        description: payload.description,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      },
      {
        '@type': 'HowTo',
        name: payload.howToName,
        description: payload.howToDescription,
        inLanguage: meta.code,
        step: payload.howToSteps.map((s) => ({
          '@type': 'HowToStep',
          name: s.name,
          text: s.text,
        })),
      },
      {
        '@type': 'FAQPage',
        inLanguage: meta.code,
        mainEntity: payload.faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      },
    ],
  };

  let script = document.getElementById('toeflcue-jsonld') as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = 'toeflcue-jsonld';
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(jsonLd);
}
