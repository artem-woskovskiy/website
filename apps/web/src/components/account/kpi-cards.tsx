'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Activity, KeyRound, Sparkles, Timer } from 'lucide-react';
import { Tilt } from '@/components/marketing/tilt';
import { DigitRoulette } from '@/components/marketing/digit-roulette';

/**
 * Animated KPI cards for the account dashboard. Tilt on hover, digit-roulette
 * counters, subtle hairline activity bar at the bottom of each card.
 */
export function KpiCards({
  daysUntilRenewal,
  apiKeyCount,
  modelsAvailable,
  callsToday,
}: {
  daysUntilRenewal: number;
  apiKeyCount: number;
  modelsAvailable: number;
  callsToday: number;
}) {
  const reduced = useReducedMotion();
  const cards = [
    {
      label: 'Days until renewal',
      value: daysUntilRenewal,
      suffix: 'd',
      icon: Timer,
      activity: 0.6,
    },
    {
      label: 'API keys',
      value: apiKeyCount,
      suffix: '',
      icon: KeyRound,
      activity: 0.35,
    },
    {
      label: 'Models available',
      value: modelsAvailable,
      suffix: '+',
      icon: Sparkles,
      activity: 0.85,
    },
    {
      label: 'Calls today',
      value: callsToday,
      suffix: '',
      icon: Activity,
      activity: 0.7,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {cards.map((c, i) => (
        <motion.div
          key={c.label}
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 * i, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <Tilt intensity={3} className="group">
            <div className="relative overflow-hidden rounded-xl border border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)] p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-fg-dim)]">
                  {c.label}
                </span>
                <c.icon className="size-3.5 text-[var(--color-fg-mute)] transition-colors group-hover:text-[var(--color-accent)]" />
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <DigitRoulette value={c.value} className="text-3xl font-semibold tracking-tight" />
                {c.suffix && (
                  <span className="text-xl font-medium text-[var(--color-fg-mute)]">
                    {c.suffix}
                  </span>
                )}
              </div>
              {/* Activity bar */}
              <div className="mt-4 h-px w-full bg-[var(--color-bg-grid)]">
                <motion.div
                  initial={reduced ? false : { scaleX: 0 }}
                  animate={{ scaleX: c.activity }}
                  transition={{ duration: 0.9, delay: 0.2 + 0.05 * i, ease: [0.2, 0.8, 0.2, 1] }}
                  style={{ transformOrigin: 'left' }}
                  className="h-px bg-[var(--color-accent)]"
                />
              </div>
            </div>
          </Tilt>
        </motion.div>
      ))}
    </div>
  );
}
