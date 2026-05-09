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
const STATUSES = ['ALL', 'PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED'] as const;

const querySchema = z.object({
  status: z.enum(STATUSES).default('ALL'),
  q: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).max(10000).default(1),
});

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminPaymentsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const { status, q, page } = querySchema.parse({
    status: typeof sp.status === 'string' ? sp.status : 'ALL',
    q: typeof sp.q === 'string' ? sp.q : undefined,
    page: typeof sp.page === 'string' ? sp.page : 1,
  });

  const where: Prisma.PaymentWhereInput = {};
  if (status !== 'ALL') where.status = status;
  if (q) {
    where.OR = [
      { invoiceId: { contains: q, mode: 'insensitive' } },
      { user: { email: { contains: q, mode: 'insensitive' } } },
      { description: { contains: q, mode: 'insensitive' } },
    ];
  }

  const [total, totals, rows] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.aggregate({
      _sum: { amountRub: true },
      where: { ...where, status: status === 'ALL' ? 'SUCCEEDED' : status },
    }),
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { id: true, email: true } } },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const buildHref = (overrides: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams();
    const merged = { status, q, page, ...overrides };
    if (merged.status && merged.status !== 'ALL') params.set('status', String(merged.status));
    if (merged.q) params.set('q', String(merged.q));
    if (merged.page && Number(merged.page) > 1) params.set('page', String(merged.page));
    const qs = params.toString();
    return qs ? `/admin/payments?${qs}` : '/admin/payments';
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Payments</h2>
          <p className="mt-1 text-sm text-[var(--color-fg-mute)]">
            {total.toLocaleString('ru-RU')} платежей · сумма ({status}):{' '}
            {((totals._sum.amountRub ?? 0) / 100).toLocaleString('ru-RU')} ₽
          </p>
        </div>
        <form className="flex items-center gap-2">
          {status !== 'ALL' && <input type="hidden" name="status" value={status} />}
          <input
            type="search"
            name="q"
            defaultValue={q ?? ''}
            placeholder="invoice, email, description"
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

      <nav className="flex flex-wrap gap-1.5">
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={buildHref({ status: s, page: 1 })}
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

      {rows.length === 0 ? (
        <EmptyState>Платежей не найдено.</EmptyState>
      ) : (
        <Table>
          <THead>
            <tr>
              <Th>Invoice</Th>
              <Th>User</Th>
              <Th>Description</Th>
              <Th>Amount</Th>
              <Th>Status</Th>
              <Th>Provider</Th>
              <Th>Paid at</Th>
            </tr>
          </THead>
          <TBody>
            {rows.map((p) => (
              <Tr key={p.id}>
                <Td className="font-mono text-xs">{p.invoiceId}</Td>
                <Td>
                  <Link
                    href={`/admin/users/${p.user.id}`}
                    className="font-mono text-xs hover:underline"
                  >
                    {p.user.email}
                  </Link>
                </Td>
                <Td className="max-w-[28ch] truncate text-xs text-[var(--color-fg-mute)]">
                  {p.description ?? '—'}
                </Td>
                <Td className="tabular-nums">
                  {(p.amountRub / 100).toLocaleString('ru-RU')} ₽
                </Td>
                <Td>
                  <StatusPill
                    tone={
                      p.status === 'SUCCEEDED'
                        ? 'success'
                        : p.status === 'PENDING'
                          ? 'warning'
                          : p.status === 'REFUNDED'
                            ? 'neutral'
                            : 'danger'
                    }
                  >
                    {p.status}
                  </StatusPill>
                </Td>
                <Td className="text-xs text-[var(--color-fg-mute)]">{p.provider}</Td>
                <Td className="text-xs text-[var(--color-fg-mute)]">
                  {p.paidAt ? p.paidAt.toISOString().slice(0, 19).replace('T', ' ') : '—'}
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
              href={buildHref({ page: Math.max(1, page - 1) })}
              className="rounded-md border border-[var(--color-bg-grid)] px-3 py-1.5"
            >
              ← Назад
            </Link>
            <Link
              href={buildHref({ page: Math.min(totalPages, page + 1) })}
              className="rounded-md border border-[var(--color-bg-grid)] px-3 py-1.5"
            >
              Вперёд →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
