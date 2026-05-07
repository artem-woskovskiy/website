'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { zodResolver } from '@hookform/resolvers/zod';
import { type UpdateProfileInput, updateProfileSchema } from '@sepaito/shared';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

export function ProfileForm({
  defaultValues,
}: {
  defaultValues: { name: string; locale: 'EN' | 'RU'; email: string };
}) {
  const [saved, setSaved] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name: defaultValues.name, locale: defaultValues.locale },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit(async (data) => {
        await api.patch('/users/me', data);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      })}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input value={defaultValues.email} disabled />
        </div>
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input {...register('name')} />
          {errors.name && (
            <div className="text-xs text-[var(--color-danger)]">{errors.name.message}</div>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>Language</Label>
          <select
            {...register('locale')}
            className="h-10 w-full rounded-md border border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)] px-3 text-sm"
          >
            <option value="EN">English</option>
            <option value="RU">Русский</option>
          </select>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save changes'}
        </Button>
        {saved && <span className="text-xs text-[var(--color-success)]">Saved.</span>}
      </div>
    </form>
  );
}
