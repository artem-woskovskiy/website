'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { zodResolver } from '@hookform/resolvers/zod';
import { type RequestPasswordResetInput, requestPasswordResetSchema } from '@sepaito/shared';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

export function ForgotPasswordForm() {
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RequestPasswordResetInput>({
    resolver: zodResolver(requestPasswordResetSchema),
    defaultValues: { email: '' },
  });

  if (done) {
    return (
      <div className="rounded-md border border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)] p-4 text-sm text-[var(--color-fg-mute)]">
        If an account exists for that email, a reset link is on its way.
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit(async (data) => {
        await api.post('/auth/forgot-password', data).catch(() => null);
        setDone(true);
      })}
    >
      <div className="space-y-1.5">
        <Label>Email</Label>
        <Input type="email" autoComplete="email" {...register('email')} />
        {errors.email && (
          <div className="text-xs text-[var(--color-danger)]">{errors.email.message}</div>
        )}
      </div>
      <Button type="submit" className="h-11 w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Sending…' : 'Send reset link'}
      </Button>
    </form>
  );
}
