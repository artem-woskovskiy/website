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

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

const querySchema = z.object({
  q: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).max(10000).default(1),
});

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const { q, page } = querySchema.parse({
    q: typeof sp.q === 'string' ? sp.q : undefined,
    page: typeof sp.page === 'string' ? sp.page : 1,
  });

  const where: Prisma.UserWhereInput = q
    ? {
        OR: [
          { email: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } },
        ],
      }
    : {};

  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        emailVerifiedAt: true,
        subscriptions: {
          where: { status: { in: ['ACTIVE', 'TRIALING'] } },
          select: { status: true, plan: { select: { code: true } } },
          take: 1,
        },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Users</h2>
          <p className="mt-1 text-sm text-[var(--color-fg-mute)]">
            {total.toLocaleString('ru-RU')} зарегистрированных аккаунтов
          </p>
        </div>
        <form className="flex items-center gap-2">
          <input
            type="search"
            name="q"
            defaultValue={q ?? ''}
            placeholder="Поиск по email или имени"
            className="h-9 w-64 max-w-[80vw] rounded-md border border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)] px-3 text-sm outline-none transition-colors focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
          />
          <button
            type="submit"
            className="h-9 rounded-md border border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)] px-3 text-sm transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            Найти
          </button>
        </form>
      </header>

      {rows.length === 0 ? (
        <EmptyState>Пользователи не найдены.</EmptyState>
      ) : (
        <Table>
          <THead>
            <tr>
              <Th>Email</Th>
              <Th>Name</Th>
              <Th>Role</Th>
              <Th>Plan</Th>
              <Th>Verified</Th>
              <Th>Joined</Th>
              <Th />
            </tr>
          </THead>
          <TBody>
            {rows.map((u) => {
              const sub = u.subscriptions[0];
              return (
                <Tr key={u.id}>
                  <Td className="font-mono text-xs">{u.email}</Td>
                  <Td>{u.name ?? '—'}</Td>
                  <Td>
                    <StatusPill tone={u.role === 'ADMIN' ? 'accent' : 'neutral'}>
                      {u.role}
                    </StatusPill>
                  </Td>
                  <Td>
                    {sub ? (
                      <StatusPill
                        tone={sub.status === 'ACTIVE' ? 'success' : 'warning'}
                      >
                        {sub.plan.code} · {sub.status}
                      </StatusPill>
                    ) : (
                      <span className="text-[var(--color-fg-dim)]">—</span>
                    )}
                  </Td>
                  <Td>
                    {u.emailVerifiedAt ? (
                      <StatusPill tone="success">verified</StatusPill>
                    ) : (
                      <StatusPill tone="warning">pending</StatusPill>
                    )}
                  </Td>
                  <Td className="text-xs text-[var(--color-fg-mute)]">
                    {u.createdAt.toISOString().slice(0, 10)}
                  </Td>
                  <Td className="text-right">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="text-xs font-medium text-[var(--color-accent)] hover:underline"
                    >
                      Открыть →
                    </Link>
                  </Td>
                </Tr>
              );
            })}
          </TBody>
        </Table>
      )}

      <Pagination current={page} total={totalPages} q={q} />
    </div>
  );
}

function Pagination({
  current,
  total,
  q,
}: {
  current: number;
  total: number;
  q: string | undefined;
}) {
  if (total <= 1) return null;
  const prev = Math.max(1, current - 1);
  const next = Math.min(total, current + 1);
  const buildHref = (page: number) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (page !== 1) params.set('page', String(page));
    const qs = params.toString();
    return qs ? `/admin/users?${qs}` : '/admin/users';
  };
  return (
    <div className="flex items-center justify-between text-xs text-[var(--color-fg-mute)]">
      <span>
        Страница {current} из {total}
      </span>
      <div className="flex gap-2">
        <Link
          href={buildHref(prev)}
          className="rounded-md border border-[var(--color-bg-grid)] px-3 py-1.5 transition-colors hover:border-[var(--color-fg-mute)]"
        >
          ← Назад
        </Link>
        <Link
          href={buildHref(next)}
          className="rounded-md border border-[var(--color-bg-grid)] px-3 py-1.5 transition-colors hover:border-[var(--color-fg-mute)]"
        >
          Вперёд →
        </Link>
      </div>
    </div>
  );
}
