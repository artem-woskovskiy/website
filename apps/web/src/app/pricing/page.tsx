import { CheckoutButton } from '@/components/billing/checkout-button';
import { SiteFooter } from '@/components/marketing/site-footer';
import { SiteHeader } from '@/components/marketing/site-header';
import { getCurrentUser } from '@/lib/auth-server';
import { serverFetch } from '@/lib/server-api';
import type { Plan } from '@/lib/types';
import Link from 'next/link';

export const metadata = { title: 'Pricing' };

export default async function PricingPage() {
  const user = await getCurrentUser();
  const { data: plans } = await serverFetch<Plan[]>('/subscriptions/plans');
  const list = plans ?? [];

  return (
    <>
      <SiteHeader user={user} />
      <main>
        <section className="relative mesh">
          <div className="mx-auto max-w-[1280px] px-6 pb-12 pt-20 md:px-10 md:pb-16 md:pt-32">
            <span className="text-xs uppercase tracking-[0.18em] text-[var(--color-fg-dim)]">
              Pricing
            </span>
            <h1 className="mt-2 max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
              Simple pricing.{' '}
              <span className="font-serif italic text-[var(--color-accent)]">No</span> seats math.
            </h1>
            <p className="mt-4 max-w-xl text-base text-[var(--color-fg-mute)]">
              Pay in RUB via Robokassa. Cancel anytime. Hobby is free forever — bring your own keys.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-[1280px] px-6 pb-32 md:px-10">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {list.map((p) => (
              <PriceCard key={p.code} plan={p} signedIn={!!user} />
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function PriceCard({ plan, signedIn }: { plan: Plan; signedIn: boolean }) {
  const monthly = (plan.priceMonthlyRub / 100).toFixed(0);
  const isPro = plan.code === 'PRO';

  return (
    <div
      className={`flex flex-col rounded-2xl border p-8 ${
        isPro
          ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]'
          : 'border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)]'
      }`}
    >
      <div className="flex items-baseline justify-between">
        <h3 className="text-xl font-semibold">{plan.name}</h3>
        {isPro && (
          <span className="rounded-full bg-[var(--color-accent)] px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.1em] text-[#1c150c]">
            Most popular
          </span>
        )}
      </div>
      <p className="mt-2 min-h-[3rem] text-sm text-[var(--color-fg-mute)]">{plan.description}</p>
      <div className="mt-6 flex items-baseline gap-2">
        <span className="text-5xl font-semibold tracking-tight">
          {plan.priceMonthlyRub === 0 ? '0' : monthly}
        </span>
        <span className="text-sm text-[var(--color-fg-mute)]">
          {plan.priceMonthlyRub === 0 ? 'free forever' : '₽ / month'}
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
            className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-[var(--color-bg-grid)] text-sm hover:border-[var(--color-accent)]"
          >
            {signedIn ? 'Open account' : 'Get started free'}
          </Link>
        ) : signedIn ? (
          <CheckoutButton planCode={plan.code} />
        ) : (
          <Link
            href={`/sign-up?next=/pricing#${plan.code}`}
            className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[var(--color-accent)] text-sm font-medium text-[#1c150c] hover:bg-[var(--color-accent-strong)]"
          >
            Sign up to subscribe
          </Link>
        )}
      </div>
    </div>
  );
}
