import { SiteFooter } from '@/components/marketing/site-footer';
import { SiteHeader } from '@/components/marketing/site-header';
import { getCurrentUser } from '@/lib/auth-server';

export const metadata = { title: 'Privacy' };

export default async function PrivacyPage() {
  const user = await getCurrentUser();
  return (
    <>
      <SiteHeader user={user} />
      <main className="mx-auto max-w-3xl px-6 py-24 md:px-10">
        <h1 className="text-4xl font-semibold tracking-tight">Privacy</h1>
        <div className="prose prose-invert mt-8 space-y-6 text-[var(--color-fg-mute)]">
          <p>
            Sepaito is local-first. The desktop app does not send your prompts, code, or LLM API
            keys to our servers. Provider keys you store in the IDE are encrypted at rest on your
            machine.
          </p>
          <h2 className="text-xl font-medium text-[var(--color-fg)]">What we collect</h2>
          <ul className="list-disc pl-6">
            <li>Your account email and (optional) name.</li>
            <li>Subscription and payment metadata required to deliver the service.</li>
            <li>Device install IDs used to sync your subscription with the desktop app.</li>
          </ul>
          <h2 className="text-xl font-medium text-[var(--color-fg)]">Telemetry</h2>
          <p>
            Anonymous usage telemetry is off by default. You can opt in (and back out) from
            <span className="font-mono"> Settings → Notifications</span>.
          </p>
          <p className="text-xs">Last updated: today.</p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
