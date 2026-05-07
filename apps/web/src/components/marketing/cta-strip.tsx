'use client';

import { Link } from '@/i18n/navigation';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Magnetic } from './magnetic';
import { Reveal } from './reveal';

export function CtaStrip() {
  const t = useTranslations('cta');
  return (
    <section className="relative overflow-hidden rounded-3xl border border-[var(--color-bg-grid)] bg-[var(--color-bg-soft)]">
      {/* Slow-drifting gradient mesh — adaline-style backdrop */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-70 blur-3xl"
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
        style={{
          backgroundImage:
            'radial-gradient(50% 70% at 30% 50%, var(--mesh-1), transparent 60%),' +
            'radial-gradient(50% 70% at 80% 30%, var(--mesh-2), transparent 60%)',
          backgroundSize: '200% 200%',
        }}
      />
      <div className="px-8 py-16 text-center md:px-16 md:py-24">
        <Reveal>
          <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">{t('title')}</h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mx-auto mt-4 max-w-xl text-base text-[var(--color-fg-mute)]">
            {t('subtitle')}
          </p>
        </Reveal>
        <Reveal delay={0.2}>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Magnetic>
              <Link
                href="/sign-up"
                className="inline-flex h-12 items-center rounded-full bg-[var(--color-accent)] px-7 text-base font-medium text-[var(--color-accent-fg)] transition-colors hover:bg-[var(--color-accent-strong)]"
              >
                {t('primary')}
              </Link>
            </Magnetic>
            <Link
              href="/pricing"
              className="inline-flex h-12 items-center rounded-full border border-[var(--color-bg-grid)] bg-[var(--color-bg)] px-7 text-base transition-colors hover:border-[var(--color-fg)]"
            >
              {t('secondary')}
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
