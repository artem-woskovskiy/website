import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { serverFetch } from '@/lib/server-api';
import { Monitor } from 'lucide-react';
import { RevokeButton } from '@/components/admin/revoke-session-btn';

export const metadata = { title: 'Sessions' };

interface SessionRow {
  id: string;
  userAgent: string | null;
  ip: string | null;
  lastSeenAt: string;
  createdAt: string;
  clientId: string | null;
  deviceName: string | null;
  platform: string | null;
  user: { id: string; email: string; name: string | null };
}

export default async function AdminSessionsPage() {
  const { data } = await serverFetch<SessionRow[]>('/admin/sessions');

  return (
    <div className="space-y-8">
      <header>
        <div className="flex items-center gap-2 text-[var(--color-accent)] font-mono text-[10px] uppercase tracking-[0.2em] mb-1">
          <Monitor className="size-3" />
          Active Connections
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Sessions</h1>
        <p className="text-sm text-[var(--color-fg-mute)] mt-1">
          {data?.length ?? 0} active sessions across all users
        </p>
      </header>

      <Card className="border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)]/30">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] uppercase tracking-[0.15em] text-[var(--color-fg-dim)]">
              <tr className="border-b border-[var(--color-bg-grid)]">
                <th className="px-6 py-3 font-medium">User</th>
                <th className="px-6 py-3 font-medium">Client</th>
                <th className="px-6 py-3 font-medium">IP</th>
                <th className="px-6 py-3 font-medium">Last Seen</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-bg-grid)]">
              {(data ?? []).map((s) => (
                <tr key={s.id} className="group hover:bg-[var(--color-bg-grid)]/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium">{s.user.name ?? 'Unnamed'}</span>
                      <span className="text-[10px] font-mono text-[var(--color-fg-dim)]">{s.user.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs">{s.clientId ?? 'Web browser'}</span>
                      {s.deviceName && (
                        <span className="text-[10px] text-[var(--color-fg-dim)]">{s.deviceName}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-[11px] text-[var(--color-fg-mute)]">
                    {s.ip ?? '—'}
                  </td>
                  <td className="px-6 py-4 font-mono text-[11px] text-[var(--color-fg-mute)]">
                    {s.lastSeenAt.slice(0, 19).replace('T', ' ')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <RevokeButton sessionId={s.id} />
                  </td>
                </tr>
              ))}
              {(!data || data.length === 0) && (
                <tr>
                  <td className="px-6 py-12 text-center text-[var(--color-fg-mute)] italic" colSpan={5}>
                    No active sessions.
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
