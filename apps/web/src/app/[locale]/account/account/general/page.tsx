import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = { title: 'General' };

export default function GeneralPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">General</h1>
        <p className="mt-1 text-sm text-[var(--color-fg-mute)]">
          Defaults the desktop app reads at startup.
        </p>
      </div>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Defaults</CardTitle>
            <CardDescription>
              These will be applied to new workspaces. Existing workspaces keep their own settings.
            </CardDescription>
          </div>
        </CardHeader>
        <p className="text-sm text-[var(--color-fg-mute)]">Coming soon.</p>
      </Card>
    </div>
  );
}
