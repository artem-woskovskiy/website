import { Injectable } from '@nestjs/common';
import type { BillingInterval, PlanCode, SubscriptionStatus } from '@sepaito/db';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  listPlans() {
    return this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { priceMonthlyRub: 'asc' },
    });
  }

  async getCurrent(userId: string) {
    return this.prisma.subscription.findFirst({
      where: { userId, status: { in: ['TRIALING', 'ACTIVE', 'PAST_DUE'] } },
      orderBy: { createdAt: 'desc' },
      include: { plan: true },
    });
  }

  async grantOrExtend(args: {
    userId: string;
    planCode: PlanCode;
    interval: BillingInterval;
    paymentId?: string;
    periodEnd?: Date;
  }) {
    const plan = await this.prisma.plan.findUniqueOrThrow({ where: { code: args.planCode } });
    const now = new Date();
    const defaultPeriodEnd =
      args.interval === 'YEAR'
        ? new Date(now.getTime() + 365 * 86400 * 1000)
        : new Date(now.getTime() + 30 * 86400 * 1000);

    const existing = await this.prisma.subscription.findFirst({
      where: { userId: args.userId, status: { in: ['TRIALING', 'ACTIVE', 'PAST_DUE'] } },
      orderBy: { createdAt: 'desc' },
    });

    if (existing && existing.planId === plan.id) {
      // extend
      const base =
        existing.currentPeriodEnd && existing.currentPeriodEnd > now
          ? existing.currentPeriodEnd
          : now;
      const newEnd =
        args.interval === 'YEAR'
          ? new Date(base.getTime() + 365 * 86400 * 1000)
          : new Date(base.getTime() + 30 * 86400 * 1000);
      return this.prisma.subscription.update({
        where: { id: existing.id },
        data: {
          status: 'ACTIVE' as SubscriptionStatus,
          currentPeriodStart: now,
          currentPeriodEnd: args.periodEnd ?? newEnd,
          interval: args.interval,
          payments: args.paymentId ? { connect: { id: args.paymentId } } : undefined,
        },
      });
    }

    // upgrade / new
    if (existing) {
      await this.prisma.subscription.update({
        where: { id: existing.id },
        data: { status: 'CANCELED' as SubscriptionStatus, canceledAt: now },
      });
    }
    return this.prisma.subscription.create({
      data: {
        userId: args.userId,
        planId: plan.id,
        status: 'ACTIVE' as SubscriptionStatus,
        interval: args.interval,
        currentPeriodStart: now,
        currentPeriodEnd: args.periodEnd ?? defaultPeriodEnd,
        payments: args.paymentId ? { connect: { id: args.paymentId } } : undefined,
      },
    });
  }

  async cancelAtPeriodEnd(userId: string) {
    const sub = await this.getCurrent(userId);
    if (!sub) return { ok: true };
    await this.prisma.subscription.update({
      where: { id: sub.id },
      data: { cancelAtPeriodEnd: true },
    });
    return { ok: true };
  }
}
