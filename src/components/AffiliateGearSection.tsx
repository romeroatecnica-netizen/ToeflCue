import { BookOpen, Clock, ExternalLink, Headphones, PenTool } from 'lucide-react';
import type { TranslationBundle } from '../i18n/types';

interface AffiliateGearSectionProps {
  t: TranslationBundle;
}

const ICONS = [BookOpen, Headphones, PenTool, Clock];

export function AffiliateGearSection({ t }: AffiliateGearSectionProps) {
  return (
    <section
      className="no-print rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
      aria-labelledby="gear-heading"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h2 id="gear-heading" className="text-lg font-bold tracking-tight text-slate-900">
            {t.gear.heading}
          </h2>
          <p className="mt-0.5 text-sm text-slate-600">{t.gear.subtitle}</p>
        </div>
        <span className="text-xs text-slate-400">{t.gear.disclosure}</span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {t.gear.items.map((item, idx) => {
          const Icon = ICONS[idx % ICONS.length];
          return (
            <a
              key={item.title}
              href={item.url}
              target="_blank"
              rel="sponsored nofollow noopener"
              className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-4 transition-colors hover:border-slate-300 hover:bg-white"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-blue-800">{item.category}</span>
                  <Icon className="h-4 w-4 text-slate-500" aria-hidden="true" />
                </div>
                <h3 className="mt-2 text-sm font-bold leading-snug text-slate-900 group-hover:text-blue-800">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{item.description}</p>
              </div>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                <span>{t.gear.cta}</span>
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
}
