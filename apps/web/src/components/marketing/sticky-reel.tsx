'use client';

import { motion, type MotionValue, useScroll, useTransform } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';
import { ReelScene } from './reel-visuals';

const STEP_KEYS = ['step1', 'step2', 'step3', 'step4'] as const;

/**
 * Adaline-style stacking-pin reel: each step is sticky-pinned to the same
 * vertical slot, and as the user scrolls past, the previous card slightly
 * shrinks + fades while the next one animates in on top. The eyebrow + title
 * column on the left stays sticky for the entire section.
 */
export function StickyReel() {
  const t = useTranslations('reel');
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });
  // Animated progress dots on the left rail.
  const activeIndex = useTransform(scrollYProgress, [0, 1], [0, STEP_KEYS.length - 0.001]);

  return (
    <section ref={ref} className="relative" style={{ minHeight: `${STEP_KEYS.length * 80}vh` }}>
      <div className="sticky top-24 grid grid-cols-12 gap-10">
        <aside className="col-span-12 md:col-span-4">
          <span className="text-xs uppercase tracking-[0.18em] text-[var(--color-fg-dim)]">
            {t('eyebrow')}
          </span>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">{t('title')}</h2>
          <p className="mt-3 max-w-sm text-sm text-[var(--color-fg-mute)]">{t('subtitle')}</p>

          {/* Step rail — dot fills as the matching card scrolls into focus */}
          <ol className="mt-8 space-y-3">
            {STEP_KEYS.map((k, i) => (
              <RailItem key={k} index={i} activeIndex={activeIndex} label={t(`${k}Title`)} />
            ))}
          </ol>
        </aside>

        <div className="relative col-span-12 h-[80vh] md:col-span-8">
          {STEP_KEYS.map((k, i) => (
            <ReelCard
              key={k}
              n={String(i + 1).padStart(2, '0')}
              title={t(`${k}Title`)}
              body={t(`${k}Body`)}
              index={i}
              total={STEP_KEYS.length}
              progress={scrollYProgress}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function RailItem({
  index,
  activeIndex,
  label,
}: {
  index: number;
  activeIndex: MotionValue<number>;
  label: string;
}) {
  const fill = useTransform(activeIndex, (v) => Math.max(0, Math.min(1, (v as number) - index)));
  const opacity = useTransform(activeIndex, (v) =>
    Math.abs((v as number) - index) < 1 ? 1 : 0.45,
  );
  return (
    <motion.li className="flex items-center gap-3 text-sm" style={{ opacity }}>
      <span className="relative h-px w-10 overflow-hidden bg-[var(--color-bg-grid)]">
        <motion.span
          className="absolute inset-y-0 left-0 bg-[var(--color-accent)]"
          style={{ width: '100%', scaleX: fill, transformOrigin: 'left' }}
        />
      </span>
      <span className="font-mono text-[10px] tabular-nums text-[var(--color-fg-dim)]">
        {String(index + 1).padStart(2, '0')}
      </span>
      <span className="text-[var(--color-fg-mute)]">{label}</span>
    </motion.li>
  );
}

function ReelCard({
  n,
  title,
  body,
  index,
  total,
  progress,
}: {
  n: string;
  title: string;
  body: string;
  index: number;
  total: number;
  progress: MotionValue<number>;
}) {
  // Each card occupies a 1/total slice of the section's progress range.
  const start = index / total;
  const end = (index + 1) / total;
  const enterStart = Math.max(0, start - 0.08);
  const leaveEnd = Math.min(1, end + 0.06);
  const isFirst = index === 0;
  const isLast = index === total - 1;

  // Enter from below → hold in focus → drift up + fade for the next.
  const y = useTransform(
    progress,
    [enterStart, start, end, leaveEnd],
    [isFirst ? '0%' : '14%', '0%', '0%', isLast ? '0%' : '-8%'],
  );
  const opacity = useTransform(
    progress,
    [enterStart, start, end, leaveEnd],
    [isFirst ? 1 : 0, 1, 1, isLast ? 1 : 0],
  );
  const scale = useTransform(
    progress,
    [enterStart, start, end, leaveEnd],
    [isFirst ? 1 : 0.96, 1, 1, isLast ? 1 : 0.985],
  );

  return (
    <motion.div
      style={{ y, opacity, scale, zIndex: total - index }}
      className="absolute inset-0 overflow-hidden rounded-2xl border border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)] shadow-[0_30px_80px_-50px_oklch(0.4_0.05_250/0.35)]"
    >
      {/* 3D themed scene fills the empty bottom-right of each card */}
      <ReelScene
        index={index}
        className="absolute inset-y-0 right-0 hidden w-[55%] md:block"
      />

      {/* Soft fade so text remains readable over the scene */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden md:block"
        style={{
          background:
            'linear-gradient(90deg, var(--color-bg-elev) 35%, transparent 70%)',
        }}
      />

      <div className="relative z-10 flex h-full flex-col justify-between p-8">
        <div className="max-w-md">
          <div className="flex items-baseline gap-4">
            <span className="font-mono text-sm text-[var(--color-accent)]">{n}</span>
            <h3 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h3>
          </div>
          <p className="mt-4 text-base text-[var(--color-fg-mute)]">{body}</p>
        </div>

        {/* Progress hairline that grows as this card sits on the pin */}
        <div className="mt-6 h-px w-full bg-[var(--color-bg-grid)]">
          <motion.div
            className="h-px bg-[var(--color-accent)]"
            style={{
              scaleX: useTransform(progress, [start, end], [0, 1]),
              transformOrigin: 'left',
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}
