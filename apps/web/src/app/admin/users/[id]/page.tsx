import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { serverFetch } from '@/lib/server-api';

interface UserDetail {
  id: string;
  email: string;
  name: string | null;
  role: 'USER' | 'ADMIN';
  emailVerifiedAt: string | null;
  createdAt: string;
  subscriptions: Array<{
    id: string;
    status: string;
    interval: string;
    currentPeriodEnd: string | null;
    plan: { name: string; code: string };
  }>;
  payments: Array<{
    id: string;
    invoiceId: string;
    amountRub: number;
    status: string;
    createdAt: string;
  }>;
  sessions: Array<{ id: string; userAgent: string | null; ip: string | null; lastSeenAt: string }>;
  apiKeys: Array<{ id: string; name: string; keyPrefix: string; lastUsedAt: string | null }>;
}

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: u } = await serverFetch<UserDetail>(`/admin/users/${id}`);
  if (!u) return <p>Not found.</p>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>{u.name ?? u.email}</CardTitle>
            <CardDescription>
              {u.email} · {u.role}
            </CardDescription>
          </div>
        </CardHeader>
        <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          <Stat label="Joined" value={u.createdAt.slice(0, 10)} />
          <Stat label="Verified" value={u.emailVerifiedAt ? 'yes' : 'no'} />
          <Stat label="Sessions" value={String(u.sessions.length)} />
          <Stat label="API keys" value={String(u.apiKeys.length)} />
        </div>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Subscriptions</CardTitle>
          </div>
        </CardHeader>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-[0.1em] text-[var(--color-fg-dim)]">
            <tr>
              <th className="py-2">Plan</th>
              <th className="py-2">Status</th>
              <th className="py-2">Interval</th>
              <th className="py-2">Period end</th>
            </tr>
          </thead>
          <tbody>
            {u.subscriptions.map((s) => (
              <tr key={s.id} className="border-t border-[var(--color-bg-grid)]">
                <td className="py-2">{s.plan.name}</td>
                <td className="py-2">{s.status}</td>
                <td className="py-2">{s.interval}</td>
                <td className="py-2 text-[var(--color-fg-mute)]">
                  {s.currentPeriodEnd?.slice(0, 10) ?? '—'}
                </td>
              </tr>
            ))}
            {u.subscriptions.length === 0 && (
              <tr>
                <td className="py-3 text-[var(--color-fg-mute)]" colSpan={4}>
                  None.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Payments</CardTitle>
          </div>
        </CardHeader>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-[0.1em] text-[var(--color-fg-dim)]">
            <tr>
              <th className="py-2">Invoice</th>
              <th className="py-2">Amount</th>
              <th className="py-2">Status</th>
              <th className="py-2">When</th>
            </tr>
          </thead>
          <tbody>
            {u.payments.map((p) => (
              <tr key={p.id} className="border-t border-[var(--color-bg-grid)]">
                <td className="py-2 font-mono text-xs">{p.invoiceId}</td>
                <td className="py-2">{(p.amountRub / 100).toFixed(2)} ₽</td>
                <td className="py-2">{p.status}</td>
                <td className="py-2 text-[var(--color-fg-mute)]">
                  {p.createdAt.slice(0, 16).replace('T', ' ')}
                </td>
              </tr>
            ))}
            {u.payments.length === 0 && (
              <tr>
                <td className="py-3 text-[var(--color-fg-mute)]" colSpan={4}>
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
    <div className="rounded-md border border-[var(--color-bg-grid)] p-3">
      <div className="text-[10px] uppercase tracking-[0.1em] text-[var(--color-fg-dim)]">
        {label}
      </div>
      <div className="mt-1 font-mono text-base">{value}</div>
    </div>
  );
}
