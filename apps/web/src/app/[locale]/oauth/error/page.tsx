import { AlertCircle } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/config';

export const metadata = { title: 'Authorization error' };

const KNOWN_REASONS = [
  'invalid_request',
  'invalid_client',
  'invalid_redirect_uri',
  'invalid_scope',
  'email_not_verified',
  'login_required',
  'server_error',
] as const;
type Reason = (typeof KNOWN_REASONS)[number];

export default async function OAuthErrorPage(props: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ reason?: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const { reason } = await props.searchParams;
  const t = await getTranslations('oauth.error');

  const safe: Reason = (KNOWN_REASONS as readonly string[]).includes(reason ?? '')
    ? (reason as Reason)
    : 'server_error';

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-80px)] w-full max-w-md items-center justify-center px-4 py-12">
      <div className="w-full overflow-hidden rounded-2xl border border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)] p-8 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-xl bg-[var(--color-danger)]/15 text-[var(--color-danger)]">
          <AlertCircle className="size-6" />
        </div>
        <h1 className="mt-4 text-xl font-semibold tracking-tight">{t(`${safe}.title`)}</h1>
        <p className="mt-2 text-sm text-[var(--color-fg-mute)]">{t(`${safe}.body`)}</p>
        <div className="mt-6 flex flex-col gap-2">
          <Link
            href="/account"
            className="rounded-md border border-[var(--color-bg-grid)] px-4 py-2 text-sm hover:border-[var(--color-accent)]"
          >
            {t('backToAccount')}
          </Link>
        </div>
      </div>
    </main>
  );
}
