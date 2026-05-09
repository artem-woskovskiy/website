import { RevokeButton } from '@/components/account/revoke-session-button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { serverFetch } from '@/lib/server-api';

export const metadata = { title: 'Devices' };

interface SessionDto {
  id: string;
  userAgent: string | null;
  ip: string | null;
  lastSeenAt: string;
  createdAt: string;
}

export default async function DevicesPage() {
  const { data } = await serverFetch<SessionDto[]>('/users/me/sessions');
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Devices</h1>
        <p className="mt-1 text-sm text-[var(--color-fg-mute)]">Active browser sessions.</p>
      </div>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Sessions</CardTitle>
            <CardDescription>Revoke any device that you don&rsquo;t recognize.</CardDescription>
          </div>
        </CardHeader>
        <ul className="divide-y divide-[var(--color-bg-grid)]">
          {(data ?? []).map((s) => (
            <li key={s.id} className="flex items-start justify-between py-3">
              <div className="min-w-0">
                <div className="truncate text-sm">{s.userAgent ?? 'Unknown agent'}</div>
                <div className="text-xs text-[var(--color-fg-mute)]">
                  {s.ip ?? '—'} · last seen {s.lastSeenAt.slice(0, 16).replace('T', ' ')}
                </div>
              </div>
              <RevokeButton id={s.id} />
            </li>
          ))}
          {(!data || data.length === 0) && (
            <li className="py-3 text-sm text-[var(--color-fg-mute)]">No active sessions.</li>
          )}
        </ul>
      </Card>
    </div>
  );
}
