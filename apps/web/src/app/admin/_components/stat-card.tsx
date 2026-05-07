'use client';

import { cn } from '@/lib/cn';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import type { ComponentType } from 'react';
import { useEffect } from 'react';

interface StatCardProps {
  label: string;
  value: number;
  hint?: string;
  icon?: ComponentType<{ className?: string }>;
  format?: 'number' | 'currency-rub';
  delay?: number;
  className?: string;
}

function formatNumber(n: number): string {
  return Math.round(n).toLocaleString('ru-RU');
}

function formatRub(kopecks: number): string {
  const rub = Math.round(kopecks / 100);
  return `${rub.toLocaleString('ru-RU')} ₽`;
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  format = 'number',
  delay = 0,
  className,
}: StatCardProps) {
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { duration: 800, bounce: 0 });
  const display = useTransform(spring, (v) =>
    format === 'currency-rub' ? formatRub(v) : formatNumber(v),
  );

  useEffect(() => {
    motionValue.set(value);
  }, [motionValue, value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
      className={cn(
        'group relative overflow-hidden rounded-xl border border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)] p-5',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--color-fg-dim)]">
          {label}
        </div>
        {Icon && (
          <span className="grid size-8 place-items-center rounded-md bg-[var(--color-fg)]/[0.04] text-[var(--color-fg-mute)] transition-colors group-hover:text-[var(--color-fg)]">
            <Icon className="size-4" />
          </span>
        )}
      </div>
      <motion.div className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">
        {display}
      </motion.div>
      {hint && <div className="mt-1 text-xs text-[var(--color-fg-mute)]">{hint}</div>}
      <div className="pointer-events-none absolute -bottom-12 -right-12 size-32 rounded-full bg-gradient-to-tr from-[var(--mesh-1)] to-[var(--mesh-2)] opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-30" />
    </motion.div>
  );
}
