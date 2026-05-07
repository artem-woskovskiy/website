import { SiteFooter } from '@/components/marketing/site-footer';
import { SiteHeader } from '@/components/marketing/site-header';
import { getCurrentUser } from '@/lib/auth-server';

export const metadata = { title: 'Terms of Service' };

export default async function TermsPage() {
  const user = await getCurrentUser();
  return (
    <>
      <SiteHeader user={user} />
      <main className="mx-auto max-w-3xl px-6 py-24 md:px-10">
        <h1 className="text-4xl font-semibold tracking-tight">Terms of Service</h1>
        <div className="prose prose-invert mt-8 space-y-6 text-[var(--color-fg-mute)]">
          <p>
            These terms govern your use of Sepaito.ai. By creating an account you agree to use the
            service in accordance with these terms.
          </p>
          <h2 className="text-xl font-medium text-[var(--color-fg)]">Accounts</h2>
          <p>
            You are responsible for keeping your password and API keys safe. We will never ask for
            them via email or chat.
          </p>
          <h2 className="text-xl font-medium text-[var(--color-fg)]">Subscriptions</h2>
          <p>
            Paid plans are billed in advance via Robokassa. You can cancel at any time and your
            access continues until the end of the paid period.
          </p>
          <h2 className="text-xl font-medium text-[var(--color-fg)]">Acceptable use</h2>
          <p>
            Don&rsquo;t use Sepaito to harm others, infringe IP, or violate the terms of any model
            provider you connect.
          </p>
          <p className="text-xs">Last updated: today.</p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
