import { CancelSubscriptionButton } from '@/components/billing/cancel-button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { serverFetch } from '@/lib/server-api';
import type { Payment, Subscription } from '@/lib/types';
import Link from 'next/link';

export const metadata = { title: 'Billing' };

export default async function BillingPage({
  searchParams,
}: { searchParams: Promise<{ payment?: string; inv?: string }> }) {
  const params = await searchParams;
  const [{ data: sub }, { data: payments }] = await Promise.all([
    serverFetch<Subscription | null>('/subscriptions/me'),
    serverFetch<Payment[]>('/payments/mine'),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Billing</h1>
        <p className="mt-1 text-sm text-[var(--color-fg-mute)]">Subscription and invoices.</p>
      </div>

      {params.payment === 'success' && (
        <div className="rounded-md border border-[var(--color-success)] bg-[var(--color-success)]/10 px-4 py-3 text-sm text-[var(--color-success)]">
          Payment received{params.inv ? ` (invoice ${params.inv})` : ''}. Your subscription is
          active.
        </div>
      )}
      {params.payment === 'failed' && (
        <div className="rounded-md border border-[var(--color-danger)] bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]">
          Payment was not completed.
        </div>
      )}

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
              className="inline-flex h-9 items-center rounded-md bg-[var(--color-accent)] px-3 text-sm font-medium text-[#1c150c]"
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
    </div>
  );
}
