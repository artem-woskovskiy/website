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
import { revokeSessionAction } from './actions';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 30;
const FILTERS = ['ALL', 'LIVE', 'EXPIRED', 'REVOKED'] as const;

const querySchema = z.object({
  filter: z.enum(FILTERS).default('LIVE'),
  q: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).max(10000).default(1),
});

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminSessionsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const { filter, q, page } = querySchema.parse({
    filter: typeof sp.filter === 'string' ? sp.filter : 'LIVE',
    q: typeof sp.q === 'string' ? sp.q : undefined,
    page: typeof sp.page === 'string' ? sp.page : 1,
  });

  const now = new Date();
  const where: Prisma.SessionWhereInput = {};
  if (filter === 'LIVE') {
    where.revokedAt = null;
    where.expiresAt = { gt: now };
  } else if (filter === 'EXPIRED') {
    where.revokedAt = null;
    where.expiresAt = { lte: now };
  } else if (filter === 'REVOKED') {
    where.revokedAt = { not: null };
  }
  if (q) {
    where.OR = [
      { ip: { contains: q, mode: 'insensitive' } },
      { userAgent: { contains: q, mode: 'insensitive' } },
      { user: { email: { contains: q, mode: 'insensitive' } } },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.session.count({ where }),
    prisma.session.findMany({
      where,
      orderBy: { lastSeenAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { id: true, email: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Sessions</h2>
          <p className="mt-1 text-sm text-[var(--color-fg-mute)]">
            {total.toLocaleString('ru-RU')} рефреш-сессий · фильтр: {filter}
          </p>
        </div>
        <form className="flex items-center gap-2">
          {filter !== 'ALL' && <input type="hidden" name="filter" value={filter} />}
          <input
            type="search"
            name="q"
            defaultValue={q ?? ''}
            placeholder="email, ip, user-agent"
            className="h-9 w-64 max-w-[80vw] rounded-md border border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)] px-3 text-sm outline-none transition-colors focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
          />
          <button
            type="submit"
            className="h-9 rounded-md border border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)] px-3 text-sm"
          >
            Найти
          </button>
        </form>
      </header>

      <nav className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={`/admin/sessions?filter=${f}`}
            className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
              filter === f
                ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)]'
                : 'border-[var(--color-bg-grid)] text-[var(--color-fg-mute)] hover:border-[var(--color-fg-mute)]'
            }`}
          >
            {f}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <EmptyState>Сессий не найдено.</EmptyState>
      ) : (
        <Table>
          <THead>
            <tr>
              <Th>User</Th>
              <Th>IP</Th>
              <Th>User-Agent</Th>
              <Th>Last seen</Th>
              <Th>Expires</Th>
              <Th>Status</Th>
              <Th />
            </tr>
          </THead>
          <TBody>
            {rows.map((s) => {
              const live = !s.revokedAt && s.expiresAt > now;
              const expired = !s.revokedAt && s.expiresAt <= now;
              return (
                <Tr key={s.id}>
                  <Td>
                    <Link
                      href={`/admin/users/${s.user.id}`}
                      className="font-mono text-xs hover:underline"
                    >
                      {s.user.email}
                    </Link>
                  </Td>
                  <Td className="font-mono text-xs">{s.ip ?? '—'}</Td>
                  <Td className="max-w-[28ch] truncate text-xs text-[var(--color-fg-mute)]">
                    {s.userAgent ?? '—'}
                  </Td>
                  <Td className="text-xs text-[var(--color-fg-mute)]">
                    {s.lastSeenAt.toISOString().slice(0, 19).replace('T', ' ')}
                  </Td>
                  <Td className="text-xs text-[var(--color-fg-mute)]">
                    {s.expiresAt.toISOString().slice(0, 10)}
                  </Td>
                  <Td>
                    <StatusPill
                      tone={s.revokedAt ? 'danger' : expired ? 'warning' : 'success'}
                    >
                      {s.revokedAt ? 'revoked' : expired ? 'expired' : 'live'}
                    </StatusPill>
                  </Td>
                  <Td className="text-right">
                    {live && (
                      <form action={revokeSessionAction}>
                        <input type="hidden" name="id" value={s.id} />
                        <button
                          type="submit"
                          className="text-xs text-[var(--color-danger)] hover:underline"
                        >
                          Отозвать
                        </button>
                      </form>
                    )}
                  </Td>
                </Tr>
              );
            })}
          </TBody>
        </Table>
      )}
    </div>
  );
}
