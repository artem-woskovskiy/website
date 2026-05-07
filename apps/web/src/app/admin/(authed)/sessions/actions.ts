'use server';

import { logAdminAction } from '@/lib/admin-audit';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function revokeSessionAction(formData: FormData) {
  const id = String(formData.get('id') || '');
  if (!id) return;
  await prisma.session.update({ where: { id }, data: { revokedAt: new Date() } });
  await logAdminAction({
    action: 'admin.session.revoke',
    entityType: 'Session',
    entityId: id,
  });
  revalidatePath('/admin/sessions');
}
