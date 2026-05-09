'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { zodResolver } from '@hookform/resolvers/zod';
import { type SignInInput, signInSchema } from '@sepaito/shared';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

export function SignInForm() {
  const router = useRouter();
  const search = useSearchParams();
  const t = useTranslations('auth.signIn');
  const tc = useTranslations('common');
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: SignInInput) => {
    setServerError(null);
    try {
      await api.post('/auth/sign-in', data);
      const next = search.get('next') ?? '/account';
      window.location.href = next;
    } catch (err) {
      setServerError(err instanceof Error ? err.message : tc('error'));
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-1.5">
        <Label>{t('emailLabel')}</Label>
        <Input type="email" autoComplete="email" {...register('email')} />
        {errors.email && (
          <div className="text-xs text-[var(--color-danger)]">{errors.email.message}</div>
        )}
      </div>
      <div className="space-y-1.5">
        <Label>{t('passwordLabel')}</Label>
        <Input type="password" autoComplete="current-password" {...register('password')} />
        {errors.password && (
          <div className="text-xs text-[var(--color-danger)]">{errors.password.message}</div>
        )}
      </div>
      {serverError && <div className="text-sm text-[var(--color-danger)]">{serverError}</div>}
      <Button type="submit" className="h-11 w-full" disabled={isSubmitting}>
        {isSubmitting ? t('signingIn') : t('submit')}
      </Button>
    </form>
  );
}
