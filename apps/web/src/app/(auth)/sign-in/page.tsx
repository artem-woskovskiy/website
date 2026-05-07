import { SignInForm } from '@/components/auth/sign-in-form';
import { getCurrentUser } from '@/lib/auth-server';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Sign in' };

export default async function SignInPage() {
  const user = await getCurrentUser();
  if (user) redirect('/account');
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-2 text-sm text-[var(--color-fg-mute)]">Sign in to continue.</p>
      <div className="mt-8">
        <SignInForm />
      </div>
      <p className="mt-6 text-sm text-[var(--color-fg-mute)]">
        New here?{' '}
        <Link href="/sign-up" className="text-[var(--color-accent)] hover:underline">
          Create an account
        </Link>
      </p>
      <p className="mt-1 text-sm">
        <Link href="/forgot-password" className="text-[var(--color-fg-mute)] hover:underline">
          Forgot your password?
        </Link>
      </p>
    </div>
  );
}
