import { SignInForm } from '@/components/auth/sign-in-form';
import { Link } from '@/i18n/navigation';
import { getCurrentUser } from '@/lib/auth-server';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export default async function SignInPage({
  params,
}: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getCurrentUser();
  if (user) redirect('/account');
  const t = await getTranslations('auth.signIn');

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">{t('title')}</h1>
      <p className="mt-2 text-sm text-[var(--color-fg-mute)]">{t('subtitle')}</p>
      <div className="mt-8">
        <SignInForm />
      </div>
      <p className="mt-6 text-sm text-[var(--color-fg-mute)]">
        {t('noAccount')}{' '}
        <Link
          href="/sign-up"
          className="text-[var(--color-accent)] transition-colors hover:underline"
        >
          {t('signUp')}
        </Link>
      </p>
      <p className="mt-1 text-sm">
        <Link
          href="/forgot-password"
          className="text-[var(--color-fg-mute)] transition-colors hover:underline"
        >
          {t('forgot')}
        </Link>
      </p>
    </div>
  );
}
