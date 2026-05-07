import { CtaStrip } from '@/components/marketing/cta-strip';
import { Reveal, RevealItem, RevealStagger } from '@/components/marketing/reveal';
import { SiteFooter } from '@/components/marketing/site-footer';
import { SiteHeader } from '@/components/marketing/site-header';
import { getCurrentUser } from '@/lib/auth-server';
import { getTranslations, setRequestLocale } from 'next-intl/server';

const TIMELINE_KEYS = ['t1', 't2', 't3', 't4'] as const;
const VALUE_KEYS = ['v1', 'v2', 'v3'] as const;

export default async function AboutPage({
  params,
}: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getCurrentUser();
  const t = await getTranslations('about');

  return (
    <>
      <SiteHeader user={user} />
      <main>
        <section className="mesh relative overflow-hidden">
          <AnimatedMeshBackdrop />
          <div className="mx-auto max-w-[1280px] px-6 py-24 md:px-10 md:py-40">
            <Reveal>
              <span className="text-xs uppercase tracking-[0.18em] text-[var(--color-fg-dim)]">
                {t('eyebrow')}
              </span>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-7xl md:leading-[1.05]">
                {t('titleStart')}{' '}
                <span className="font-serif italic text-[var(--color-accent)]">{t('titleEm')}</span>{' '}
                {t('titleEnd')}
              </h1>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="mt-8 max-w-2xl text-lg text-[var(--color-fg-mute)] md:text-xl">
                {t('subtitle')}
              </p>
            </Reveal>
          </div>
        </section>

        <section className="mx-auto max-w-[1280px] px-6 py-24 md:px-10 md:py-32">
          <div className="grid grid-cols-1 gap-16 md:grid-cols-12">
            <Reveal className="md:col-span-5">
              <span className="text-xs uppercase tracking-[0.18em] text-[var(--color-fg-dim)]">
                {t('manifestoEyebrow')}
              </span>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
                {t('manifestoTitle')}
              </h2>
            </Reveal>
            <RevealStagger className="space-y-6 text-lg text-[var(--color-fg)] md:col-span-7 md:text-xl">
              {(['m1', 'm2', 'm3'] as const).map((k, i) => (
                <RevealItem key={k}>
                  <p>
                    <span className="text-[var(--color-fg-mute)]">
                      0{i + 1}
                    </span>{' '}
                    {t(k)}
                  </p>
                </RevealItem>
              ))}
            </RevealStagger>
          </div>
        </section>

        <section className="mx-auto max-w-[1280px] px-6 py-24 md:px-10">
          <Reveal>
            <span className="text-xs uppercase tracking-[0.18em] text-[var(--color-fg-dim)]">
              {t('timelineEyebrow')}
            </span>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              {t('timelineTitle')}
            </h2>
          </Reveal>
          <RevealStagger
            className="mt-10 space-y-6 border-l border-[var(--color-bg-grid)] pl-8"
            stagger={0.1}
          >
            {TIMELINE_KEYS.map((k) => (
              <RevealItem key={k}>
                <li className="relative list-none">
                  <span className="absolute -left-[37px] top-1.5 size-2.5 rounded-full bg-[var(--color-accent)]" />
                  <div className="font-mono text-xs uppercase tracking-[0.1em] text-[var(--color-fg-mute)]">
                    {t(`${k}Year`)}
                  </div>
                  <div className="mt-1 text-base text-[var(--color-fg)]">{t(`${k}Body`)}</div>
                </li>
              </RevealItem>
            ))}
          </RevealStagger>
        </section>

        <section className="mx-auto max-w-[1280px] px-6 py-24 md:px-10">
          <Reveal>
            <span className="text-xs uppercase tracking-[0.18em] text-[var(--color-fg-dim)]">
              {t('valuesEyebrow')}
            </span>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              {t('valuesTitle')}
            </h2>
          </Reveal>
          <RevealStagger className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3" stagger={0.08}>
            {VALUE_KEYS.map((k) => (
              <RevealItem key={k}>
                <div className="hairline h-full rounded-2xl p-8 transition-colors hover:border-[var(--color-accent)]">
                  <h3 className="text-lg font-medium">{t(`${k}Title`)}</h3>
                  <p className="mt-2 text-sm text-[var(--color-fg-mute)]">{t(`${k}Body`)}</p>
                </div>
              </RevealItem>
            ))}
          </RevealStagger>
        </section>

        <section className="mx-auto max-w-[1280px] px-6 py-24 md:px-10 md:py-32">
          <CtaStrip />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function AnimatedMeshBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 opacity-40"
      style={{
        backgroundImage:
          'radial-gradient(40% 50% at 70% 20%, var(--color-accent), transparent 60%),' +
          'radial-gradient(35% 50% at 20% 70%, var(--mesh-2), transparent 60%),' +
          'radial-gradient(30% 40% at 50% 50%, var(--mesh-3), transparent 60%)',
        filter: 'blur(60px)',
      }}
    />
  );
}
