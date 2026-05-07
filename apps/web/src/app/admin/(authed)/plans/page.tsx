import { prisma } from '@/lib/prisma';
import { StatusPill } from '../../_components/data-table';
import { PlanForm } from './plan-form';
import { togglePlanActiveAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function AdminPlansPage() {
  const plans = await prisma.plan.findMany({
    orderBy: [{ isActive: 'desc' }, { priceMonthlyRub: 'asc' }],
    include: { _count: { select: { subscriptions: true } } },
  });

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Plans</h2>
        <p className="mt-1 text-sm text-[var(--color-fg-mute)]">
          Тарифные планы. Цены — в рублях (целые числа).
        </p>
      </header>

      <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((p) => (
          <article
            key={p.id}
            className="flex flex-col rounded-xl border border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)] p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--color-fg-dim)]">
                  {p.code}
                </div>
                <div className="mt-1 text-lg font-semibold tracking-tight">{p.name}</div>
              </div>
              <StatusPill tone={p.isActive ? 'success' : 'neutral'}>
                {p.isActive ? 'active' : 'archived'}
              </StatusPill>
            </div>

            <p className="mt-2 line-clamp-3 text-sm text-[var(--color-fg-mute)]">
              {p.description ?? '—'}
            </p>

            <dl className="mt-4 space-y-1.5 text-xs text-[var(--color-fg-mute)]">
              <Row label="Месяц">
                {(p.priceMonthlyRub / 100).toLocaleString('ru-RU')} ₽
              </Row>
              <Row label="Год">{(p.priceYearlyRub / 100).toLocaleString('ru-RU')} ₽</Row>
              <Row label="Panes">{p.panesLimit}</Row>
              <Row label="Workspaces">{p.workspacesLimit}</Row>
              <Row label="Подписок">{p._count.subscriptions}</Row>
              <Row label="Фичей">{p.features.length}</Row>
            </dl>

            <details className="mt-4 group/edit">
              <summary className="cursor-pointer rounded-md border border-[var(--color-bg-grid)] px-3 py-1.5 text-center text-xs font-medium hover:border-[var(--color-fg-mute)]">
                Редактировать
              </summary>
              <div className="mt-3">
                <PlanForm plan={p} />
              </div>
            </details>

            <form action={togglePlanActiveAction} className="mt-2">
              <input type="hidden" name="id" value={p.id} />
              <button
                type="submit"
                className="w-full rounded-md border border-[var(--color-bg-grid)] px-3 py-1.5 text-xs text-[var(--color-fg-mute)] transition-colors hover:border-[var(--color-fg-mute)] hover:text-[var(--color-fg)]"
              >
                {p.isActive ? 'Архивировать' : 'Активировать'}
              </button>
            </form>
          </article>
        ))}
      </section>

      <section className="rounded-xl border border-dashed border-[var(--color-bg-grid)] p-5">
        <h3 className="text-sm font-semibold">Новый план</h3>
        <p className="mt-1 text-xs text-[var(--color-fg-mute)]">
          Уникальный <code>code</code> на каждый план. Подписки ссылаются по id, поэтому
          существующих не трогаем.
        </p>
        <div className="mt-4">
          <PlanForm plan={null} />
        </div>
      </section>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <dt>{label}</dt>
      <dd className="font-medium tabular-nums text-[var(--color-fg)]">{children}</dd>
    </div>
  );
}
