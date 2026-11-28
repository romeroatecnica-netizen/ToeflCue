import { useState } from 'react';
import { BatteryCharging, BookOpen, ExternalLink, Headphones, Laptop, ShieldCheck } from 'lucide-react';
import {
  AFFILIATE_CATALOG,
  AFFILIATE_LINK_ATTRS,
  buildAmazonEsAffiliateUrl,
  type AffiliateProductId,
} from '../config/affiliate';
import type { TranslationBundle } from '../i18n/types';

interface AffiliateGearSectionProps {
  t: TranslationBundle;
}

const PRODUCT_ICONS: Record<AffiliateProductId, typeof Headphones> = {
  headphones: Headphones,
  ereader: BookOpen,
  stand: Laptop,
  powerbank: BatteryCharging,
};

function ProductThumbnail({
  id,
  src,
  alt,
}: {
  id: AffiliateProductId;
  src: string;
  alt: string;
}) {
  const [failed, setFailed] = useState(false);
  const Icon = PRODUCT_ICONS[id];

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-slate-200 bg-white">
      {!failed ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500">
          <Icon className="h-12 w-12" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}

export function AffiliateGearSection({ t }: AffiliateGearSectionProps) {
  return (
    <section
      className="no-print rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
      aria-labelledby="gear-heading"
    >
      <div className="max-w-3xl">
        <h2 id="gear-heading" className="text-lg font-bold tracking-tight text-slate-900">
          {t.gear.heading}
        </h2>
        <p className="mt-1 text-sm text-slate-600">{t.gear.subtitle}</p>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {t.gear.items.map((item) => {
          const meta = AFFILIATE_CATALOG[item.id];
          const href = buildAmazonEsAffiliateUrl(item.query || meta.searchQuery);
          const Icon = PRODUCT_ICONS[item.id];

          return (
            <a
              key={item.id}
              href={href}
              {...AFFILIATE_LINK_ATTRS}
              className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 transition-colors hover:border-blue-300 hover:bg-white"
            >
              <div>
                <ProductThumbnail id={item.id} src={meta.imageSrc} alt={item.title} />

                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-blue-800">{item.category}</span>
                  <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                </div>

                <h3 className="mt-1.5 text-sm font-bold leading-snug text-slate-900 group-hover:text-blue-800">
                  {item.title}
                </h3>

                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{item.description}</p>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-200/80 pt-3">
                <div className="flex items-baseline gap-1 text-slate-900">
                  <span className="text-[11px] font-medium text-slate-500">
                    {t.gear.pricePrefix}
                  </span>
                  <span className="text-sm font-extrabold tabular-nums">
                    {meta.indicativePrice}
                  </span>
                </div>

                <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors group-hover:bg-emerald-800">
                  <span>{t.gear.cta}</span>
                  <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                </span>
              </div>
            </a>
          );
        })}
      </div>

      <p className="mt-4 flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs leading-relaxed text-slate-600">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
        <span>{t.gear.disclosure}</span>
      </p>
    </section>
  );
}
