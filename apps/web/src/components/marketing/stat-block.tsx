'use client';

import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useRef } from 'react';

/**
 * Adaline-style digit roulette — every digit is rendered as a 0..9 column,
 * the column slides up to the target digit when the block enters view.
 */
export function StatBlock({
  value,
  suffix = '',
  label,
  delay = 0,
}: { value: number; suffix?: string; label: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-15%' });
  const reduceMotion = useReducedMotion();
  const digits = String(value).split('');

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1], delay }}
      className="hairline group rounded-xl p-6 transition-colors hover:border-[var(--color-accent)]"
    >
      <div className="flex items-baseline font-mono text-5xl tracking-tight md:text-6xl">
        {digits.map((d, i) => {
          const targetDigit = Number.isFinite(Number(d)) ? Number(d) : 0;
          return (
            <span
              key={`${i}-${d}`}
              className="inline-block h-[1em] overflow-hidden"
              aria-hidden
            >
              <motion.span
                className="block leading-none"
                initial={{ y: '0em' }}
                animate={inView ? { y: `-${targetDigit}em` } : { y: '0em' }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { duration: 1.1, ease: [0.2, 0.8, 0.2, 1], delay: delay + i * 0.06 }
                }
              >
                {Array.from({ length: 10 }, (_, n) => (
                  <span key={n} className="block">
                    {n}
                  </span>
                ))}
              </motion.span>
            </span>
          );
        })}
        {suffix && (
          <motion.span
            className="ml-1 text-[var(--color-fg-mute)]"
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.4, delay: delay + digits.length * 0.06 + 0.3 }}
          >
            {suffix}
          </motion.span>
        )}
        <span className="sr-only">
          {value}
          {suffix}
        </span>
      </div>
      <div className="mt-2 text-sm text-[var(--color-fg-mute)]">{label}</div>
    </motion.div>
  );
}
