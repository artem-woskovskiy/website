import { ThemesStrip } from '@/components/marketing/themes-strip';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = { title: 'Appearance' };

export default function AppearancePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Appearance</h1>
        <p className="mt-1 text-sm text-[var(--color-fg-mute)]">
          Pick the theme that ships as your IDE default.
        </p>
      </div>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Themes</CardTitle>
            <CardDescription>15 themes ship with Sepaito. Selection coming soon.</CardDescription>
          </div>
        </CardHeader>
        <ThemesStrip />
      </Card>
    </div>
  );
}
