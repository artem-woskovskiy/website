'use client';

import { useTranslations } from 'next-intl';

export function Marquee() {
  const t = useTranslations('marquee');
  // Locale messages expose `marquee.items` as an array; we read it raw.
  const items = (t.raw('items') as unknown as string[]) ?? [];
  const doubled = [...items, ...items];
  return (
    <div
      className="hairline-t hairline-b relative overflow-hidden py-8"
      style={{
        WebkitMaskImage:
          'linear-gradient(to right, transparent 0, black 8%, black 92%, transparent 100%)',
        maskImage:
          'linear-gradient(to right, transparent 0, black 8%, black 92%, transparent 100%)',
      }}
    >
      <div className="marquee-track flex w-max items-center gap-12 px-6">
        {doubled.map((it, i) => (
          <span
            key={`${it}-${i}`}
            className="font-mono text-sm uppercase tracking-[0.18em] text-[var(--color-fg-dim)] transition-colors hover:text-[var(--color-fg)]"
          >
            {it}
          </span>
        ))}
      </div>
    </div>
  );
}
