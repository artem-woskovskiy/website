import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { serverFetch } from '@/lib/server-api';
import { CreditCard, Edit3, CheckCircle2, XCircle } from 'lucide-react';
import { PlanEditor } from '@/components/admin/plan-editor';

export const metadata = { title: 'Subscription Plans' };

interface Plan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  priceMonthlyRub: number;
  priceYearlyRub: number;
  features: string[];
  panesLimit: number;
  workspacesLimit: number;
  isActive: boolean;
}

export default async function AdminPlansPage() {
  const { data: plans } = await serverFetch<Plan[]>('/admin/plans');

  return (
    <div className="space-y-8">
      <header>
        <div className="flex items-center gap-2 text-[var(--color-accent)] font-mono text-[10px] uppercase tracking-[0.2em] mb-1">
          <CreditCard className="size-3" />
          Monetization
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Subscription Plans</h1>
        <p className="text-sm text-[var(--color-fg-mute)] mt-1">
          Configure tiers, pricing, and resource limits for your users.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {(plans ?? []).map((p) => (
          <Card key={p.id} className="relative overflow-hidden border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)]/30">
            <div className={`absolute top-0 right-0 px-3 py-1 text-[9px] font-bold uppercase tracking-wider ${
              p.isActive ? 'bg-[var(--color-success)] text-white' : 'bg-[var(--color-danger)] text-white'
            }`}>
              {p.isActive ? 'Active' : 'Inactive'}
            </div>
            
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{p.name}</CardTitle>
                  <p className="text-xs font-mono text-[var(--color-fg-dim)] mt-1">{p.code}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{(p.priceMonthlyRub / 100).toFixed(0)} ₽<span className="text-xs font-normal text-[var(--color-fg-mute)]">/mo</span></p>
                  <p className="text-[10px] text-[var(--color-fg-dim)]">{(p.priceYearlyRub / 100).toFixed(0)} ₽/year</p>
                </div>
              </div>
            </CardHeader>

            <div className="px-6 pb-6 space-y-4">
              <p className="text-sm text-[var(--color-fg-mute)] line-clamp-2 min-h-[40px]">
                {p.description ?? 'No description provided.'}
              </p>

              <div className="grid grid-cols-2 gap-4 py-4 border-y border-[var(--color-bg-grid)]">
                <div>
                  <p className="text-[10px] uppercase text-[var(--color-fg-dim)]">Panes Limit</p>
                  <p className="text-lg font-semibold">{p.panesLimit === -1 ? '∞' : p.panesLimit}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-[var(--color-fg-dim)]">Workspaces</p>
                  <p className="text-lg font-semibold">{p.workspacesLimit === -1 ? '∞' : p.workspacesLimit}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] uppercase text-[var(--color-fg-dim)]">Features</p>
                <div className="flex flex-wrap gap-2">
                  {p.features.map((f, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-[var(--color-bg-grid)] text-[10px] font-medium text-[var(--color-fg-mute)]">
                      {f}
                    </span>
                  ))}
                  {p.features.length === 0 && <span className="text-xs italic text-[var(--color-fg-dim)]">No special features.</span>}
                </div>
              </div>

              <div className="pt-4">
                <PlanEditor plan={p} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
