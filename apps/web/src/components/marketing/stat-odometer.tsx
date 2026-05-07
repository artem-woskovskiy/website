'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

export function StatOdometer({
  value,
  suffix = '',
  label,
}: { value: number; suffix?: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-20%' });
  const digits = String(value).split('');

  return (
    <div ref={ref} className="hairline rounded-xl p-6">
      <div className="flex items-baseline font-mono text-5xl tracking-tight md:text-6xl">
        {digits.map((d, i) => (
          <span key={`${i}-${d}`} className="inline-block h-[1em] overflow-hidden">
            <motion.span
              className="block leading-none"
              initial={{ y: '0em' }}
              animate={inView ? { y: `-${Number.isFinite(Number(d)) ? Number(d) : 0}em` } : {}}
              transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1], delay: i * 0.05 }}
            >
              {Array.from({ length: 10 }, (_, n) => (
                <span key={n} className="block">
                  {n}
                </span>
              ))}
            </motion.span>
          </span>
        ))}
        {suffix && <span className="ml-1 text-[var(--color-fg-mute)]">{suffix}</span>}
      </div>
      <div className="mt-2 text-sm text-[var(--color-fg-mute)]">{label}</div>
    </div>
  );
}
