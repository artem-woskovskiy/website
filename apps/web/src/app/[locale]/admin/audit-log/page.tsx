import { Card } from '@/components/ui/card';
import { serverFetch } from '@/lib/server-api';
import { FileText, Download, Filter } from 'lucide-react';

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
}: {
  searchParams: Promise<{ page?: string; action?: string }>;
}) {
  const params = await searchParams;
  const page = params.page ?? '1';
  const qs = new URLSearchParams({ page });
  if (params.action) qs.set('action', params.action);
  const { data } = await serverFetch<AuditResponse>(`/admin/audit-log?${qs.toString()}`);

  if (!data) return <p className="text-[var(--color-fg-mute)]">Failed to load audit log.</p>;

  const totalPages = Math.ceil(data.total / data.pageSize);
  const exportQs = new URLSearchParams();
  if (params.action) exportQs.set('action', params.action);

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2 text-[var(--color-accent)] font-mono text-[10px] uppercase tracking-[0.2em] mb-1">
          <FileText className="size-3" />
          Security & Activity
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
          <span className="text-sm text-[var(--color-fg-mute)] font-mono">
            {data.total.toLocaleString()} events
          </span>
        </div>
      </header>

      {/* Filter bar */}
      <form className="flex flex-wrap items-center gap-2">
        <div className="relative grow min-w-[200px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--color-fg-dim)]" />
          <input
            name="action"
            defaultValue={params.action ?? ''}
            placeholder="Filter by action (e.g. admin., payment., oauth.)…"
            className="w-full h-10 rounded-lg border border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)] pl-10 pr-4 text-sm font-mono focus:outline-none focus:border-[var(--color-accent)] transition-colors"
          />
        </div>
        <button
          type="submit"
          className="h-10 rounded-lg bg-[var(--color-accent)] px-4 text-sm font-medium text-[var(--color-accent-fg)] hover:bg-[var(--color-accent-strong)] transition-colors"
        >
          Apply
        </button>
        <a
          href={`/api/v1/admin/audit-log.csv?${exportQs.toString()}`}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[var(--color-bg-grid)] px-3 text-sm text-[var(--color-fg-mute)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
          title="Download filtered audit log as CSV"
        >
          <Download className="size-3.5" /> CSV
        </a>
      </form>

      {/* Quick filter chips */}
      <div className="flex flex-wrap gap-1.5 text-xs">
        {[
          { label: 'All', value: '' },
          { label: 'Admin', value: 'admin.' },
          { label: 'Auth', value: 'auth.' },
          { label: 'OAuth', value: 'oauth.' },
          { label: 'Payment', value: 'payment.' },
        ].map((chip) => {
          const active = (params.action ?? '') === chip.value;
          const linkQs = new URLSearchParams();
          if (chip.value) linkQs.set('action', chip.value);
          return (
            <a
              key={chip.label}
              href={`?${linkQs.toString()}`}
              className={`rounded-full border px-3 py-1 transition-colors ${
                active
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                  : 'border-[var(--color-bg-grid)] text-[var(--color-fg-mute)] hover:border-[var(--color-fg-mute)]'
              }`}
            >
              {chip.label}
            </a>
          );
        })}
      </div>

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
                    {e.actorEmail ?? e.user?.email ?? '—'}
                  </td>
                  <td className="px-6 py-4 font-mono text-[11px] text-[var(--color-fg-mute)]">
                    {e.entityType ? `${e.entityType}:${e.entityId?.slice(0, 8) ?? '—'}…` : '—'}
                  </td>
                  <td className="px-6 py-4 font-mono text-[11px] text-[var(--color-fg-dim)]">
                    {e.ip ?? '—'}
                  </td>
                </tr>
              ))}
              {data.items.length === 0 && (
                <tr>
                  <td className="px-6 py-12 text-center text-[var(--color-fg-mute)] italic" colSpan={5}>
                    No audit events match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 border-t border-[var(--color-bg-grid)] p-4">
            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => {
              const pageQs = new URLSearchParams();
              pageQs.set('page', String(p));
              if (params.action) pageQs.set('action', params.action);
              return (
                <a
                  key={p}
                  href={`?${pageQs.toString()}`}
                  className={`grid size-8 place-items-center rounded text-xs font-mono transition-colors ${
                    p === data.page
                      ? 'bg-[var(--color-accent)] text-[var(--color-accent-fg)]'
                      : 'hover:bg-[var(--color-bg-grid)]'
                  }`}
                >
                  {p}
                </a>
              );
            })}
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
  const isOauth = action.startsWith('oauth.');

  const color = isAuth
    ? 'var(--color-accent)'
    : isAdmin
      ? 'var(--color-danger)'
      : isPayment
        ? 'var(--color-success)'
        : isOauth
          ? '#a855f7'
          : 'var(--color-fg-dim)';

  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[10px] font-medium"
      style={{ backgroundColor: `color-mix(in oklch, ${color} 12%, transparent)`, color }}
    >
      {action}
    </span>
  );
}
