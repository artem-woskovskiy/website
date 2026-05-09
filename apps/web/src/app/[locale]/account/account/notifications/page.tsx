import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = { title: 'Notifications' };

export default function NotificationsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold tracking-tight">Notifications</h1>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Email</CardTitle>
            <CardDescription>Coming soon.</CardDescription>
          </div>
        </CardHeader>
        <p className="text-sm text-[var(--color-fg-mute)]">Toggles ship in the next release.</p>
      </Card>
    </div>
  );
}
