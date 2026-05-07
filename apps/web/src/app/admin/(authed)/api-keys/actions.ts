'use server';

import { logAdminAction } from '@/lib/admin-audit';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function revokeApiKeyAction(formData: FormData) {
  const id = String(formData.get('id') || '');
  if (!id) return;
  await prisma.apiKey.update({
    where: { id },
    data: { revokedAt: new Date() },
  });
  await logAdminAction({
    action: 'admin.api-key.revoke',
    entityType: 'ApiKey',
    entityId: id,
  });
  revalidatePath('/admin/api-keys');
}
