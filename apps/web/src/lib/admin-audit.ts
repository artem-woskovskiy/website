import { headers } from 'next/headers';
import { prisma } from './prisma';

/**
 * Append a row to the `AuditLog` table for any state-changing admin action.
 * The actorEmail is intentionally hardcoded to "admin@panel" because the
 * admin panel is a shared-account system; if/when we move to per-operator
 * accounts this should be replaced with the operator's email.
 */
export async function logAdminAction(input: {
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || null;
  const userAgent = h.get('user-agent') || null;
  await prisma.auditLog.create({
    data: {
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      actorEmail: 'admin@panel',
      ip,
      userAgent,
      metadata: input.metadata as object | undefined,
    },
  });
}
