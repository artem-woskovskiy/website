import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { serverFetch } from '@/lib/server-api';
import { Users, CreditCard, Zap, ArrowUpRight, TrendingUp } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { GrowthChart } from '@/components/admin/growth-chart';

export const metadata = { title: 'Admin Overview' };

interface AdminStats {
  userCount: number;
  activeSubs: number;
  totalRevenueRub: number;
  recentPayments: Array<{
    id: string;
    amountRub: number;
    status: string;
    createdAt: string;
    user: { email: string; name: string | null };
  }>;
  chartData: Array<{ date: string; count: number }>;
}

export default async function AdminOverviewPage() {
  const { data: s } = await serverFetch<AdminStats>('/admin/stats');

  if (!s) return <p className="text-[var(--color-fg-mute)]">Failed to load system stats.</p>;

  return (
    <div className="space-y-8">
      <header>
        <div className="flex items-center gap-2 text-[var(--color-accent)] font-mono text-[10px] uppercase tracking-[0.2em] mb-1">
          <TrendingUp className="size-3" />
          Intelligence Dashboard
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
      </header>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          title="Total Users"
          value={s.userCount.toLocaleString()}
          icon={Users}
          trend="+12% from last month"
        />
        <StatCard
          title="Active Subscriptions"
          value={s.activeSubs.toLocaleString()}
          icon={Zap}
          trend="+5% from last month"
        />
        <StatCard
          title="Total Revenue"
          value={`${(s.totalRevenueRub / 100).toLocaleString()} ₽`}
          icon={CreditCard}
          trend="+18% from last month"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Growth Chart */}
        <Card className="lg:col-span-2 border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)]/30">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              User Growth (Last 30 Days)
              <span className="text-[10px] font-normal text-[var(--color-fg-dim)]">Daily Registrations</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <GrowthChart data={s.chartData} />
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)]/30">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Quick Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <QuickLink href="/admin/users" label="Review New Users" />
            <QuickLink href="/admin/payments" label="View Recent Sales" />
            <QuickLink href="/admin/plans" label="Adjust Pricing" />
            <QuickLink href="/admin/settings" label="System Config" />
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Table */}
      <Card className="border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)]/30">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Recent Transactions</CardTitle>
          <Link href="/admin/payments" className="text-xs text-[var(--color-accent)] hover:underline">
            View all →
          </Link>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] uppercase tracking-[0.15em] text-[var(--color-fg-dim)]">
              <tr className="border-b border-[var(--color-bg-grid)]">
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Amount</th>
                <th className="px-6 py-3 font-medium text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-bg-grid)]">
              {s.recentPayments.map((p) => (
                <tr key={p.id} className="hover:bg-[var(--color-bg-grid)]/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium">{p.user.name ?? 'Anonymous'}</span>
                      <span className="text-[10px] text-[var(--color-fg-dim)] font-mono">{p.user.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      p.status === 'SUCCEEDED' ? 'bg-[var(--color-success-soft)] text-[var(--color-success)]' : 'bg-[var(--color-bg-grid)] text-[var(--color-fg-dim)]'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-semibold">{(p.amountRub / 100).toFixed(2)} ₽</td>
                  <td className="px-6 py-4 text-right font-mono text-[11px] text-[var(--color-fg-mute)]">
                    {p.createdAt.slice(0, 10)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend }: { title: string; value: string; icon: any; trend: string }) {
  return (
    <Card className="border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)] p-6 group hover:border-[var(--color-accent-soft)] transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 rounded-lg bg-[var(--color-bg-grid)] group-hover:bg-[var(--color-accent-soft)] transition-colors">
          <Icon className="size-5 text-[var(--color-accent)]" />
        </div>
        <span className="text-[10px] font-mono text-[var(--color-success)]">{trend}</span>
      </div>
      <div>
        <p className="text-xs text-[var(--color-fg-dim)] uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold tracking-tight mt-1">{value}</p>
      </div>
    </Card>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between p-3 rounded-lg border border-[var(--color-bg-grid)] hover:border-[var(--color-accent-soft)] hover:bg-[var(--color-bg-grid)]/30 transition-all group"
    >
      <span className="text-xs font-medium text-[var(--color-fg-mute)] group-hover:text-[var(--color-fg)]">{label}</span>
      <ArrowUpRight className="size-3 text-[var(--color-fg-dim)] group-hover:text-[var(--color-accent)] transition-colors" />
    </Link>
  );
}
