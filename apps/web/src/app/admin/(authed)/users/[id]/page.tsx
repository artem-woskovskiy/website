import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { StatusPill } from '../../../_components/data-table';
import { UserEditForm } from './edit-form';
import { revokeAllSessionsAction } from './actions';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminUserPage({ params }: PageProps) {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      subscriptions: { include: { plan: true }, orderBy: { createdAt: 'desc' } },
      apiKeys: { orderBy: { createdAt: 'desc' } },
      sessions: { orderBy: { lastSeenAt: 'desc' }, take: 10 },
      payments: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  });
  if (!user) notFound();

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href="/admin/users"
            className="text-xs text-[var(--color-fg-mute)] hover:text-[var(--color-fg)]"
          >
            ← Все пользователи
          </Link>
          <h2 className="mt-1 truncate text-2xl font-semibold tracking-tight md:text-3xl">
            {user.email}
          </h2>
          <p className="mt-1 text-sm text-[var(--color-fg-mute)]">
            id: <span className="font-mono">{user.id}</span> · joined{' '}
            {user.createdAt.toISOString().slice(0, 10)}
          </p>
        </div>
        <div className="flex gap-2">
          <StatusPill tone={user.role === 'ADMIN' ? 'accent' : 'neutral'}>
            {user.role}
          </StatusPill>
          <StatusPill tone={user.emailVerifiedAt ? 'success' : 'warning'}>
            {user.emailVerifiedAt ? 'verified' : 'unverified'}
          </StatusPill>
        </div>
      </header>

      <section className="grid gap-3 md:grid-cols-2">
        <UserEditForm
          id={user.id}
          email={user.email}
          name={user.name ?? ''}
          role={user.role}
          emailVerified={!!user.emailVerifiedAt}
        />

        <div className="rounded-xl border border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)] p-5">
          <h3 className="text-sm font-semibold">Опасная зона</h3>
          <p className="mt-1 text-xs text-[var(--color-fg-mute)]">
            Принудительный выход со всех устройств — отзывает все рефреш-токены.
          </p>
          <form action={revokeAllSessionsAction} className="mt-4">
            <input type="hidden" name="id" value={user.id} />
            <button
              type="submit"
              className="inline-flex h-9 items-center rounded-md border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 px-3 text-xs font-medium text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger)]/10"
            >
              Завершить все сессии
            </button>
          </form>
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <Block title="Подписки" empty="Подписок нет.">
          {user.subscriptions.length > 0 && (
            <ul className="divide-y divide-[var(--color-bg-grid)] text-sm">
              {user.subscriptions.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <div className="font-medium">{s.plan.name}</div>
                    <div className="text-xs text-[var(--color-fg-mute)]">
                      {s.interval} · {s.currentPeriodStart?.toISOString().slice(0, 10) ?? '—'} →{' '}
                      {s.currentPeriodEnd?.toISOString().slice(0, 10) ?? '—'}
                    </div>
                  </div>
                  <StatusPill
                    tone={
                      s.status === 'ACTIVE'
                        ? 'success'
                        : s.status === 'TRIALING'
                          ? 'accent'
                          : s.status === 'PAST_DUE'
                            ? 'warning'
                            : 'neutral'
                    }
                  >
                    {s.status}
                  </StatusPill>
                </li>
              ))}
            </ul>
          )}
        </Block>
        <Block title="API ключи" empty="Ключей нет.">
          {user.apiKeys.length > 0 && (
            <ul className="divide-y divide-[var(--color-bg-grid)] text-sm">
              {user.apiKeys.map((k) => (
                <li key={k.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <div className="font-medium">{k.name}</div>
                    <div className="font-mono text-xs text-[var(--color-fg-mute)]">
                      {k.keyPrefix}…
                    </div>
                  </div>
                  <StatusPill tone={k.revokedAt ? 'danger' : 'success'}>
                    {k.revokedAt ? 'revoked' : 'active'}
                  </StatusPill>
                </li>
              ))}
            </ul>
          )}
        </Block>
        <Block title="Сессии (10 последних)" empty="Сессий нет.">
          {user.sessions.length > 0 && (
            <ul className="divide-y divide-[var(--color-bg-grid)] text-xs">
              {user.sessions.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2">
                  <div className="min-w-0 truncate">
                    <span className="font-mono">{s.ip ?? '—'}</span> ·{' '}
                    <span className="text-[var(--color-fg-mute)]">
                      {s.userAgent?.slice(0, 60) ?? '—'}
                    </span>
                  </div>
                  <StatusPill tone={s.revokedAt ? 'danger' : 'neutral'}>
                    {s.revokedAt ? 'revoked' : 'live'}
                  </StatusPill>
                </li>
              ))}
            </ul>
          )}
        </Block>
        <Block title="Платежи (10 последних)" empty="Платежей нет.">
          {user.payments.length > 0 && (
            <ul className="divide-y divide-[var(--color-bg-grid)] text-sm">
              {user.payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2.5">
                  <div className="min-w-0">
                    <div className="font-mono text-xs">{p.invoiceId}</div>
                    <div className="text-xs text-[var(--color-fg-mute)]">{p.description ?? '—'}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="tabular-nums">
                      {(p.amountRub / 100).toLocaleString('ru-RU')} ₽
                    </span>
                    <StatusPill
                      tone={
                        p.status === 'SUCCEEDED'
                          ? 'success'
                          : p.status === 'PENDING'
                            ? 'warning'
                            : 'danger'
                      }
                    >
                      {p.status}
                    </StatusPill>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Block>
      </section>
    </div>
  );
}

function Block({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  const isEmpty = !children || (Array.isArray(children) && children.length === 0);
  return (
    <div className="rounded-xl border border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)] p-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      {isEmpty ? (
        <p className="mt-3 text-xs text-[var(--color-fg-mute)]">{empty}</p>
      ) : (
        <div className="mt-3">{children}</div>
      )}
    </div>
  );
}
