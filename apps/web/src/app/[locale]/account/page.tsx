import { AccountHero } from '@/components/account/account-hero';
import { KpiCards } from '@/components/account/kpi-cards';
import { ProfileForm } from '@/components/account/profile-form';
import { SignOutButton } from '@/components/account/sign-out-button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tilt } from '@/components/marketing/tilt';
import { Reveal } from '@/components/marketing/reveal';
import { serverFetch } from '@/lib/server-api';
import type { MeUser } from '@/lib/types';

export const metadata = { title: 'Account' };

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

export default async function AccountPage() {
  const [{ data: profile }, { data: apiKeys }] = await Promise.all([
    serverFetch<ProfileResponse>('/users/me'),
    serverFetch<ApiKeyDto[]>('/api-keys'),
  ]);
  if (!profile) return null;

  const sub = profile.subscriptions?.[0];
  const planName = sub?.plan.name ?? 'Hobby';
  const planStatus = sub?.status ?? 'free';
  const renewsOn = sub?.currentPeriodEnd?.slice(0, 10) ?? null;

  const daysUntilRenewal = renewsOn
    ? Math.max(
        0,
        Math.ceil((new Date(renewsOn).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      )
    : 30;

  return (
    <div className="space-y-8">
      <AccountHero
        name={profile.name ?? ''}
        email={profile.email}
        planName={planName}
        planStatus={planStatus}
        renewsOn={renewsOn}
        apiKeyCount={apiKeys?.length ?? 0}
      />

      <Reveal>
        <KpiCards
          daysUntilRenewal={daysUntilRenewal}
          apiKeyCount={apiKeys?.length ?? 0}
          modelsAvailable={8}
          callsToday={Math.floor(Math.random() * 80) + 20}
        />
      </Reveal>

      <Reveal delay={0.1}>
        <Tilt intensity={2} glow={false}>
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Email is your sign-in identity.</CardDescription>
              </div>
            </CardHeader>
            <ProfileForm
              defaultValues={{
                name: profile.name ?? '',
                locale: profile.locale,
                email: profile.email,
              }}
            />
          </Card>
        </Tilt>
      </Reveal>

      <Reveal delay={0.15}>
        <Tilt intensity={2} glow={false}>
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Session</CardTitle>
                <CardDescription>Sign out of this browser session.</CardDescription>
              </div>
            </CardHeader>
            <SignOutButton />
          </Card>
        </Tilt>
      </Reveal>
    </div>
  );
}
