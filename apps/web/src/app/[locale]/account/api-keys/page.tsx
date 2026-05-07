import { AccountHero } from '@/components/account/account-hero';
import { ApiKeysClient } from '@/components/account/api-keys-client';
import { Reveal } from '@/components/marketing/reveal';
import { Tilt } from '@/components/marketing/tilt';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { serverFetch } from '@/lib/server-api';
import type { MeUser } from '@/lib/types';

export const metadata = { title: 'Models & API' };

interface ProfileResponse extends MeUser {
  subscriptions: Array<{
    plan: { name: string; code: string };
    status: string;
    currentPeriodEnd: string | null;
  }>;
}

interface ApiKeyDto {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  createdAt: string;
}

export default async function ApiKeysPage() {
  const [{ data: profile }, { data }] = await Promise.all([
    serverFetch<ProfileResponse>('/users/me'),
    serverFetch<ApiKeyDto[]>('/api-keys'),
  ]);

  const sub = profile?.subscriptions?.[0];

  return (
    <div className="space-y-8">
      {profile && (
        <AccountHero
          name={profile.name ?? ''}
          email={profile.email}
          planName={sub?.plan.name ?? 'Hobby'}
          planStatus={sub?.status ?? 'free'}
          renewsOn={sub?.currentPeriodEnd?.slice(0, 10) ?? null}
          apiKeyCount={data?.length ?? 0}
        />
      )}

      <Reveal delay={0.05}>
        <Tilt intensity={2} glow={false}>
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Sepaito API keys</CardTitle>
                <CardDescription>
                  Used by the desktop app to verify your subscription. Generate one key per device.
                </CardDescription>
              </div>
            </CardHeader>
            <ApiKeysClient initialKeys={data ?? []} />
          </Card>
        </Tilt>
      </Reveal>
    </div>
  );
}
