'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link, useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { zodResolver } from '@hookform/resolvers/zod';
import { type SignUpInput, signUpSchema } from '@sepaito/shared';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

export function SignUpForm() {
  const router = useRouter();
  const search = useSearchParams();
  const t = useTranslations('auth.signUp');
  const tc = useTranslations('common');
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '', name: '', acceptTerms: false as never },
  });

  const onSubmit = async (data: SignUpInput) => {
    setServerError(null);
    try {
      await api.post('/auth/sign-up', data);
      const next = search.get('next') ?? '/account';
      router.push(next);
      router.refresh();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : tc('error'));
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <Field label={t('nameLabel')} error={errors.name?.message}>
        <Input placeholder="Adam" {...register('name')} />
      </Field>
      <Field label={t('emailLabel')} error={errors.email?.message}>
        <Input
          type="email"
          autoComplete="email"
          placeholder="you@sepaito.ai"
          {...register('email')}
        />
      </Field>
      <Field label={t('passwordLabel')} error={errors.password?.message}>
        <Input
          type="password"
          autoComplete="new-password"
          placeholder={t('passwordHint')}
          {...register('password')}
        />
      </Field>
      <label className="flex items-start gap-3 text-xs text-[var(--color-fg-mute)]">
        <input
          type="checkbox"
          className="mt-0.5 size-4 accent-[var(--color-accent)]"
          {...register('acceptTerms')}
        />
        <span>
          {t('agreePrefix')}{' '}
          <Link href="/legal/terms" className="underline">
            {t('terms')}
          </Link>{' '}
          {t('and')}{' '}
          <Link href="/legal/privacy" className="underline">
            {t('privacy')}
          </Link>
          .
        </span>
      </label>
      {errors.acceptTerms && (
        <div className="text-xs text-[var(--color-danger)]">{errors.acceptTerms.message}</div>
      )}
      {serverError && <div className="text-sm text-[var(--color-danger)]">{serverError}</div>}
      <Button type="submit" className="h-11 w-full" disabled={isSubmitting}>
        {isSubmitting ? t('signingUp') : t('submit')}
      </Button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <div className="text-xs text-[var(--color-danger)]">{error}</div>}
    </div>
  );
}
