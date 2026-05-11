import { Card } from '@/components/ui/card';
import { serverFetch } from '@/lib/server-api';
import { Webhook } from 'lucide-react';

export const metadata = { title: 'Webhook Log' };

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
}

interface WebhookResponse {
  items: AuditEntry[];
  total: number;
  page: number;
  pageSize: number;
}

export default async function WebhookLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = params.page ?? '1';
  const { data } = await serverFetch<WebhookResponse>(`/admin/webhooks?page=${page}`);

  if (!data)
    return <p className="text-[var(--color-fg-mute)]">Failed to load webhook log.</p>;

  const totalPages = Math.ceil(data.total / data.pageSize);

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2 text-[var(--color-accent)] font-mono text-[10px] uppercase tracking-[0.2em] mb-1">
          <Webhook className="size-3" />
          Inbound integrations
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Webhook Log</h1>
          <span className="text-sm text-[var(--color-fg-mute)] font-mono">
            {data.total.toLocaleString()} deliveries
          </span>
        </div>
        <p className="text-sm text-[var(--color-fg-mute)] mt-2 max-w-2xl">
          All inbound webhook callbacks (Robokassa payments, etc.) and payment-related events. For
          full audit history see{' '}
          <a className="text-[var(--color-accent)] hover:underline" href="/admin/audit-log">
            Audit Log
          </a>
          .
        </p>
      </header>

      <Card className="border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)]/30">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] uppercase tracking-[0.15em] text-[var(--color-fg-dim)]">
              <tr className="border-b border-[var(--color-bg-grid)]">
                <th className="px-6 py-3 font-medium">Timestamp</th>
                <th className="px-6 py-3 font-medium">Event</th>
                <th className="px-6 py-3 font-medium">Entity</th>
                <th className="px-6 py-3 font-medium">IP</th>
                <th className="px-6 py-3 font-medium">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-bg-grid)]">
              {data.items.map((e) => (
                <tr
                  key={e.id}
                  className="group hover:bg-[var(--color-bg-grid)]/20 transition-colors align-top"
                >
                  <td className="px-6 py-4 font-mono text-[11px] text-[var(--color-fg-mute)] whitespace-nowrap">
                    {e.createdAt.slice(0, 19).replace('T', ' ')}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-md bg-[var(--color-success-soft)] px-2 py-0.5 font-mono text-[10px] font-medium text-[var(--color-success)]">
                      {e.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-[11px] text-[var(--color-fg-mute)]">
                    {e.entityType
                      ? `${e.entityType}:${e.entityId?.slice(0, 8) ?? '—'}…`
                      : '—'}
                  </td>
                  <td className="px-6 py-4 font-mono text-[11px] text-[var(--color-fg-dim)]">
                    {e.ip ?? '—'}
                  </td>
                  <td className="px-6 py-4 max-w-[400px]">
                    {e.metadata ? (
                      <details className="cursor-pointer">
                        <summary className="text-[11px] text-[var(--color-fg-mute)] hover:text-[var(--color-accent)] select-none">
                          view payload
                        </summary>
                        <pre className="mt-2 overflow-x-auto rounded bg-[var(--color-bg-grid)]/40 p-2 font-mono text-[10px] text-[var(--color-fg-mute)]">
                          {JSON.stringify(e.metadata, null, 2)}
                        </pre>
                      </details>
                    ) : (
                      <span className="text-[11px] text-[var(--color-fg-dim)]">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {data.items.length === 0 && (
                <tr>
                  <td
                    className="px-6 py-12 text-center text-[var(--color-fg-mute)] italic"
                    colSpan={5}
                  >
                    No webhook deliveries recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

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
