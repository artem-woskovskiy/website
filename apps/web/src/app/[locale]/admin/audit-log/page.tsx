import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { serverFetch } from '@/lib/server-api';
import { FileText } from 'lucide-react';

export const metadata = { title: 'Audit Log' };

interface AuditEntry {
  id: string;
  action: string;
  actorEmail: string | null;
  entityType: string | null;
  entityId: string | null;
  ip: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user: { email: string; name: string | null } | null;
}

interface AuditResponse {
  items: AuditEntry[];
  total: number;
  page: number;
  pageSize: number;
}

export default async function AuditLogPage({
  searchParams,
}: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = params.page ?? '1';
  const { data } = await serverFetch<AuditResponse>(`/admin/audit-log?page=${page}`);

  if (!data) return <p className="text-[var(--color-fg-mute)]">Failed to load audit log.</p>;

  const totalPages = Math.ceil(data.total / data.pageSize);

  return (
    <div className="space-y-8">
      <header>
        <div className="flex items-center gap-2 text-[var(--color-accent)] font-mono text-[10px] uppercase tracking-[0.2em] mb-1">
          <FileText className="size-3" />
          Security & Activity
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
        <p className="text-sm text-[var(--color-fg-mute)] mt-1">
          {data.total} total events · Page {data.page} of {totalPages}
        </p>
      </header>

      <Card className="border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)]/30">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] uppercase tracking-[0.15em] text-[var(--color-fg-dim)]">
              <tr className="border-b border-[var(--color-bg-grid)]">
                <th className="px-6 py-3 font-medium">Timestamp</th>
                <th className="px-6 py-3 font-medium">Action</th>
                <th className="px-6 py-3 font-medium">Actor</th>
                <th className="px-6 py-3 font-medium">Entity</th>
                <th className="px-6 py-3 font-medium">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-bg-grid)]">
              {data.items.map((e) => (
                <tr key={e.id} className="group hover:bg-[var(--color-bg-grid)]/20 transition-colors">
                  <td className="px-6 py-4 font-mono text-[11px] text-[var(--color-fg-mute)] whitespace-nowrap">
                    {e.createdAt.slice(0, 19).replace('T', ' ')}
                  </td>
                  <td className="px-6 py-4">
                    <ActionBadge action={e.action} />
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {e.user?.name ?? e.actorEmail ?? '—'}
                  </td>
                  <td className="px-6 py-4 font-mono text-[11px] text-[var(--color-fg-mute)]">
                    {e.entityType ? `${e.entityType}:${e.entityId?.slice(0, 8)}…` : '—'}
                  </td>
                  <td className="px-6 py-4 font-mono text-[11px] text-[var(--color-fg-dim)]">
                    {e.ip ?? '—'}
                  </td>
                </tr>
              ))}
              {data.items.length === 0 && (
                <tr>
                  <td className="px-6 py-12 text-center text-[var(--color-fg-mute)] italic" colSpan={5}>
                    No audit events recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 border-t border-[var(--color-bg-grid)] p-4">
            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
              <a
                key={p}
                href={`?page=${p}`}
                className={`grid size-8 place-items-center rounded text-xs font-mono transition-colors ${
                  p === data.page
                    ? 'bg-[var(--color-accent)] text-[var(--color-accent-fg)]'
                    : 'hover:bg-[var(--color-bg-grid)]'
                }`}
              >
                {p}
              </a>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function ActionBadge({ action }: { action: string }) {
  const isAuth = action.startsWith('auth.');
  const isAdmin = action.startsWith('admin.');
  const isPayment = action.startsWith('payment.');
  
  const color = isAuth ? 'var(--color-accent)' : isAdmin ? 'var(--color-danger)' : isPayment ? 'var(--color-success)' : 'var(--color-fg-dim)';
  
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[10px] font-medium"
      style={{ backgroundColor: `color-mix(in oklch, ${color} 12%, transparent)`, color }}
    >
      {action}
    </span>
  );
}
