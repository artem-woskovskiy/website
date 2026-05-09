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
import { revokeApiKeyAction } from './actions';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 30;
const FILTERS = ['ALL', 'ACTIVE', 'REVOKED'] as const;

const querySchema = z.object({
  filter: z.enum(FILTERS).default('ALL'),
  q: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).max(10000).default(1),
});

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminApiKeysPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const { filter, q, page } = querySchema.parse({
    filter: typeof sp.filter === 'string' ? sp.filter : 'ALL',
    q: typeof sp.q === 'string' ? sp.q : undefined,
    page: typeof sp.page === 'string' ? sp.page : 1,
  });

  const where: Prisma.ApiKeyWhereInput = {};
  if (filter === 'ACTIVE') where.revokedAt = null;
  if (filter === 'REVOKED') where.revokedAt = { not: null };
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { keyPrefix: { contains: q, mode: 'insensitive' } },
      { user: { email: { contains: q, mode: 'insensitive' } } },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.apiKey.count({ where }),
    prisma.apiKey.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { id: true, email: true } } },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">API keys</h2>
          <p className="mt-1 text-sm text-[var(--color-fg-mute)]">
            {total.toLocaleString('ru-RU')} ключей · фильтр: {filter}
          </p>
        </div>
        <form className="flex items-center gap-2">
          {filter !== 'ALL' && <input type="hidden" name="filter" value={filter} />}
          <input
            type="search"
            name="q"
            defaultValue={q ?? ''}
            placeholder="email, name, prefix"
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
            href={f === 'ALL' ? '/admin/api-keys' : `/admin/api-keys?filter=${f}`}
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
        <EmptyState>Ключей не найдено.</EmptyState>
      ) : (
        <Table>
          <THead>
            <tr>
              <Th>Name</Th>
              <Th>User</Th>
              <Th>Prefix</Th>
              <Th>Scopes</Th>
              <Th>Last used</Th>
              <Th>Created</Th>
              <Th>Status</Th>
              <Th />
            </tr>
          </THead>
          <TBody>
            {rows.map((k) => (
              <Tr key={k.id}>
                <Td className="font-medium">{k.name}</Td>
                <Td>
                  <Link
                    href={`/admin/users/${k.user.id}`}
                    className="font-mono text-xs hover:underline"
                  >
                    {k.user.email}
                  </Link>
                </Td>
                <Td className="font-mono text-xs">{k.keyPrefix}…</Td>
                <Td className="text-xs text-[var(--color-fg-mute)]">
                  {k.scopes.length ? k.scopes.join(', ') : '—'}
                </Td>
                <Td className="text-xs text-[var(--color-fg-mute)]">
                  {k.lastUsedAt ? k.lastUsedAt.toISOString().slice(0, 10) : '—'}
                </Td>
                <Td className="text-xs text-[var(--color-fg-mute)]">
                  {k.createdAt.toISOString().slice(0, 10)}
                </Td>
                <Td>
                  <StatusPill tone={k.revokedAt ? 'danger' : 'success'}>
                    {k.revokedAt ? 'revoked' : 'active'}
                  </StatusPill>
                </Td>
                <Td className="text-right">
                  {!k.revokedAt && (
                    <form action={revokeApiKeyAction}>
                      <input type="hidden" name="id" value={k.id} />
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
            ))}
          </TBody>
        </Table>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-[var(--color-fg-mute)]">
          <span>
            Страница {page} из {totalPages}
          </span>
        </div>
      )}
    </div>
  );
}
