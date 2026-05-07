'use client';

import { Link } from '@/i18n/navigation';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';
import { CursorSpotlight } from './cursor-spotlight';
import { IdeMock } from './ide-mock';
import { Magnetic } from './magnetic';

export function Hero() {
  const t = useTranslations('hero');
  const ref = useRef<HTMLElement>(null);
  // Scroll-driven parallax: text drifts up + fades, IDE mock moves slower
  // than the rest of the page → exactly the layered feel adaline.ai uses.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '-30%']);
  const textOpacity = useTransform(scrollYProgress, [0, 0.6, 1], [1, 0.5, 0]);
  const mockY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
  const mockScale = useTransform(scrollYProgress, [0, 1], [1, 0.94]);
  const meshY = useTransform(scrollYProgress, [0, 1], ['0%', '40%']);

  return (
    <section ref={ref} className="relative overflow-hidden">
      {/* very subtle dot grid behind the hero */}
      <div aria-hidden className="dot-grid pointer-events-none absolute inset-0 -z-20 opacity-60" />

      {/* slowly drifting accent glow — adaline-style ambient motion + parallax */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[760px] blur-3xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          y: meshY,
          backgroundImage:
            'radial-gradient(40% 50% at 50% 0%, var(--mesh-1), transparent 60%),' +
            'radial-gradient(35% 45% at 18% 30%, var(--mesh-3), transparent 60%),' +
            'radial-gradient(35% 45% at 82% 30%, var(--mesh-2), transparent 60%)',
        }}
      />

      <CursorSpotlight className="mx-auto max-w-[1100px] px-6 pb-20 pt-20 md:px-10 md:pb-28 md:pt-28">
        <motion.div style={{ y: textY, opacity: textOpacity }} className="text-center">
          {/* announcement pill — devin.ai style */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
            className="flex justify-center"
          >
            <Link href="/download" className="pill group">
              <span className="pill-tag">{t('badgeTag')}</span>
              <span>{t('badge')}</span>
              <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </motion.div>

          {/* line-by-line stagger reveal */}
          <motion.h1
            className="mx-auto mt-8 max-w-4xl text-balance text-[44px] font-medium leading-[1.05] tracking-[-0.025em] text-[var(--color-fg)] md:text-[76px]"
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
            }}
          >
            <Line>
              {t('titleLine1')}{' '}
              <span className="font-serif italic font-normal text-[var(--color-accent)]">
                {t('titleSwarm')}
              </span>
              {t('titleSeparator')}
            </Line>
            <Line>{t('titleLine2')}</Line>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1], delay: 0.45 }}
            className="mx-auto mt-6 max-w-2xl text-pretty text-base text-[var(--color-fg-mute)] md:text-lg"
          >
            {t('subtitle')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1], delay: 0.6 }}
            className="mt-9 flex flex-wrap justify-center gap-3"
          >
            <Magnetic>
              <Link
                href="/sign-up"
                className="inline-flex h-11 items-center rounded-full bg-[var(--color-accent)] px-6 text-sm font-medium text-[var(--color-accent-fg)] shadow-[0_1px_0_oklch(0.4_0.18_260)] transition-colors hover:bg-[var(--color-accent-strong)]"
              >
                {t('ctaPrimary')}
              </Link>
            </Magnetic>
            <Link
              href="/pricing"
              className="inline-flex h-11 items-center rounded-full border border-[var(--color-bg-grid)] bg-[var(--color-bg)] px-6 text-sm font-medium text-[var(--color-fg)] transition-colors hover:border-[var(--color-fg)]"
            >
              {t('ctaSecondary')}
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1], delay: 0.4 }}
          style={{ y: mockY, scale: mockScale }}
          className="mx-auto mt-16 w-full max-w-[980px]"
        >
          <div className="overflow-hidden rounded-2xl border border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)] shadow-[0_30px_80px_-30px_oklch(0.4_0.05_250/0.25)]">
            <IdeMock />
          </div>
        </motion.div>
      </CursorSpotlight>
    </section>
  );
}

function Line({ children }: { children: React.ReactNode }) {
  return (
    <span className="block overflow-hidden">
      <motion.span
        className="block"
        variants={{
          hidden: { y: '110%' },
          show: { y: '0%', transition: { duration: 0.8, ease: [0.2, 0.8, 0.2, 1] } },
        }}
      >
        {children}
      </motion.span>
    </span>
  );
}
