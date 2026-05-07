import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export const metadata = { title: 'Reset your password' };

export default function ForgotPage() {
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Reset your password</h1>
      <p className="mt-2 text-sm text-[var(--color-fg-mute)]">
        We&rsquo;ll send a password reset link if an account exists for that email.
      </p>
      <div className="mt-8">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
