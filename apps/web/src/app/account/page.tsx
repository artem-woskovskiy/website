import { ProfileForm } from '@/components/account/profile-form';
import { SignOutButton } from '@/components/account/sign-out-button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

export default async function AccountPage() {
  const { data: profile } = await serverFetch<ProfileResponse>('/users/me');
  if (!profile) return null;

  const sub = profile.subscriptions?.[0];
  const planLabel = sub ? `${sub.plan.name} · ${sub.status}` : 'Hobby';

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Account</h1>
          <p className="mt-1 text-sm text-[var(--color-fg-mute)]">Profile and current session.</p>
        </div>
        <span className="rounded-full bg-[var(--color-accent)] px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.1em] text-[#1c150c]">
          {planLabel}
        </span>
      </div>

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

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Session</CardTitle>
            <CardDescription>Sign out of this browser session.</CardDescription>
          </div>
        </CardHeader>
        <SignOutButton />
      </Card>
    </div>
  );
}
