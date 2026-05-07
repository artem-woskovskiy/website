'use server';

import { logAdminAction } from '@/lib/admin-audit';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const updateSchema = z.object({
  id: z.string().min(1).max(64),
  role: z.enum(['USER', 'ADMIN']),
  emailVerified: z.boolean(),
  name: z.string().max(120).nullable(),
});

export async function updateUserAction(
  _prev: { error: string | null; ok: boolean },
  formData: FormData,
) {
  const parsed = updateSchema.safeParse({
    id: formData.get('id'),
    role: formData.get('role'),
    emailVerified: formData.get('emailVerified') === 'on',
    name: ((formData.get('name') as string) || '').trim() || null,
  });
  if (!parsed.success) return { error: 'Невалидные данные.', ok: false };

  const { id, role, emailVerified, name } = parsed.data;
  const before = await prisma.user.findUnique({
    where: { id },
    select: { role: true, emailVerifiedAt: true, name: true },
  });
  if (!before) return { error: 'Пользователь не найден.', ok: false };

  await prisma.user.update({
    where: { id },
    data: {
      role,
      name,
      emailVerifiedAt: emailVerified ? before.emailVerifiedAt ?? new Date() : null,
    },
  });
  await logAdminAction({
    action: 'admin.user.update',
    entityType: 'User',
    entityId: id,
    metadata: {
      from: {
        role: before.role,
        emailVerified: !!before.emailVerifiedAt,
        name: before.name,
      },
      to: { role, emailVerified, name },
    },
  });

  revalidatePath(`/admin/users/${id}`);
  revalidatePath('/admin/users');
  return { error: null, ok: true };
}

export async function revokeAllSessionsAction(formData: FormData) {
  const id = String(formData.get('id') || '');
  if (!id) return;
  const result = await prisma.session.updateMany({
    where: { userId: id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  await logAdminAction({
    action: 'admin.user.revoke-sessions',
    entityType: 'User',
    entityId: id,
    metadata: { count: result.count },
  });
  revalidatePath(`/admin/users/${id}`);
  revalidatePath('/admin/sessions');
}
