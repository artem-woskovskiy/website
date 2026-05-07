import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { serverFetch } from '@/lib/server-api';

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

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>All payments</CardTitle>
          <CardDescription>Last 100.</CardDescription>
        </div>
      </CardHeader>
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-[0.1em] text-[var(--color-fg-dim)]">
          <tr>
            <th className="py-2">Invoice</th>
            <th className="py-2">User</th>
            <th className="py-2">Description</th>
            <th className="py-2">Amount</th>
            <th className="py-2">Status</th>
            <th className="py-2">Paid</th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((p) => (
            <tr key={p.id} className="border-t border-[var(--color-bg-grid)]">
              <td className="py-2 font-mono text-xs">{p.invoiceId}</td>
              <td className="py-2">{p.user.name ?? p.user.email}</td>
              <td className="py-2 text-[var(--color-fg-mute)]">{p.description}</td>
              <td className="py-2">{(p.amountRub / 100).toFixed(2)} ₽</td>
              <td className="py-2">{p.status}</td>
              <td className="py-2 text-[var(--color-fg-mute)]">
                {p.paidAt?.slice(0, 16).replace('T', ' ') ?? '—'}
              </td>
            </tr>
          ))}
          {(!data || data.length === 0) && (
            <tr>
              <td className="py-3 text-[var(--color-fg-mute)]" colSpan={6}>
                No payments yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Card>
  );
}
