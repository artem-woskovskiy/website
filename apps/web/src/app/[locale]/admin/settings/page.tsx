import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { serverFetch } from '@/lib/server-api';
import { Settings, ShieldAlert, Globe, Zap } from 'lucide-react';
import { ConfigToggle } from '@/components/admin/config-toggle';

export const metadata = { title: 'System Settings' };

interface ConfigItem {
  key: string;
  value: string;
  description: string | null;
}

export default async function AdminSettingsPage() {
  const { data: config } = await serverFetch<ConfigItem[]>('/admin/config');
  
  const getConfig = (key: string) => config?.find(c => c.key === key)?.value;

  return (
    <div className="space-y-8">
      <header>
        <div className="flex items-center gap-2 text-[var(--color-accent)] font-mono text-[10px] uppercase tracking-[0.2em] mb-1">
          <Settings className="size-3" />
          Core Configuration
        </div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-sm text-[var(--color-fg-mute)] mt-1">
          Control global application behavior and maintenance flags.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Security & Access */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--color-fg-dim)] ml-1">
            <ShieldAlert className="size-3.5 text-[var(--color-danger)]" />
            Security & Access
          </div>
          
          <Card className="border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)]/30">
            <div className="p-6 space-y-6">
              <ConfigItemView
                title="Maintenance Mode"
                description="Disable the entire application for everyone except admins."
                configKey="maintenance_mode"
                currentValue={getConfig('maintenance_mode')}
              />
              <div className="h-px bg-[var(--color-bg-grid)]" />
              <ConfigItemView
                title="Public Registration"
                description="Allow new users to sign up for accounts."
                configKey="registration_enabled"
                currentValue={getConfig('registration_enabled') ?? 'true'}
              />
            </div>
          </Card>
        </section>

        {/* AI & Performance */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--color-fg-dim)] ml-1">
            <Zap className="size-3.5 text-[var(--color-accent)]" />
            AI & Performance
          </div>
          
          <Card className="border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)]/30">
            <div className="p-6 space-y-6">
              <ConfigItemView
                title="AI Playground"
                description="Enable the experimental AI playground for all users."
                configKey="ai_playground_enabled"
                currentValue={getConfig('ai_playground_enabled')}
              />
              <div className="h-px bg-[var(--color-bg-grid)]" />
              <ConfigItemView
                title="Advanced Analytics"
                description="Track detailed user behavior for product improvement."
                configKey="analytics_enabled"
                currentValue={getConfig('analytics_enabled')}
              />
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}

function ConfigItemView({ title, description, configKey, currentValue }: { title: string; description: string; configKey: string; currentValue?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-1">
        <h4 className="text-sm font-semibold">{title}</h4>
        <p className="text-xs text-[var(--color-fg-mute)] leading-relaxed">{description}</p>
      </div>
      <ConfigToggle configKey={configKey} initialValue={currentValue === 'true'} />
    </div>
  );
}
