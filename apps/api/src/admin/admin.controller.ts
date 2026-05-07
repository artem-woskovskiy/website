import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import {
  type AdminGrantSubscriptionInput,
  type AdminListUsersQuery,
  type AdminUpdateUserInput,
  adminGrantSubscriptionSchema,
  adminListUsersQuerySchema,
  adminUpdateUserSchema,
} from '@sepaito/shared';
import { AdminGuard } from '../common/guards/admin.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subs: SubscriptionsService,
  ) {}

  @Get('stats')
  async stats() {
    const [userCount, activeSubs, totalRevenue, recentPayments] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.subscription.count({ where: { status: { in: ['ACTIVE', 'TRIALING'] } } }),
      this.prisma.payment.aggregate({ where: { status: 'SUCCEEDED' }, _sum: { amountRub: true } }),
      this.prisma.payment.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { user: { select: { email: true, name: true } } },
      }),
    ]);
    return {
      userCount,
      activeSubs,
      totalRevenueRub: totalRevenue._sum.amountRub ?? 0,
      recentPayments,
    };
  }

  @Get('users')
  async listUsers(@Query() rawQuery: unknown) {
    const q: AdminListUsersQuery = adminListUsersQuerySchema.parse(rawQuery);
    const where = {
      ...(q.role ? { role: q.role } : {}),
      ...(q.q
        ? {
            OR: [
              { email: { contains: q.q, mode: 'insensitive' as const } },
              { name: { contains: q.q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        include: {
          subscriptions: {
            where: { status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] } },
            include: { plan: true },
            take: 1,
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items, total, page: q.page, pageSize: q.pageSize };
  }

  @Get('users/:id')
  async getUser(@Param('id') id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        subscriptions: { include: { plan: true }, orderBy: { createdAt: 'desc' } },
        payments: { orderBy: { createdAt: 'desc' }, take: 50 },
        sessions: { where: { revokedAt: null }, orderBy: { lastSeenAt: 'desc' } },
        apiKeys: { where: { revokedAt: null } },
      },
    });
  }

  @Patch('users/:id')
  async updateUser(@Param('id') id: string, @Body() body: unknown) {
    const parsed: AdminUpdateUserInput = adminUpdateUserSchema.parse(body);
    return this.prisma.user.update({
      where: { id },
      data: {
        role: parsed.role,
        name: parsed.name,
        emailVerifiedAt: parsed.emailVerified === true ? new Date() : undefined,
      },
    });
  }

  @Post('subscriptions/grant')
  async grant(@Body() body: unknown) {
    const parsed: AdminGrantSubscriptionInput = adminGrantSubscriptionSchema.parse(body);
    return this.subs.grantOrExtend({
      userId: parsed.userId,
      planCode: parsed.planCode,
      interval: parsed.interval,
      periodEnd: parsed.periodEnd ? new Date(parsed.periodEnd) : undefined,
    });
  }

  @Get('payments')
  async payments(@Query('status') status?: string) {
    return this.prisma.payment.findMany({
      where: status ? { status: status as never } : {},
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { user: { select: { id: true, email: true, name: true } } },
    });
  }
}
