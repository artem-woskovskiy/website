import { AccountHero } from '@/components/account/account-hero';
import { CancelSubscriptionButton } from '@/components/billing/cancel-button';
import { Reveal } from '@/components/marketing/reveal';
import { Tilt } from '@/components/marketing/tilt';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import { serverFetch } from '@/lib/server-api';
import type { MeUser, Payment, Subscription } from '@/lib/types';

export const metadata = { title: 'Billing' };

interface ProfileResponse extends MeUser {
  subscriptions: Array<{
    plan: { name: string; code: string };
    status: string;
    currentPeriodEnd: string | null;
  }>;
}

interface ApiKeyDto {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  createdAt: string;
}

export default async function BillingPage({
  searchParams,
}: { searchParams: Promise<{ payment?: string; inv?: string }> }) {
  const params = await searchParams;
  const [{ data: profile }, { data: sub }, { data: payments }, { data: apiKeys }] = await Promise.all([
    serverFetch<ProfileResponse>('/users/me'),
    serverFetch<Subscription | null>('/subscriptions/me'),
    serverFetch<Payment[]>('/payments/mine'),
    serverFetch<ApiKeyDto[]>('/api-keys'),
  ]);

  const planName = sub?.plan.name ?? profile?.subscriptions?.[0]?.plan.name ?? 'Hobby';
  const planStatus = sub?.status ?? 'free';
  const renewsOn = sub?.currentPeriodEnd?.slice(0, 10) ?? null;

  return (
    <div className="space-y-8">
      {profile && (
        <AccountHero
          name={profile.name ?? ''}
          email={profile.email}
          planName={planName}
          planStatus={planStatus}
          renewsOn={renewsOn}
          apiKeyCount={apiKeys?.length ?? 0}
        />
      )}

      {params.payment === 'success' && (
        <Reveal>
          <div className="rounded-md border border-[var(--color-success)] bg-[var(--color-success)]/10 px-4 py-3 text-sm text-[var(--color-success)]">
            Payment received{params.inv ? ` (invoice ${params.inv})` : ''}. Your subscription is
            active.
          </div>
        </Reveal>
      )}
      {params.payment === 'failed' && (
        <Reveal>
          <div className="rounded-md border border-[var(--color-danger)] bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]">
            Payment was not completed.
          </div>
        </Reveal>
      )}

      <Reveal delay={0.05}>
        <Tilt intensity={2} glow={false}>
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Current plan</CardTitle>
                <CardDescription>
                  {sub
                    ? `${sub.plan.name} · ${sub.status} · renews ${sub.currentPeriodEnd?.slice(0, 10) ?? '—'}`
                    : 'You are on the free Hobby plan.'}
                </CardDescription>
              </div>
              {!sub && (
                <Link
                  href="/pricing"
                  className="inline-flex h-9 items-center rounded-md bg-[var(--color-accent)] px-3 text-sm font-medium text-[var(--color-accent-fg)]"
                >
                  Upgrade
                </Link>
              )}
            </CardHeader>
            {sub && !sub.cancelAtPeriodEnd && <CancelSubscriptionButton />}
            {sub?.cancelAtPeriodEnd && (
              <p className="text-sm text-[var(--color-fg-mute)]">
                Your subscription will end at {sub.currentPeriodEnd?.slice(0, 10)}.
              </p>
            )}
          </Card>
        </Tilt>
      </Reveal>

      <Reveal delay={0.1}>
        <Tilt intensity={2} glow={false}>
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Invoices</CardTitle>
                <CardDescription>Last 50 payments.</CardDescription>
              </div>
            </CardHeader>
            {payments && payments.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-[0.1em] text-[var(--color-fg-dim)]">
                  <tr>
                    <th className="py-2">Invoice</th>
                    <th className="py-2">Description</th>
                    <th className="py-2">Amount</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-t border-[var(--color-bg-grid)]">
                      <td className="py-2 font-mono text-xs">{p.invoiceId}</td>
                      <td className="py-2">{p.description}</td>
                      <td className="py-2">{(p.amountRub / 100).toFixed(2)} ₽</td>
                      <td className="py-2">{p.status}</td>
                      <td className="py-2 text-[var(--color-fg-mute)]">
                        {p.paidAt?.slice(0, 10) ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-[var(--color-fg-mute)]">No invoices yet.</p>
            )}
          </Card>
        </Tilt>
      </Reveal>
    </div>
  );
}
