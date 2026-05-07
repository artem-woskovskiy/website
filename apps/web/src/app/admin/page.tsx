import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { serverFetch } from '@/lib/server-api';

export const metadata = { title: 'Admin' };

interface Stats {
  userCount: number;
  activeSubs: number;
  totalRevenueRub: number;
  recentPayments: Array<{
    id: string;
    invoiceId: string;
    amountRub: number;
    status: string;
    createdAt: string;
    user: { email: string; name: string | null };
  }>;
}

export default async function AdminOverviewPage() {
  const { data } = await serverFetch<Stats>('/admin/stats');
  if (!data) return <p>Failed to load.</p>;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Stat label="Users" value={data.userCount.toLocaleString()} />
        <Stat label="Active subscriptions" value={data.activeSubs.toLocaleString()} />
        <Stat label="Revenue (RUB)" value={(data.totalRevenueRub / 100).toLocaleString('en-US')} />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Recent payments</CardTitle>
            <CardDescription>Last 10 invoices.</CardDescription>
          </div>
        </CardHeader>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-[0.1em] text-[var(--color-fg-dim)]">
            <tr>
              <th className="py-2">Invoice</th>
              <th className="py-2">User</th>
              <th className="py-2">Amount</th>
              <th className="py-2">Status</th>
              <th className="py-2">When</th>
            </tr>
          </thead>
          <tbody>
            {data.recentPayments.map((p) => (
              <tr key={p.id} className="border-t border-[var(--color-bg-grid)]">
                <td className="py-2 font-mono text-xs">{p.invoiceId}</td>
                <td className="py-2">{p.user.name ?? p.user.email}</td>
                <td className="py-2">{(p.amountRub / 100).toFixed(2)} ₽</td>
                <td className="py-2">{p.status}</td>
                <td className="py-2 text-[var(--color-fg-mute)]">
                  {p.createdAt.slice(0, 16).replace('T', ' ')}
                </td>
              </tr>
            ))}
            {data.recentPayments.length === 0 && (
              <tr>
                <td className="py-3 text-[var(--color-fg-mute)]" colSpan={5}>
                  No payments yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <div className="text-xs uppercase tracking-[0.1em] text-[var(--color-fg-dim)]">{label}</div>
      <div className="mt-2 font-mono text-3xl">{value}</div>
    </Card>
  );
}
