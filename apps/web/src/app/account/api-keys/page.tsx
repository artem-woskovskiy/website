import { ApiKeysClient } from '@/components/account/api-keys-client';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { serverFetch } from '@/lib/server-api';

export const metadata = { title: 'Models & API' };

interface ApiKeyDto {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  createdAt: string;
}

export default async function ApiKeysPage() {
  const { data } = await serverFetch<ApiKeyDto[]>('/api-keys');
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Models &amp; API</h1>
        <p className="mt-1 text-sm text-[var(--color-fg-mute)]">
          Generate API keys for the desktop IDE. Each key authenticates one device.
        </p>
      </div>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Sepaito API keys</CardTitle>
            <CardDescription>Used by the desktop app to verify your subscription.</CardDescription>
          </div>
        </CardHeader>
        <ApiKeysClient initialKeys={data ?? []} />
      </Card>
    </div>
  );
}
