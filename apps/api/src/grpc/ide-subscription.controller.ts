import { createHash } from 'node:crypto';
import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { PrismaService } from '../prisma/prisma.service';

interface ValidateRequest {
  api_key: string;
  install_id: string;
  platform: string;
  app_version: string;
}

interface ValidateResponse {
  ok: boolean;
  user_id: string;
  plan_code: string;
  status: string;
  current_period_end: number;
  panes_limit: number;
  workspaces_limit: number;
  reason: string;
}

interface HeartbeatRequest {
  api_key: string;
  install_id: string;
}

@Controller()
export class IdeSubscriptionController {
  constructor(private readonly prisma: PrismaService) {}

  @GrpcMethod('SubscriptionService', 'Validate')
  async validate(req: ValidateRequest): Promise<ValidateResponse> {
    const empty = (reason: string): ValidateResponse => ({
      ok: false,
      user_id: '',
      plan_code: '',
      status: '',
      current_period_end: 0,
      panes_limit: 0,
      workspaces_limit: 0,
      reason,
    });

    if (!req.api_key) return empty('missing api key');
    const keyHash = createHash('sha256').update(req.api_key).digest('hex');
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { keyHash },
      include: { user: true },
    });
    if (!apiKey || apiKey.revokedAt) return empty('invalid api key');
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return empty('expired api key');

    // upsert device
    if (req.install_id) {
      await this.prisma.device.upsert({
        where: { installId: req.install_id },
        create: {
          userId: apiKey.userId,
          name: `Sepaito Desktop · ${req.platform || 'unknown'}`,
          platform: req.platform || null,
          installId: req.install_id,
        },
        update: { lastSeenAt: new Date(), platform: req.platform || undefined },
      });
    }

    const sub = await this.prisma.subscription.findFirst({
      where: { userId: apiKey.userId, status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] } },
      orderBy: { createdAt: 'desc' },
      include: { plan: true },
    });

    if (!sub) {
      const hobby = await this.prisma.plan.findUniqueOrThrow({ where: { code: 'HOBBY' } });
      return {
        ok: true,
        user_id: apiKey.userId,
        plan_code: 'HOBBY',
        status: 'ACTIVE',
        current_period_end: 0,
        panes_limit: hobby.panesLimit,
        workspaces_limit: hobby.workspacesLimit,
        reason: '',
      };
    }

    return {
      ok: true,
      user_id: apiKey.userId,
      plan_code: sub.plan.code,
      status: sub.status,
      current_period_end: sub.currentPeriodEnd ? sub.currentPeriodEnd.getTime() : 0,
      panes_limit: sub.plan.panesLimit,
      workspaces_limit: sub.plan.workspacesLimit,
      reason: '',
    };
  }

  @GrpcMethod('SubscriptionService', 'Heartbeat')
  async heartbeat(req: HeartbeatRequest): Promise<{ ok: boolean }> {
    if (!req.api_key || !req.install_id) return { ok: false };
    const keyHash = createHash('sha256').update(req.api_key).digest('hex');
    const apiKey = await this.prisma.apiKey.findUnique({ where: { keyHash } });
    if (!apiKey || apiKey.revokedAt) return { ok: false };
    await this.prisma.device.updateMany({
      where: { userId: apiKey.userId, installId: req.install_id },
      data: { lastSeenAt: new Date() },
    });
    await this.prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } });
    return { ok: true };
  }
}
