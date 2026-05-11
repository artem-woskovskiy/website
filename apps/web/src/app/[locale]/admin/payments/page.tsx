import { Card } from '@/components/ui/card';
import { serverFetch } from '@/lib/server-api';
import { CreditCard } from 'lucide-react';
import { Link } from '@/i18n/navigation';

export const metadata = { title: 'Payments' };

interface PaymentRow {
  id: string;
  invoiceId: string;
  amountRub: number;
  status: string;
  createdAt: string;
  paidAt: string | null;
  description: string | null;
  user: { id: string; email: string; name: string | null };
}

export default async function AdminPaymentsPage({
  searchParams,
}: { searchParams: Promise<{ status?: string }> }) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  const { data } = await serverFetch<PaymentRow[]>(`/admin/payments?${qs.toString()}`);

  const payments = data ?? [];
  const totalAmount = payments.reduce((sum, p) => sum + (p.status === 'SUCCEEDED' ? p.amountRub : 0), 0);
  const succeeded = payments.filter(p => p.status === 'SUCCEEDED').length;
  const pending = payments.filter(p => p.status === 'PENDING').length;

  return (
    <div className="space-y-8">
      <header>
        <div className="flex items-center gap-2 text-[var(--color-accent)] font-mono text-[10px] uppercase tracking-[0.2em] mb-1">
          <CreditCard className="size-3" />
          Financial Overview
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)] p-5">
          <p className="text-[10px] uppercase tracking-[0.15em] text-[var(--color-fg-dim)]">Total Revenue</p>
          <p className="text-2xl font-bold tracking-tight mt-1">{(totalAmount / 100).toLocaleString('ru-RU')} ₽</p>
        </div>
        <div className="rounded-lg border border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)] p-5">
          <p className="text-[10px] uppercase tracking-[0.15em] text-[var(--color-fg-dim)]">Succeeded</p>
          <p className="text-2xl font-bold tracking-tight mt-1 text-[var(--color-success)]">{succeeded}</p>
        </div>
        <div className="rounded-lg border border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)] p-5">
          <p className="text-[10px] uppercase tracking-[0.15em] text-[var(--color-fg-dim)]">Pending</p>
          <p className="text-2xl font-bold tracking-tight mt-1 text-[var(--color-accent)]">{pending}</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 text-sm">
        {['All', 'SUCCEEDED', 'PENDING', 'FAILED', 'REFUNDED'].map((s) => (
          <a
            key={s}
            href={s === 'All' ? '?' : `?status=${s}`}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              (s === 'All' && !params.status) || params.status === s
                ? 'bg-[var(--color-accent)] text-[var(--color-accent-fg)]'
                : 'border border-[var(--color-bg-grid)] text-[var(--color-fg-mute)] hover:bg-[var(--color-bg-grid)]'
            }`}
          >
            {s}
          </a>
        ))}
      </div>

      {/* Payments table */}
      <Card className="border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)]/30">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] uppercase tracking-[0.15em] text-[var(--color-fg-dim)]">
              <tr className="border-b border-[var(--color-bg-grid)]">
                <th className="px-6 py-3 font-medium">Invoice</th>
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-6 py-3 font-medium">Description</th>
                <th className="px-6 py-3 font-medium text-right">Amount</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-bg-grid)]">
              {payments.map((p) => (
                <tr key={p.id} className="group hover:bg-[var(--color-bg-grid)]/20 transition-colors">
                  <td className="px-6 py-4 font-mono text-[11px] text-[var(--color-fg-mute)]">{p.invoiceId}</td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/users/${p.user.id}`}
                      className="hover:text-[var(--color-accent)] transition-colors"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{p.user.name ?? 'Anonymous'}</span>
                        <span className="text-[10px] font-mono text-[var(--color-fg-dim)]">{p.user.email}</span>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-xs text-[var(--color-fg-mute)] max-w-[200px] truncate">
                    {p.description ?? '—'}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold">{(p.amountRub / 100).toFixed(2)} ₽</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-[11px] text-[var(--color-fg-mute)]">
                    {p.paidAt?.slice(0, 10) ?? p.createdAt.slice(0, 10)}
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td className="px-6 py-12 text-center text-[var(--color-fg-mute)] italic" colSpan={6}>
                    No payments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color =
    status === 'SUCCEEDED' ? 'var(--color-success)' :
    status === 'PENDING' ? 'var(--color-accent)' :
    status === 'FAILED' ? 'var(--color-danger)' :
    'var(--color-fg-dim)';
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-tighter"
      style={{ backgroundColor: `color-mix(in oklch, ${color} 15%, transparent)`, color }}
    >
      <span className="size-1 rounded-full" style={{ backgroundColor: color }} />
      {status}
    </span>
  );
}
