import type { TranslationBundle } from '../i18n/types';

interface AdSlotProps {
  slotId: string;
  placement: 'top' | 'bottom';
  t: TranslationBundle;
}

/**
 * Media.net Pre-configured Ad Container.
 * Zero-CLS reserved min-height, hidden in @media print, never overlays interactive trainer elements.
 * To activate Media.net in production:
 * 1) Load Media.net head script (cl.media.net/dmedianet.js?cid=YOUR_CID) in index.html.
 * 2) Trigger window._mNHandle.queue.push(...) targeting this container's slotId.
 */
export function AdSlot({ slotId, placement, t }: AdSlotProps) {
  const commentLabel =
    placement === 'top' ? t.ads.slotTopComment : t.ads.slotBottomComment;

  return (
    <div
      id={slotId}
      data-ad-network="media.net"
      data-ad-placement={placement}
      aria-label={t.ads.label}
      className="no-print flex min-h-[108px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-3 text-center"
    >
      <span className="text-[11px] font-medium tracking-wide text-slate-400">
        {t.ads.label}
      </span>
      <p className="mt-1 text-xs text-slate-400">{commentLabel}</p>
    </div>
  );
}
