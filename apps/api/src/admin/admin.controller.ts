import { Body, Controller, Delete, ForbiddenException, Get, NotFoundException, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
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
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [userCount, activeSubs, totalRevenue, recentPayments, dailyUsers] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.subscription.count({ where: { status: { in: ['ACTIVE', 'TRIALING'] } } }),
      this.prisma.payment.aggregate({ where: { status: 'SUCCEEDED' }, _sum: { amountRub: true } }),
      this.prisma.payment.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { user: { select: { email: true, name: true } } },
      }),
      this.prisma.user.groupBy({
        by: ['createdAt'],
        where: { createdAt: { gte: thirtyDaysAgo } },
        _count: true,
      }),
    ]);

    // Format daily data for charts
    const chartData = dailyUsers.reduce((acc: any[], curr) => {
      const date = curr.createdAt.toISOString().split('T')[0];
      const existing = acc.find(d => d.date === date);
      if (existing) existing.count += curr._count;
      else acc.push({ date, count: curr._count });
      return acc;
    }, []).sort((a, b) => a.date.localeCompare(b.date));

    return {
      userCount,
      activeSubs,
      totalRevenueRub: totalRevenue._sum.amountRub ?? 0,
      recentPayments,
      chartData,
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
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          // passwordHash intentionally excluded
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
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        locale: true,
        emailVerifiedAt: true,
        createdAt: true,
        updatedAt: true,
        // passwordHash intentionally excluded
        subscriptions: { include: { plan: true }, orderBy: { createdAt: 'desc' } },
        payments: { orderBy: { createdAt: 'desc' }, take: 50 },
        sessions: { where: { revokedAt: null }, orderBy: { lastSeenAt: 'desc' } },
        apiKeys: { where: { revokedAt: null }, select: { id: true, name: true, keyPrefix: true, lastUsedAt: true, createdAt: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  @Patch('users/:id')
  async updateUser(@Param('id') id: string, @Body() body: unknown, @Req() req: { user?: { id: string } }) {
    const parsed: AdminUpdateUserInput = adminUpdateUserSchema.parse(body);
    // Prevent demoting yourself
    if (parsed.role === 'USER' && req.user?.id === id) {
      throw new ForbiddenException('Cannot demote your own account');
    }
    // Prevent demoting the last admin
    if (parsed.role === 'USER') {
      const adminCount = await this.prisma.user.count({ where: { role: 'ADMIN' } });
      const target = await this.prisma.user.findUnique({ where: { id }, select: { role: true } });
      if (target?.role === 'ADMIN' && adminCount <= 1) {
        throw new ForbiddenException('Cannot demote the last admin');
      }
    }
    return this.prisma.user.update({
      where: { id },
      data: {
        role: parsed.role,
        name: parsed.name,
        emailVerifiedAt: parsed.emailVerified === true ? new Date() : undefined,
      },
      select: { id: true, email: true, name: true, role: true },
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

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string, @Req() req: { user?: { id: string } }) {
    // Prevent admin from deleting themselves
    if (req.user?.id === id) {
      throw new ForbiddenException('Cannot delete your own account');
    }
    // Prevent deleting the bootstrap admin
    const target = await this.prisma.user.findUnique({ where: { id }, select: { email: true } });
    if (!target) throw new NotFoundException('User not found');
    const bootstrapEmail = process.env.ADMIN_BOOTSTRAP_EMAIL ?? 'adam@sepaito.ai';
    if (target.email === bootstrapEmail) {
      throw new ForbiddenException('Cannot delete the bootstrap admin');
    }
    await this.prisma.user.delete({ where: { id } });
    return { ok: true };
  }

  @Get('audit-log')
  async auditLog(@Query('page') page = '1', @Query('pageSize') pageSize = '25') {
    const p = Math.max(1, Number(page));
    const ps = Math.min(100, Math.max(1, Number(pageSize)));
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * ps,
        take: ps,
        include: { user: { select: { email: true, name: true } } },
      }),
      this.prisma.auditLog.count(),
    ]);
    return { items, total, page: p, pageSize: ps };
  }

  @Get('sessions')
  async sessions() {
    return this.prisma.session.findMany({
      where: { revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { lastSeenAt: 'desc' },
      take: 100,
      include: { user: { select: { id: true, email: true, name: true } } },
    });
  }

  @Delete('sessions/:id')
  async revokeSession(@Param('id') id: string) {
    await this.prisma.session.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }

  @Get('plans')
  async listPlans() {
    return this.prisma.plan.findMany({ orderBy: { priceMonthlyRub: 'asc' } });
  }

  @Patch('plans/:id')
  async updatePlan(@Param('id') id: string, @Body() body: any) {
    return this.prisma.plan.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        priceMonthlyRub: body.priceMonthlyRub,
        priceYearlyRub: body.priceYearlyRub,
        panesLimit: body.panesLimit,
        workspacesLimit: body.workspacesLimit,
        features: body.features,
        isActive: body.isActive,
      },
    });
  }

  @Get('config')
  async getConfig() {
    return this.prisma.systemConfig.findMany();
  }

  @Patch('config/:key')
  async updateConfig(@Param('key') key: string, @Body('value') value: string) {
    return this.prisma.systemConfig.upsert({
      where: { key },
      create: { key, value },
      update: { value },
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
