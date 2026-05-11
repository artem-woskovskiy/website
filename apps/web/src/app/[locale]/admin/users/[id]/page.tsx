import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { UserActions } from '@/components/admin/user-actions';
import { serverFetch } from '@/lib/server-api';
import { ArrowLeft, Calendar, Mail, Shield, Key, Monitor } from 'lucide-react';
import { Link } from '@/i18n/navigation';

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
  if (!u) return <p className="text-[var(--color-fg-mute)]">User not found.</p>;

  return (
    <div className="space-y-8">
      {/* Back navigation */}
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-2 text-sm text-[var(--color-fg-mute)] hover:text-[var(--color-fg)] transition-colors"
      >
        <ArrowLeft className="size-3" />
        Back to Users
      </Link>

      {/* User header */}
      <div className="rounded-lg border border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)] p-6">
        <div className="flex items-start gap-4">
          <div className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-strong)] font-mono text-lg font-bold text-[var(--color-accent-fg)]">
            {(u.name ?? u.email).slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">{u.name ?? 'Unnamed'}</h1>
            <p className="text-sm text-[var(--color-fg-mute)] font-mono mt-0.5">{u.email}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
            u.role === 'ADMIN'
              ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
              : 'bg-[var(--color-bg-grid)] text-[var(--color-fg-dim)]'
          }`}>
            {u.role}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-6 md:grid-cols-4">
          <InfoChip icon={Calendar} label="Joined" value={u.createdAt.slice(0, 10)} />
          <InfoChip icon={Mail} label="Verified" value={u.emailVerifiedAt ? 'Yes' : 'No'} />
          <InfoChip icon={Monitor} label="Sessions" value={String(u.sessions.length)} />
          <InfoChip icon={Key} label="API Keys" value={String(u.apiKeys.length)} />
        </div>
      </div>

      {/* Actions (edit / grant / delete) */}
      <UserActions
        userId={u.id}
        currentRole={u.role}
        currentName={u.name}
        emailVerified={!!u.emailVerifiedAt}
      />

      {/* Subscriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Subscriptions</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] uppercase tracking-[0.15em] text-[var(--color-fg-dim)]">
              <tr className="border-b border-[var(--color-bg-grid)]">
                <th className="px-6 py-3 font-medium">Plan</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Interval</th>
                <th className="px-6 py-3 font-medium text-right">Period End</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-bg-grid)]">
              {u.subscriptions.map((s) => (
                <tr key={s.id} className="hover:bg-[var(--color-bg-grid)]/20 transition-colors">
                  <td className="px-6 py-4 font-medium">{s.plan.name}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="px-6 py-4 text-[var(--color-fg-mute)]">{s.interval}</td>
                  <td className="px-6 py-4 text-right font-mono text-[11px] text-[var(--color-fg-mute)]">
                    {s.currentPeriodEnd?.slice(0, 10) ?? '—'}
                  </td>
                </tr>
              ))}
              {u.subscriptions.length === 0 && (
                <tr><td className="px-6 py-8 text-center text-[var(--color-fg-mute)] italic" colSpan={4}>No subscriptions.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Active Sessions</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] uppercase tracking-[0.15em] text-[var(--color-fg-dim)]">
              <tr className="border-b border-[var(--color-bg-grid)]">
                <th className="px-6 py-3 font-medium">User Agent</th>
                <th className="px-6 py-3 font-medium">IP</th>
                <th className="px-6 py-3 font-medium text-right">Last Seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-bg-grid)]">
              {u.sessions.map((s) => (
                <tr key={s.id} className="hover:bg-[var(--color-bg-grid)]/20 transition-colors">
                  <td className="px-6 py-4 text-xs max-w-xs truncate">{s.userAgent ?? '—'}</td>
                  <td className="px-6 py-4 font-mono text-xs">{s.ip ?? '—'}</td>
                  <td className="px-6 py-4 text-right font-mono text-[11px] text-[var(--color-fg-mute)]">
                    {s.lastSeenAt.slice(0, 16).replace('T', ' ')}
                  </td>
                </tr>
              ))}
              {u.sessions.length === 0 && (
                <tr><td className="px-6 py-8 text-center text-[var(--color-fg-mute)] italic" colSpan={3}>No active sessions.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">API Keys</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] uppercase tracking-[0.15em] text-[var(--color-fg-dim)]">
              <tr className="border-b border-[var(--color-bg-grid)]">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Prefix</th>
                <th className="px-6 py-3 font-medium text-right">Last Used</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-bg-grid)]">
              {u.apiKeys.map((k) => (
                <tr key={k.id} className="hover:bg-[var(--color-bg-grid)]/20 transition-colors">
                  <td className="px-6 py-4 font-medium">{k.name}</td>
                  <td className="px-6 py-4 font-mono text-xs text-[var(--color-fg-mute)]">{k.keyPrefix}…</td>
                  <td className="px-6 py-4 text-right font-mono text-[11px] text-[var(--color-fg-mute)]">
                    {k.lastUsedAt?.slice(0, 16).replace('T', ' ') ?? 'Never'}
                  </td>
                </tr>
              ))}
              {u.apiKeys.length === 0 && (
                <tr><td className="px-6 py-8 text-center text-[var(--color-fg-mute)] italic" colSpan={3}>No API keys.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment History</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] uppercase tracking-[0.15em] text-[var(--color-fg-dim)]">
              <tr className="border-b border-[var(--color-bg-grid)]">
                <th className="px-6 py-3 font-medium">Invoice</th>
                <th className="px-6 py-3 font-medium text-right">Amount</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-bg-grid)]">
              {u.payments.map((p) => (
                <tr key={p.id} className="hover:bg-[var(--color-bg-grid)]/20 transition-colors">
                  <td className="px-6 py-4 font-mono text-[11px]">{p.invoiceId}</td>
                  <td className="px-6 py-4 text-right font-semibold">{(p.amountRub / 100).toFixed(2)} ₽</td>
                  <td className="px-6 py-4"><StatusBadge status={p.status} /></td>
                  <td className="px-6 py-4 text-right font-mono text-[11px] text-[var(--color-fg-mute)]">
                    {p.createdAt.slice(0, 10)}
                  </td>
                </tr>
              ))}
              {u.payments.length === 0 && (
                <tr><td className="px-6 py-8 text-center text-[var(--color-fg-mute)] italic" colSpan={4}>No payments.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function InfoChip({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-[var(--color-bg-grid)] p-3">
      <Icon className="size-4 text-[var(--color-fg-dim)]" />
      <div>
        <div className="text-[9px] uppercase tracking-[0.15em] text-[var(--color-fg-dim)]">{label}</div>
        <div className="font-mono text-sm font-semibold">{value}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color = 
    status === 'ACTIVE' || status === 'SUCCEEDED' ? 'var(--color-success)' :
    status === 'PENDING' || status === 'TRIALING' ? 'var(--color-accent)' :
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
