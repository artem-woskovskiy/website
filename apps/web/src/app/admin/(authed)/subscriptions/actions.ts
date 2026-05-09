'use server';

import { logAdminAction } from '@/lib/admin-audit';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const grantSchema = z.object({
  email: z.string().email().max(120),
  planId: z.string().min(1).max(64),
  interval: z.enum(['MONTH', 'YEAR']),
  days: z.coerce.number().int().min(1).max(365 * 5),
});

export async function grantSubscriptionAction(
  _prev: { error: string | null; ok: boolean },
  formData: FormData,
) {
  const parsed = grantSchema.safeParse({
    email: formData.get('email'),
    planId: formData.get('planId'),
    interval: formData.get('interval'),
    days: formData.get('days'),
  });
  if (!parsed.success) return { error: 'Невалидные данные.', ok: false };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) return { error: 'Пользователь с таким email не найден.', ok: false };

  const now = new Date();
  const end = new Date(now.getTime() + parsed.data.days * 24 * 60 * 60 * 1000);
  const created = await prisma.subscription.create({
    data: {
      userId: user.id,
      planId: parsed.data.planId,
      status: 'ACTIVE',
      interval: parsed.data.interval,
      currentPeriodStart: now,
      currentPeriodEnd: end,
    },
  });
  await logAdminAction({
    action: 'admin.subscription.grant',
    entityType: 'Subscription',
    entityId: created.id,
    metadata: { userId: user.id, days: parsed.data.days },
  });

  revalidatePath('/admin/subscriptions');
  revalidatePath(`/admin/users/${user.id}`);
  return { error: null, ok: true };
}

export async function cancelSubscriptionAction(formData: FormData) {
  const id = String(formData.get('id') || '');
  if (!id) return;
  await prisma.subscription.update({
    where: { id },
    data: { status: 'CANCELED', canceledAt: new Date(), cancelAtPeriodEnd: true },
  });
  await logAdminAction({
    action: 'admin.subscription.cancel',
    entityType: 'Subscription',
    entityId: id,
  });
  revalidatePath('/admin/subscriptions');
}
