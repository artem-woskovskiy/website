'use server';

import { logAdminAction } from '@/lib/admin-audit';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const upsertSchema = z.object({
  id: z.string().optional(),
  code: z.enum(['HOBBY', 'PRO', 'TEAM']),
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(400).nullable(),
  priceMonthlyRub: z.coerce.number().int().min(0).max(100_000_00),
  priceYearlyRub: z.coerce.number().int().min(0).max(100_000_00),
  panesLimit: z.coerce.number().int().min(0).max(1_000),
  workspacesLimit: z.coerce.number().int().min(0).max(1_000),
  features: z.string().max(2_000),
  isActive: z.boolean(),
});

export async function upsertPlanAction(
  _prev: { error: string | null; ok: boolean },
  formData: FormData,
) {
  const parsed = upsertSchema.safeParse({
    id: (formData.get('id') as string) || undefined,
    code: formData.get('code'),
    name: formData.get('name'),
    description: ((formData.get('description') as string) || '').trim() || null,
    priceMonthlyRub: formData.get('priceMonthlyRub'),
    priceYearlyRub: formData.get('priceYearlyRub'),
    panesLimit: formData.get('panesLimit'),
    workspacesLimit: formData.get('workspacesLimit'),
    features: formData.get('features'),
    isActive: formData.get('isActive') === 'on',
  });
  if (!parsed.success) return { error: 'Невалидные данные.', ok: false };

  const features = parsed.data.features
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 50);

  if (parsed.data.id) {
    await prisma.plan.update({
      where: { id: parsed.data.id },
      data: {
        code: parsed.data.code,
        name: parsed.data.name,
        description: parsed.data.description,
        priceMonthlyRub: parsed.data.priceMonthlyRub,
        priceYearlyRub: parsed.data.priceYearlyRub,
        panesLimit: parsed.data.panesLimit,
        workspacesLimit: parsed.data.workspacesLimit,
        features,
        isActive: parsed.data.isActive,
      },
    });
    await logAdminAction({
      action: 'admin.plan.update',
      entityType: 'Plan',
      entityId: parsed.data.id,
      metadata: { code: parsed.data.code },
    });
  } else {
    const created = await prisma.plan.create({
      data: {
        code: parsed.data.code,
        name: parsed.data.name,
        description: parsed.data.description,
        priceMonthlyRub: parsed.data.priceMonthlyRub,
        priceYearlyRub: parsed.data.priceYearlyRub,
        panesLimit: parsed.data.panesLimit,
        workspacesLimit: parsed.data.workspacesLimit,
        features,
        isActive: parsed.data.isActive,
      },
    });
    await logAdminAction({
      action: 'admin.plan.create',
      entityType: 'Plan',
      entityId: created.id,
      metadata: { code: parsed.data.code },
    });
  }

  revalidatePath('/admin/plans');
  return { error: null, ok: true };
}

export async function togglePlanActiveAction(formData: FormData) {
  const id = String(formData.get('id') || '');
  if (!id) return;
  const plan = await prisma.plan.findUnique({ where: { id } });
  if (!plan) return;
  await prisma.plan.update({ where: { id }, data: { isActive: !plan.isActive } });
  await logAdminAction({
    action: 'admin.plan.toggle',
    entityType: 'Plan',
    entityId: id,
    metadata: { from: plan.isActive, to: !plan.isActive },
  });
  revalidatePath('/admin/plans');
}
