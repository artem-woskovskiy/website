import { CheckoutButton } from '@/components/billing/checkout-button';
import { Link } from '@/i18n/navigation';
import { Reveal, RevealItem, RevealStagger } from '@/components/marketing/reveal';
import { SiteFooter } from '@/components/marketing/site-footer';
import { SiteHeader } from '@/components/marketing/site-header';
import { getCurrentUser } from '@/lib/auth-server';
import { serverFetch } from '@/lib/server-api';
import type { Plan } from '@/lib/types';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export default async function PricingPage({
  params,
}: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getCurrentUser();
  const { data: plans } = await serverFetch<Plan[]>('/subscriptions/plans');
  const list = plans ?? [];
  const t = await getTranslations('pricing');

  return (
    <>
      <SiteHeader user={user} />
      <main>
        <section className="mesh relative">
          <div className="mx-auto max-w-[1280px] px-6 pb-12 pt-20 md:px-10 md:pb-16 md:pt-32">
            <Reveal>
              <span className="text-xs uppercase tracking-[0.18em] text-[var(--color-fg-dim)]">
                {t('eyebrow')}
              </span>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="mt-2 max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
                {t('title')}
              </h1>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="mt-4 max-w-xl text-base text-[var(--color-fg-mute)]">
                {t('subtitle')}
              </p>
            </Reveal>
          </div>
        </section>

        <section className="mx-auto max-w-[1280px] px-6 pb-32 md:px-10">
          <RevealStagger className="grid grid-cols-1 gap-6 md:grid-cols-3" stagger={0.08}>
            {list.map((p) => (
              <RevealItem key={p.code}>
                <PriceCard plan={p} signedIn={!!user} t={t} />
              </RevealItem>
            ))}
          </RevealStagger>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

type PricingT = Awaited<ReturnType<typeof getTranslations<'pricing'>>>;

function PriceCard({
  plan,
  signedIn,
  t,
}: { plan: Plan; signedIn: boolean; t: PricingT }) {
  const monthly = (plan.priceMonthlyRub / 100).toFixed(0);
  const isPro = plan.code === 'PRO';

  return (
    <div
      className={`flex h-full flex-col rounded-2xl border p-8 transition-all duration-300 hover:-translate-y-1 ${
        isPro
          ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] shadow-[0_30px_80px_-30px_rgba(59,130,246,0.3)]'
          : 'border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)] hover:border-[var(--color-accent)]'
      }`}
    >
      <div className="flex items-baseline justify-between">
        <h3 className="text-xl font-semibold">{plan.name}</h3>
        {isPro && (
          <span className="rounded-full bg-[var(--color-accent)] px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--color-accent-fg)]">
            ★
          </span>
        )}
      </div>
      <p className="mt-2 min-h-[3rem] text-sm text-[var(--color-fg-mute)]">{plan.description}</p>
      <div className="mt-6 flex items-baseline gap-2">
        <span className="text-5xl font-semibold tracking-tight">
          {plan.priceMonthlyRub === 0 ? '0' : monthly}
        </span>
        <span className="text-sm text-[var(--color-fg-mute)]">
          {plan.priceMonthlyRub === 0 ? t('free') : `₽ ${t('perMonth')}`}
        </span>
      </div>
      <ul className="mt-6 space-y-2 text-sm">
        {plan.features.map((f) => (
          <li key={f} className="flex gap-2 text-[var(--color-fg)]">
            <span className="mt-1 size-1.5 rounded-full bg-[var(--color-accent)]" /> {f}
          </li>
        ))}
      </ul>
      <div className="mt-8">
        {plan.code === 'HOBBY' ? (
          <Link
            href={signedIn ? '/account' : '/sign-up'}
            className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-[var(--color-bg-grid)] text-sm transition-colors hover:border-[var(--color-accent)]"
          >
            {signedIn ? t('currentPlan') : t('free')}
          </Link>
        ) : signedIn ? (
          <CheckoutButton planCode={plan.code} />
        ) : (
          <Link
            href={`/sign-up?next=/pricing#${plan.code}`}
            className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[var(--color-accent)] text-sm font-medium text-[var(--color-accent-fg)] transition-colors hover:bg-[var(--color-accent-strong)]"
          >
            {t('subscribe')}
          </Link>
        )}
      </div>
    </div>
  );
}
