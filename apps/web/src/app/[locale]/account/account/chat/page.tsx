import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = { title: 'Chat' };

export default function ChatPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold tracking-tight">Chat</h1>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>System prompts</CardTitle>
            <CardDescription>Defaults applied to new agents in the IDE.</CardDescription>
          </div>
        </CardHeader>
        <p className="text-sm text-[var(--color-fg-mute)]">Coming soon.</p>
      </Card>
    </div>
  );
}
