'use server';

import { logAdminAction } from '@/lib/admin-audit';
import { getAdminRedis } from '@/lib/admin-redis';
import { Queue } from 'bullmq';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const idSchema = z.string().trim().min(1).max(120);

function makeQueue() {
  const conn = getAdminRedis();
  if (!conn) return null;
  return new Queue('email', { connection: conn });
}

export async function retryEmailJobAction(formData: FormData) {
  const id = idSchema.parse(formData.get('id'));
  const queue = makeQueue();
  if (!queue) return;
  const job = await queue.getJob(id);
  if (!job) return;
  await job.retry();
  await logAdminAction({
    action: 'admin.email-queue.retry',
    entityType: 'BullMQJob',
    entityId: id,
  });
  revalidatePath('/admin/email-queue');
}

export async function removeEmailJobAction(formData: FormData) {
  const id = idSchema.parse(formData.get('id'));
  const queue = makeQueue();
  if (!queue) return;
  const job = await queue.getJob(id);
  if (!job) return;
  await job.remove();
  await logAdminAction({
    action: 'admin.email-queue.remove',
    entityType: 'BullMQJob',
    entityId: id,
  });
  revalidatePath('/admin/email-queue');
}
