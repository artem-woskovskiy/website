import { prisma } from '@/lib/prisma';
import type { Prisma } from '@sepaito/db';
import Link from 'next/link';
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
import { GrantForm } from './grant-form';
import { cancelSubscriptionAction } from './actions';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

const STATUSES = ['ALL', 'TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED'] as const;

const querySchema = z.object({
  status: z.enum(STATUSES).default('ALL'),
  page: z.coerce.number().int().min(1).max(10000).default(1),
});

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminSubscriptionsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const { status, page } = querySchema.parse({
    status: typeof sp.status === 'string' ? sp.status : 'ALL',
    page: typeof sp.page === 'string' ? sp.page : 1,
  });

  const where: Prisma.SubscriptionWhereInput =
    status === 'ALL' ? {} : { status };

  const [total, plans, rows] = await Promise.all([
    prisma.subscription.count({ where }),
    prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { priceMonthlyRub: 'asc' },
      select: { id: true, code: true, name: true },
    }),
    prisma.subscription.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        plan: { select: { name: true, code: true } },
        user: { select: { id: true, email: true } },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Subscriptions</h2>
          <p className="mt-1 text-sm text-[var(--color-fg-mute)]">
            {total.toLocaleString('ru-RU')} записей · фильтр: {status}
          </p>
        </div>
        <nav className="flex flex-wrap gap-1.5">
          {STATUSES.map((s) => (
            <Link
              key={s}
              href={s === 'ALL' ? '/admin/subscriptions' : `/admin/subscriptions?status=${s}`}
              className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                status === s
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)]'
                  : 'border-[var(--color-bg-grid)] text-[var(--color-fg-mute)] hover:border-[var(--color-fg-mute)]'
              }`}
            >
              {s}
            </Link>
          ))}
        </nav>
      </header>

      {rows.length === 0 ? (
        <EmptyState>Подписок нет.</EmptyState>
      ) : (
        <Table>
          <THead>
            <tr>
              <Th>User</Th>
              <Th>Plan</Th>
              <Th>Status</Th>
              <Th>Interval</Th>
              <Th>Period end</Th>
              <Th>Created</Th>
              <Th />
            </tr>
          </THead>
          <TBody>
            {rows.map((s) => (
              <Tr key={s.id}>
                <Td>
                  <Link
                    href={`/admin/users/${s.user.id}`}
                    className="font-mono text-xs text-[var(--color-fg)] hover:underline"
                  >
                    {s.user.email}
                  </Link>
                </Td>
                <Td>
                  <span className="font-medium">{s.plan.name}</span>{' '}
                  <span className="text-[var(--color-fg-dim)]">({s.plan.code})</span>
                </Td>
                <Td>
                  <StatusPill
                    tone={
                      s.status === 'ACTIVE'
                        ? 'success'
                        : s.status === 'TRIALING'
                          ? 'accent'
                          : s.status === 'PAST_DUE'
                            ? 'warning'
                            : s.status === 'CANCELED'
                              ? 'neutral'
                              : 'danger'
                    }
                  >
                    {s.status}
                  </StatusPill>
                </Td>
                <Td>{s.interval}</Td>
                <Td className="text-xs text-[var(--color-fg-mute)]">
                  {s.currentPeriodEnd?.toISOString().slice(0, 10) ?? '—'}
                </Td>
                <Td className="text-xs text-[var(--color-fg-mute)]">
                  {s.createdAt.toISOString().slice(0, 10)}
                </Td>
                <Td className="text-right">
                  {s.status !== 'CANCELED' && s.status !== 'EXPIRED' ? (
                    <form action={cancelSubscriptionAction}>
                      <input type="hidden" name="id" value={s.id} />
                      <button
                        type="submit"
                        className="text-xs text-[var(--color-danger)] hover:underline"
                      >
                        Отменить
                      </button>
                    </form>
                  ) : (
                    <span className="text-xs text-[var(--color-fg-dim)]">—</span>
                  )}
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-[var(--color-fg-mute)]">
          <span>
            Страница {page} из {totalPages}
          </span>
          <div className="flex gap-2">
            <Link
              href={
                status === 'ALL'
                  ? `/admin/subscriptions?page=${Math.max(1, page - 1)}`
                  : `/admin/subscriptions?status=${status}&page=${Math.max(1, page - 1)}`
              }
              className="rounded-md border border-[var(--color-bg-grid)] px-3 py-1.5"
            >
              ← Назад
            </Link>
            <Link
              href={
                status === 'ALL'
                  ? `/admin/subscriptions?page=${Math.min(totalPages, page + 1)}`
                  : `/admin/subscriptions?status=${status}&page=${Math.min(totalPages, page + 1)}`
              }
              className="rounded-md border border-[var(--color-bg-grid)] px-3 py-1.5"
            >
              Вперёд →
            </Link>
          </div>
        </div>
      )}

      <section className="rounded-xl border border-dashed border-[var(--color-bg-grid)] p-5">
        <h3 className="text-sm font-semibold">Выдать подписку вручную</h3>
        <p className="mt-1 text-xs text-[var(--color-fg-mute)]">
          Создаст ACTIVE-подписку с указанной длительностью.
        </p>
        <div className="mt-4">
          <GrantForm plans={plans} />
        </div>
      </section>
    </div>
  );
}
