import type { TranslationBundle } from '../i18n/types';
import type { ToeflSection, UserProgress } from '../types/toefl';

interface SectionMasterySvgProps {
  progress: UserProgress;
  t: TranslationBundle;
}

const SECTION_META: Array<{
  key: ToeflSection;
  fill: string;
  track: string;
  labelKey: 'reading' | 'listening' | 'speaking' | 'writing';
}> = [
  { key: 'reading', fill: '#1E40AF', track: '#DBEAFE', labelKey: 'reading' },
  { key: 'listening', fill: '#059669', track: '#D1FAE5', labelKey: 'listening' },
  { key: 'speaking', fill: '#D97706', track: '#FEF3C7', labelKey: 'speaking' },
  { key: 'writing', fill: '#0F766E', track: '#CCFBF1', labelKey: 'writing' },
];

export function SectionMasterySvg({ progress, t }: SectionMasterySvgProps) {
  const totalAttempts = (['reading', 'listening', 'speaking', 'writing'] as ToeflSection[]).reduce(
    (sum, sec) => sum + progress.sectionStats[sec].total,
    0
  );

  const chartWidth = 640;
  const chartHeight = 232;
  const labelWidth = 112;
  const barAreaWidth = 408;
  const rowHeight = 46;
  const topOffset = 28;
  const targetX = labelWidth + barAreaWidth * 0.8;

  return (
    <section
      id="mastery"
      className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
      aria-labelledby="mastery-heading"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h2 id="mastery-heading" className="text-lg font-bold tracking-tight text-slate-900">
            {t.chart.title}
          </h2>
          <p className="mt-0.5 text-sm text-slate-600">{t.chart.subtitle}</p>
        </div>
        <span className="text-xs font-medium text-slate-500 tabular-nums whitespace-nowrap shrink-0">
          {t.chart.targetLine}
        </span>
      </div>

      <div className="mt-5">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="h-auto w-full max-w-full overflow-visible"
          role="img"
          aria-labelledby="svg-mastery-title svg-mastery-desc"
        >
          <title id="svg-mastery-title">{t.chart.title}</title>
          <desc id="svg-mastery-desc">{t.chart.subtitle}</desc>

          {[0, 25, 50, 75, 100].map((pct) => {
            const x = labelWidth + (barAreaWidth * pct) / 100;
            return (
              <g key={pct}>
                <line
                  x1={x}
                  y1={16}
                  x2={x}
                  y2={topOffset + rowHeight * 4 - 8}
                  stroke="#E2E8F0"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={topOffset + rowHeight * 4 + 10}
                  textAnchor="middle"
                  fill="#64748B"
                  fontSize="11"
                  fontFamily="IBM Plex Mono, monospace"
                >
                  {pct}%
                </text>
              </g>
            );
          })}

          <line
            x1={targetX}
            y1={12}
            x2={targetX}
            y2={topOffset + rowHeight * 4 - 4}
            stroke="#059669"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {SECTION_META.map((item, idx) => {
            const stat = progress.sectionStats[item.key];
            const pct = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
            const y = topOffset + idx * rowHeight;
            const barWidth = Math.max(0, (barAreaWidth * pct) / 100);
            const sectionLabel = t.sections[item.labelKey];

            return (
              <g key={item.key}>
                <text
                  x={0}
                  y={y + 18}
                  fill="#0F172A"
                  fontSize="13"
                  fontWeight="600"
                >
                  {sectionLabel}
                </text>

                <rect
                  x={labelWidth}
                  y={y + 4}
                  width={barAreaWidth}
                  height={20}
                  rx={6}
                  fill="#F1F5F9"
                />

                {barWidth > 0 && (
                  <rect
                    x={labelWidth}
                    y={y + 4}
                    width={barWidth}
                    height={20}
                    rx={6}
                    fill={item.fill}
                  />
                )}

                <text
                  x={labelWidth + barAreaWidth + 14}
                  y={y + 18}
                  fill="#0F172A"
                  fontSize="12.5"
                  fontWeight="600"
                  fontFamily="IBM Plex Mono, monospace"
                >
                  {pct}% · {stat.correct}/{stat.total}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {totalAttempts === 0 && (
        <p className="mt-3 text-xs text-slate-500">{t.chart.emptyState}</p>
      )}
    </section>
  );
}
