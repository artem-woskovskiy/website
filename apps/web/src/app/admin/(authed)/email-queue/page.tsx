import { getAdminRedis } from '@/lib/admin-redis';
import { Queue } from 'bullmq';
import { AlertTriangle } from 'lucide-react';
import { z } from 'zod';
import {
  EmptyState,
  StatusPill,
  TBody,
  THead,
  Table,
  Td,
  Th,
  Tr,
} from '../../_components/data-table';
import { StatCard } from '../../_components/stat-card';
import { removeEmailJobAction, retryEmailJobAction } from './actions';

export const dynamic = 'force-dynamic';

const FILTERS = ['waiting', 'active', 'delayed', 'failed', 'completed'] as const;
type Filter = (typeof FILTERS)[number];

const querySchema = z.object({
  status: z.enum(FILTERS).default('failed'),
});

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

interface JobRow {
  id: string;
  name: string;
  to: string;
  attempts: number;
  failedReason: string | null;
  timestamp: number;
  delayUntil: number | null;
}

async function loadQueueState(filter: Filter): Promise<
  | { kind: 'no-redis' }
  | { kind: 'error'; error: string }
  | {
      kind: 'ok';
      counts: Record<Filter, number>;
      jobs: JobRow[];
    }
> {
  const conn = getAdminRedis();
  if (!conn) return { kind: 'no-redis' };

  const queue = new Queue('email', { connection: conn });
  try {
    const [waiting, active, delayed, failed, completed, jobs] = await Promise.all([
      queue.getJobCountByTypes('waiting'),
      queue.getJobCountByTypes('active'),
      queue.getJobCountByTypes('delayed'),
      queue.getJobCountByTypes('failed'),
      queue.getJobCountByTypes('completed'),
      queue.getJobs([filter], 0, 49, false),
    ]);

    return {
      kind: 'ok',
      counts: { waiting, active, delayed, failed, completed },
      jobs: jobs.map((j) => {
        const data = j.data as { to?: string } | null;
        return {
          id: String(j.id ?? ''),
          name: j.name,
          to: data?.to ?? '—',
          attempts: j.attemptsMade,
          failedReason: j.failedReason ?? null,
          timestamp: j.timestamp,
          delayUntil: j.opts.delay ? j.timestamp + j.opts.delay : null,
        };
      }),
    };
  } catch (err) {
    return { kind: 'error', error: (err as Error).message };
  }
}

export default async function AdminEmailQueuePage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const { status } = querySchema.parse({ status: sp.status });

  const state = await loadQueueState(status);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Email queue</h2>
        <p className="mt-1 text-sm text-[var(--color-fg-mute)]">
          BullMQ очередь <code className="font-mono text-xs">email</code>. Отказы сами
          ретраятся 5 раз с экспоненциальной задержкой.
        </p>
      </header>

      {state.kind === 'no-redis' && (
        <NoticeCard
          title="REDIS_URL не задан"
          body="Очередь недоступна — установите REDIS_URL в .env, чтобы видеть jobs."
        />
      )}
      {state.kind === 'error' && (
        <NoticeCard title="Не получилось подключиться к Redis" body={state.error} tone="danger" />
      )}

      {state.kind === 'ok' && (
        <>
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {(Object.keys(state.counts) as Filter[]).map((k) => (
              <StatCard key={k} label={k} value={state.counts[k]} />
            ))}
          </section>

          <nav className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <a
                key={f}
                href={`/admin/email-queue?status=${f}`}
                className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                  status === f
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)]'
                    : 'border-[var(--color-bg-grid)] text-[var(--color-fg-mute)] hover:border-[var(--color-fg-mute)]'
                }`}
              >
                {f}
              </a>
            ))}
          </nav>

          {state.jobs.length === 0 ? (
            <EmptyState>В этой группе ничего нет.</EmptyState>
          ) : (
            <Table>
              <THead>
                <tr>
                  <Th>Job ID</Th>
                  <Th>Type</Th>
                  <Th>To</Th>
                  <Th>Attempts</Th>
                  <Th>Created</Th>
                  <Th>Reason</Th>
                  <Th />
                </tr>
              </THead>
              <TBody>
                {state.jobs.map((j) => (
                  <Tr key={j.id}>
                    <Td className="font-mono text-xs">{j.id}</Td>
                    <Td>
                      <StatusPill tone="neutral">{j.name}</StatusPill>
                    </Td>
                    <Td className="font-mono text-xs">{j.to}</Td>
                    <Td className="tabular-nums text-xs">{j.attempts}</Td>
                    <Td className="text-xs text-[var(--color-fg-mute)]">
                      {new Date(j.timestamp).toISOString().slice(0, 19).replace('T', ' ')}
                    </Td>
                    <Td className="max-w-[28ch] truncate text-xs text-[var(--color-fg-mute)]">
                      {j.failedReason ?? '—'}
                    </Td>
                    <Td className="text-right">
                      <div className="flex justify-end gap-2">
                        {(status === 'failed' || status === 'delayed') && (
                          <form action={retryEmailJobAction}>
                            <input type="hidden" name="id" value={j.id} />
                            <button
                              type="submit"
                              className="text-xs text-[var(--color-accent)] hover:underline"
                            >
                              Retry
                            </button>
                          </form>
                        )}
                        <form action={removeEmailJobAction}>
                          <input type="hidden" name="id" value={j.id} />
                          <button
                            type="submit"
                            className="text-xs text-[var(--color-danger)] hover:underline"
                          >
                            Remove
                          </button>
                        </form>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          )}
        </>
      )}
    </div>
  );
}

function NoticeCard({
  title,
  body,
  tone = 'warning',
}: {
  title: string;
  body: string;
  tone?: 'warning' | 'danger';
}) {
  const styles =
    tone === 'danger'
      ? 'border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 text-[var(--color-danger)]'
      : 'border-amber-500/30 bg-amber-500/5 text-amber-700';
  return (
    <div className={`flex items-start gap-3 rounded-xl border p-5 ${styles}`}>
      <AlertTriangle className="size-5 shrink-0" />
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <p className="mt-1 text-xs">{body}</p>
      </div>
    </div>
  );
}
