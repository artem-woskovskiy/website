import { prisma } from '@/lib/prisma';
import { CreditCard, Inbox, KeyRound, Sparkles, UserCheck, Users } from 'lucide-react';
import { StatCard } from '../_components/stat-card';
import { SparkLine } from '../_components/spark-line';

export const dynamic = 'force-dynamic';

const DAY_MS = 24 * 60 * 60 * 1000;

async function loadStats() {
  const now = Date.now();
  const sevenDaysAgo = new Date(now - 7 * DAY_MS);
  const thirtyDaysAgo = new Date(now - 30 * DAY_MS);

  const [
    totalUsers,
    verifiedUsers,
    activeSubs,
    totalPlans,
    totalApiKeys,
    revenueAgg,
    last7daysSignups,
    last7daysPayments,
    recentAudit,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { emailVerifiedAt: { not: null } } }),
    prisma.subscription.count({ where: { status: { in: ['ACTIVE', 'TRIALING'] } } }),
    prisma.plan.count({ where: { isActive: true } }),
    prisma.apiKey.count({ where: { revokedAt: null } }),
    prisma.payment.aggregate({
      _sum: { amountRub: true },
      where: { status: 'SUCCEEDED', paidAt: { gte: thirtyDaysAgo } },
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
      take: 1000,
    }),
    prisma.payment.findMany({
      where: { status: 'SUCCEEDED', paidAt: { gte: sevenDaysAgo } },
      select: { paidAt: true, amountRub: true },
      take: 1000,
    }),
    prisma.auditLog.findMany({
      take: 12,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        action: true,
        actorEmail: true,
        entityType: true,
        entityId: true,
        ip: true,
        createdAt: true,
      },
    }),
  ]);

  // Bucket signups + payments into 7-day series ending today.
  const dayBuckets = (count: number, getDate: (i: number) => Date | null | undefined) => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now - (6 - i) * DAY_MS);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    });
    const buckets = new Array(7).fill(0);
    for (let i = 0; i < count; i++) {
      const date = getDate(i);
      if (!date) continue;
      const t = date.getTime();
      const idx = days.findIndex((d) => t >= d && t < d + DAY_MS);
      if (idx >= 0) buckets[idx] += 1;
    }
    return buckets;
  };

  const signupSeries = dayBuckets(
    last7daysSignups.length,
    (i) => last7daysSignups[i]?.createdAt,
  );
  const paymentSeries = dayBuckets(
    last7daysPayments.length,
    (i) => last7daysPayments[i]?.paidAt,
  );

  return {
    totals: {
      users: totalUsers,
      verifiedUsers,
      activeSubs,
      activePlans: totalPlans,
      activeApiKeys: totalApiKeys,
      revenue30d: revenueAgg._sum.amountRub ?? 0,
    },
    series: { signupSeries, paymentSeries },
    recentAudit,
  };
}

export default async function AdminOverviewPage() {
  const data = await loadStats();
  const { totals, series, recentAudit } = data;

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Overview</h2>
        <p className="mt-1 text-sm text-[var(--color-fg-mute)]">
          Срез системы: пользователи, биллинг, активность.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Users"
          value={totals.users}
          hint={`${totals.verifiedUsers} verified`}
          iconName="users"
          delay={0.0}
        />
        <StatCard
          label="Active subs"
          value={totals.activeSubs}
          hint="ACTIVE + TRIALING"
          iconName="user-check"
          delay={0.05}
        />
        <StatCard
          label="Plans"
          value={totals.activePlans}
          hint="active"
          iconName="sparkles"
          delay={0.1}
        />
        <StatCard
          label="API keys"
          value={totals.activeApiKeys}
          hint="not revoked"
          iconName="key-round"
          delay={0.15}
        />
        <StatCard
          label="Revenue 30d"
          value={totals.revenue30d}
          format="currency-rub"
          hint="succeeded only"
          iconName="credit-card"
          delay={0.2}
        />
        <StatCard
          label="Audit (7d)"
          value={recentAudit.length}
          hint="recent operator actions"
          iconName="inbox"
          delay={0.25}
        />
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)] p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--color-fg-dim)]">
                Signups · 7d
              </div>
              <div className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                {series.signupSeries.reduce((a, b) => a + b, 0)}
              </div>
            </div>
            <span className="text-[11px] text-[var(--color-fg-dim)]">last 7 days</span>
          </div>
          <SparkLine data={series.signupSeries} className="mt-3" />
        </div>
        <div className="rounded-xl border border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)] p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--color-fg-dim)]">
                Payments · 7d
              </div>
              <div className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                {series.paymentSeries.reduce((a, b) => a + b, 0)}
              </div>
            </div>
            <span className="text-[11px] text-[var(--color-fg-dim)]">succeeded only</span>
          </div>
          <SparkLine data={series.paymentSeries} className="mt-3" />
        </div>
      </section>

      <section className="rounded-xl border border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)]">
        <div className="border-b border-[var(--color-bg-grid)] p-5">
          <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--color-fg-dim)]">
            Recent audit
          </div>
          <div className="mt-1 text-sm text-[var(--color-fg-mute)]">
            Последние действия и события безопасности.
          </div>
        </div>
        {recentAudit.length === 0 ? (
          <div className="p-5 text-sm text-[var(--color-fg-mute)]">Журнал пуст.</div>
        ) : (
          <ul className="divide-y divide-[var(--color-bg-grid)]">
            {recentAudit.map((row) => (
              <li
                key={row.id}
                className="flex flex-col gap-1 px-5 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="font-mono text-xs text-[var(--color-fg)]">{row.action}</span>
                  <span className="truncate text-xs text-[var(--color-fg-mute)]">
                    {row.entityType ?? '—'} · {row.entityId ?? '—'} · {row.actorEmail ?? '—'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[var(--color-fg-mute)]">
                  <span className="font-mono">{row.ip ?? '—'}</span>
                  <span>{row.createdAt.toISOString().slice(0, 19).replace('T', ' ')}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
