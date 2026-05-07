'use client';

import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useRef } from 'react';

/**
 * Adaline-style digit roulette — each digit is rendered as a 0..9 column that
 * slides up to the target digit when the element enters view. Reusable across
 * stat blocks, KPI cards, and the account dashboard.
 */
export function DigitRoulette({
  value,
  className = '',
  delay = 0,
}: {
  value: number;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-15%' });
  const reduceMotion = useReducedMotion();
  const digits = String(value).split('');

  return (
    <span ref={ref} className={`inline-flex items-baseline font-mono ${className}`}>
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
      <span className="sr-only">{value}</span>
    </span>
  );
}
