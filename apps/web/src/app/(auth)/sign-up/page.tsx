import { SignUpForm } from '@/components/auth/sign-up-form';
import { getCurrentUser } from '@/lib/auth-server';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Sign up' };

export default async function SignUpPage() {
  const user = await getCurrentUser();
  if (user) redirect('/account');

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Create your account</h1>
      <p className="mt-2 text-sm text-[var(--color-fg-mute)]">
        Free forever on Hobby. Upgrade anytime.
      </p>
      <div className="mt-8">
        <SignUpForm />
      </div>
      <p className="mt-6 text-sm text-[var(--color-fg-mute)]">
        Already have an account?{' '}
        <Link href="/sign-in" className="text-[var(--color-accent)] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
