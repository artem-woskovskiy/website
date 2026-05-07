import { Hero } from '@/components/marketing/hero';
import { CtaStrip } from '@/components/marketing/cta-strip';
import { FeatureGrid } from '@/components/marketing/feature-grid';
import { Marquee } from '@/components/marketing/marquee';
import { SiteFooter } from '@/components/marketing/site-footer';
import { SiteHeader } from '@/components/marketing/site-header';
import { StatBlock } from '@/components/marketing/stat-block';
import { StickyReel } from '@/components/marketing/sticky-reel';
import { ThemesStrip } from '@/components/marketing/themes-strip';
import { Reveal } from '@/components/marketing/reveal';
import { WordReveal } from '@/components/marketing/word-reveal';
import { getCurrentUser } from '@/lib/auth-server';
import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';

export default async function HomePage({
  params,
}: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getCurrentUser();
  const tStats = await getTranslations('stats');
  const tFeatures = await getTranslations('features');
  const tModels = await getTranslations('models');

  return (
    <>
      <SiteHeader user={user} />
      <main>
        <Hero />

        <Marquee />

        {/* stats */}
        <section className="mx-auto max-w-[1280px] px-6 py-24 md:px-10 md:py-32">
          <div className="mb-12 max-w-2xl">
            <Reveal>
              <span className="text-xs uppercase tracking-[0.18em] text-[var(--color-fg-dim)]">
                {tStats('eyebrow')}
              </span>
            </Reveal>
            <WordReveal
              as="h2"
              className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl"
            >
              {tStats('title')}
            </WordReveal>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatBlock value={8} suffix="+" label={tStats('models')} delay={0} />
            <StatBlock value={15} label={tStats('themes')} delay={0.05} />
            <StatBlock value={16} label={tStats('panes')} delay={0.1} />
            <StatBlock value={100} suffix="%" label={tStats('local')} delay={0.15} />
          </div>
        </section>

        {/* sticky reel */}
        <section id="product" className="mx-auto max-w-[1280px] px-6 py-24 md:px-10 md:py-32">
          <StickyReel />
        </section>

        {/* feature grid */}
        <section className="mx-auto max-w-[1280px] px-6 py-24 md:px-10 md:py-32">
          <div className="mb-12 max-w-2xl">
            <Reveal>
              <span className="text-xs uppercase tracking-[0.18em] text-[var(--color-fg-dim)]">
                {tFeatures('eyebrow')}
              </span>
            </Reveal>
            <WordReveal
              as="h2"
              className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl"
            >
              {tFeatures('title')}
            </WordReveal>
          </div>
          <FeatureGrid />
        </section>

        {/* themes */}
        <section id="themes" className="mx-auto max-w-[1280px] px-6 py-24 md:px-10 md:py-32">
          <ThemesStrip />
        </section>

        {/* models */}
        <section id="models" className="mx-auto max-w-[1280px] px-6 py-12 md:px-10 md:py-16">
          <Reveal>
            <div className="hairline rounded-2xl p-8">
              <span className="text-xs uppercase tracking-[0.18em] text-[var(--color-fg-dim)]">
                {tModels('eyebrow')}
              </span>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
                {tModels('title')}
              </h2>
              <p className="mt-3 max-w-2xl text-sm text-[var(--color-fg-mute)]">
                {tModels('body')}
              </p>
            </div>
          </Reveal>
        </section>

        {/* cta */}
        <section className="mx-auto max-w-[1280px] px-6 py-24 md:px-10 md:py-32">
          <CtaStrip />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
