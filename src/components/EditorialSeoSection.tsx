import { ChevronDown, Info } from 'lucide-react';
import { useState } from 'react';
import type { TranslationBundle } from '../i18n/types';

interface EditorialSeoSectionProps {
  t: TranslationBundle;
}

export function EditorialSeoSection({ t }: EditorialSeoSectionProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="no-print space-y-6">
      <section
        id="guide"
        className="rounded-xl border border-slate-200 bg-white p-5 sm:p-7"
        aria-labelledby="guide-heading"
      >
        <h2 id="guide-heading" className="text-xl font-bold tracking-tight text-slate-900">
          {t.editorial.guideHeading}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
          {t.editorial.guideIntro}
        </p>

        {/* Four TOEFL Distractor Traps */}
        <div className="mt-6">
          <h3 className="text-base font-bold text-slate-900">{t.editorial.trapsHeading}</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {t.editorial.traps.map((trap, i) => (
              <div
                key={trap.title}
                className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
              >
                <p className="text-sm font-bold text-slate-900">
                  0{i + 1}. {trap.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{trap.detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Routine + Connectors */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
            <h3 className="text-base font-bold text-slate-900">{t.editorial.routineHeading}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {t.editorial.routineBody}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
            <h3 className="text-base font-bold text-slate-900">{t.editorial.connectorsHeading}</h3>
            <dl className="mt-2.5 space-y-2">
              {t.editorial.connectors.map((c) => (
                <div key={c.purpose} className="text-xs leading-relaxed">
                  <dt className="font-bold text-slate-900">{c.purpose}</dt>
                  <dd lang="en" className="font-mono text-slate-600">
                    {c.phrases}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Interactive Accordion FAQ */}
      <section
        id="faq"
        className="rounded-xl border border-slate-200 bg-white p-5 sm:p-7"
        aria-labelledby="faq-heading"
      >
        <h2 id="faq-heading" className="text-xl font-bold tracking-tight text-slate-900">
          {t.editorial.faqHeading}
        </h2>

        <div className="mt-4 divide-y divide-slate-200 border-t border-b border-slate-200">
          {t.editorial.faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={faq.question}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between gap-4 py-4 text-start text-sm font-semibold text-slate-900 hover:text-blue-800"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-150 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>
                {isOpen && (
                  <p className="pb-4 text-sm leading-relaxed text-slate-600">{faq.answer}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Transparent Client-Side & Non-ETS Disclaimer */}
        <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs leading-relaxed text-slate-600">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
          <p>{t.editorial.disclaimer}</p>
        </div>
      </section>
    </div>
  );
}
