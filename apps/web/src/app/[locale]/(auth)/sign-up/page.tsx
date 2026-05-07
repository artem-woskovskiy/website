import { SignUpForm } from '@/components/auth/sign-up-form';
import { Link } from '@/i18n/navigation';
import { getCurrentUser } from '@/lib/auth-server';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export default async function SignUpPage({
  params,
}: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getCurrentUser();
  if (user) redirect('/account');
  const t = await getTranslations('auth.signUp');

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">{t('title')}</h1>
      <p className="mt-2 text-sm text-[var(--color-fg-mute)]">{t('subtitle')}</p>
      <div className="mt-8">
        <SignUpForm />
      </div>
      <p className="mt-6 text-sm text-[var(--color-fg-mute)]">
        {t('haveAccount')}{' '}
        <Link
          href="/sign-in"
          className="text-[var(--color-accent)] transition-colors hover:underline"
        >
          {t('signIn')}
        </Link>
      </p>
    </div>
  );
}
