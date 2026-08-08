'use client';

import { cn } from '@/lib/utils';

interface QuickStat {
  label: string;
  value: string | number;
  highlight?: boolean; // makes the value green/red coloured
  color?: 'green' | 'red' | 'yellow' | 'white';
}

interface PageHeroProps {
  /** Small badge text above the title */
  eyebrow?: string;
  eyebrowIcon?: React.ReactNode;
  title: string;
  subtitle?: string;
  /** Up to 3 quick-stat pills shown on the right */
  stats?: QuickStat[];
  /** Extra content rendered after the stats (e.g. a CTA button) */
  actions?: React.ReactNode;
  className?: string;
}

export function PageHero({
  eyebrow,
  eyebrowIcon,
  title,
  subtitle,
  stats,
  actions,
  className,
}: PageHeroProps) {
  const statColor = (s: QuickStat) => {
    if (s.color === 'green') return 'text-green-300';
    if (s.color === 'red')   return 'text-red-300';
    if (s.color === 'yellow') return 'text-brand-yellow';
    return 'text-white';
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-teal via-brand-teal/90 to-[#005f5a] px-6 py-5 sm:px-8 sm:py-6 text-white shadow-lg',
        className
      )}
    >
      {/* Decorative background circles */}
      <div className="pointer-events-none absolute -top-10 -right-10 h-44 w-44 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute top-1/2 right-28 h-16 w-16 rounded-full bg-white/5" />

      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Left: text */}
        <div className="min-w-0">
          {eyebrow && (
            <div className="mb-1.5 flex items-center gap-1.5">
              {eyebrowIcon && (
                <div className="flex-shrink-0 rounded-md bg-white/20 p-1">{eyebrowIcon}</div>
              )}
              <span className="text-xs font-semibold uppercase tracking-widest text-white/70">
                {eyebrow}
              </span>
            </div>
          )}
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight leading-tight">{title}</h1>
          {subtitle && (
            <p className="mt-0.5 text-sm text-white/70 leading-snug">{subtitle}</p>
          )}
        </div>

        {/* Right: stats + optional actions */}
        {(stats?.length || actions) && (
          <div className="flex flex-wrap flex-shrink-0 items-center gap-2 sm:gap-3">
            {stats?.map((s, i) => (
              <div
                key={i}
                className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-center backdrop-blur-sm"
              >
                <p className={cn('text-xl font-bold leading-tight', statColor(s))}>{s.value}</p>
                <p className="text-xs text-white/60 mt-0.5 whitespace-nowrap">{s.label}</p>
              </div>
            ))}
            {actions && <div className="flex-shrink-0">{actions}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
