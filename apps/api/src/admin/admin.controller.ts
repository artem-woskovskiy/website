import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import {
  type AdminBulkIdsInput,
  type AdminBulkRoleInput,
  type AdminGrantSubscriptionInput,
  type AdminListUsersQuery,
  type AdminRefundPaymentInput,
  type AdminUpdateConfigInput,
  type AdminUpdatePlanInput,
  type AdminUpdateUserInput,
  adminBulkIdsSchema,
  adminBulkRoleSchema,
  adminGrantSubscriptionSchema,
  adminListUsersQuerySchema,
  adminRefundPaymentSchema,
  adminUpdateConfigSchema,
  adminUpdatePlanSchema,
  adminUpdateUserSchema,
} from '@sepaito/shared';
import { AdminGuard } from '../common/guards/admin.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { PrismaService } from '../prisma/prisma.service';
import type { SubscriptionsService } from '../subscriptions/subscriptions.service';

type AuthedReq = FastifyRequest & {
  user?: { id: string; email: string; role: 'USER' | 'ADMIN' };
};

const PAYMENT_STATUSES = ['PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED'] as const;
type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
const isPaymentStatus = (v: unknown): v is PaymentStatus =>
  typeof v === 'string' && (PAYMENT_STATUSES as readonly string[]).includes(v);

function csvCell(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = v instanceof Date ? v.toISOString() : String(v);
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(headers: string[], rows: (string | number | Date | null | undefined)[][]): string {
  const head = headers.map(csvCell).join(',');
  const body = rows.map((r) => r.map(csvCell).join(',')).join('\n');
  return `${head}\n${body}\n`;
}

function sendCsv(res: FastifyReply, filename: string): void {
  res.header('Content-Type', 'text/csv; charset=utf-8');
  res.header('Content-Disposition', `attachment; filename="${filename}"`);
  res.header('Cache-Control', 'no-store');
}

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subs: SubscriptionsService,
  ) {}

  // ─────────────────────────────────────────────
  // Audit helper
  // ─────────────────────────────────────────────
  private async writeAudit(args: {
    actor: { id: string; email: string };
    action: string;
    entityType?: string;
    entityId?: string | null;
    userId?: string | null;
    ip?: string | null;
    userAgent?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId: args.userId ?? args.actor.id,
        actorEmail: args.actor.email,
        action: args.action,
        entityType: args.entityType,
        entityId: args.entityId ?? null,
        ip: args.ip ?? null,
        userAgent: args.userAgent ?? null,
        metadata: (args.metadata as never) ?? undefined,
      },
    });
  }

  // ─────────────────────────────────────────────
  // Stats / metrics
  // ─────────────────────────────────────────────
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

    const chartData = dailyUsers
      .reduce((acc: { date: string; count: number }[], curr) => {
        const date = curr.createdAt.toISOString().split('T')[0] ?? '';
        const existing = acc.find((d) => d.date === date);
        if (existing) existing.count += curr._count;
        else acc.push({ date, count: curr._count });
        return acc;
      }, [])
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      userCount,
      activeSubs,
      totalRevenueRub: totalRevenue._sum.amountRub ?? 0,
      recentPayments,
      chartData,
    };
  }

  @Get('metrics/live')
  async liveMetrics() {
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const [activeSessions, sessionsSeen5m, eventsLastHour, signupsLastDay, paymentsLastDay] =
      await Promise.all([
        this.prisma.session.count({
          where: { revokedAt: null, expiresAt: { gt: now } },
        }),
        this.prisma.session.count({
          where: { revokedAt: null, lastSeenAt: { gte: fiveMinAgo } },
        }),
        this.prisma.auditLog.count({ where: { createdAt: { gte: hourAgo } } }),
        this.prisma.user.count({ where: { createdAt: { gte: dayAgo } } }),
        this.prisma.payment.aggregate({
          where: { status: 'SUCCEEDED', paidAt: { gte: dayAgo } },
          _sum: { amountRub: true },
          _count: true,
        }),
      ]);

    return {
      activeSessions,
      sessionsSeen5m,
      eventsLastHour,
      signupsLastDay,
      paymentsLastDay: {
        count: paymentsLastDay._count,
        amountRub: paymentsLastDay._sum.amountRub ?? 0,
      },
      generatedAt: now.toISOString(),
    };
  }

  // ─────────────────────────────────────────────
  // Users
  // ─────────────────────────────────────────────
  private buildUserWhere(q: AdminListUsersQuery) {
    return {
      ...(q.role ? { role: q.role } : {}),
      ...(q.q
        ? {
            OR: [
              { email: { contains: q.q, mode: 'insensitive' as const } },
              { name: { contains: q.q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
      ...(q.plan
        ? {
            subscriptions: {
              some: {
                status: { in: ['ACTIVE' as const, 'TRIALING' as const] },
                plan: { is: { code: q.plan as never } },
              },
            },
          }
        : {}),
    };
  }

  private buildUserOrderBy(sort: AdminListUsersQuery['sort']) {
    if (sort === 'createdAt_asc') return { createdAt: 'asc' as const };
    if (sort === 'email_asc') return { email: 'asc' as const };
    return { createdAt: 'desc' as const };
  }

  @Get('users')
  async listUsers(@Query() rawQuery: unknown) {
    const q: AdminListUsersQuery = adminListUsersQuerySchema.parse(rawQuery);
    const where = this.buildUserWhere(q);
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: this.buildUserOrderBy(q.sort),
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          emailVerifiedAt: true,
          createdAt: true,
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

  @Get('users.csv')
  async usersCsv(
    @Query() rawQuery: unknown,
    @Res({ passthrough: true }) res: FastifyReply,
    @Req() req: AuthedReq,
  ): Promise<string> {
    const q: AdminListUsersQuery = adminListUsersQuerySchema.parse(rawQuery);
    const where = this.buildUserWhere(q);
    const users = await this.prisma.user.findMany({
      where,
      orderBy: this.buildUserOrderBy(q.sort),
      take: 10_000,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        locale: true,
        emailVerifiedAt: true,
        createdAt: true,
        subscriptions: {
          where: { status: { in: ['ACTIVE' as const, 'TRIALING' as const] } },
          include: { plan: true },
          take: 1,
        },
      },
    });

    const csv = toCsv(
      ['id', 'email', 'name', 'role', 'locale', 'email_verified_at', 'created_at', 'plan', 'plan_status'],
      users.map((u) => [
        u.id,
        u.email,
        u.name,
        u.role,
        u.locale,
        u.emailVerifiedAt,
        u.createdAt,
        u.subscriptions[0]?.plan.code ?? '',
        u.subscriptions[0]?.status ?? '',
      ]),
    );

    sendCsv(res, `users-${new Date().toISOString().slice(0, 10)}.csv`);
    if (req.user) {
      await this.writeAudit({
        actor: req.user,
        action: 'admin.export.users',
        entityType: 'User',
        metadata: { count: users.length, filter: q },
        ip: req.ip ?? null,
        userAgent: req.headers['user-agent'] ?? null,
      });
    }
    return csv;
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
        subscriptions: { include: { plan: true }, orderBy: { createdAt: 'desc' } },
        payments: { orderBy: { createdAt: 'desc' }, take: 50 },
        sessions: { where: { revokedAt: null }, orderBy: { lastSeenAt: 'desc' } },
        apiKeys: {
          where: { revokedAt: null },
          select: { id: true, name: true, keyPrefix: true, lastUsedAt: true, createdAt: true },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  @Patch('users/:id')
  async updateUser(@Param('id') id: string, @Body() body: unknown, @Req() req: AuthedReq) {
    const parsed: AdminUpdateUserInput = adminUpdateUserSchema.parse(body);
    if (parsed.role === 'USER' && req.user?.id === id) {
      throw new ForbiddenException('Cannot demote your own account');
    }
    if (parsed.role === 'USER') {
      const adminCount = await this.prisma.user.count({ where: { role: 'ADMIN' } });
      const target = await this.prisma.user.findUnique({ where: { id }, select: { role: true } });
      if (target?.role === 'ADMIN' && adminCount <= 1) {
        throw new ForbiddenException('Cannot demote the last admin');
      }
    }
    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        role: parsed.role,
        name: parsed.name,
        emailVerifiedAt: parsed.emailVerified === true ? new Date() : undefined,
      },
      select: { id: true, email: true, name: true, role: true },
    });
    if (req.user) {
      await this.writeAudit({
        actor: req.user,
        action: 'admin.user.updated',
        entityType: 'User',
        entityId: id,
        userId: id,
        metadata: parsed as Record<string, unknown>,
        ip: req.ip ?? null,
        userAgent: req.headers['user-agent'] ?? null,
      });
    }
    return updated;
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string, @Req() req: AuthedReq) {
    if (req.user?.id === id) {
      throw new ForbiddenException('Cannot delete your own account');
    }
    const target = await this.prisma.user.findUnique({
      where: { id },
      select: { email: true, role: true },
    });
    if (!target) throw new NotFoundException('User not found');
    const bootstrapEmail = process.env.ADMIN_BOOTSTRAP_EMAIL ?? 'adam@sepaito.ai';
    if (target.email === bootstrapEmail) {
      throw new ForbiddenException('Cannot delete the bootstrap admin');
    }
    await this.prisma.user.delete({ where: { id } });
    if (req.user) {
      await this.writeAudit({
        actor: req.user,
        action: 'admin.user.deleted',
        entityType: 'User',
        entityId: id,
        userId: id,
        metadata: { email: target.email, role: target.role },
        ip: req.ip ?? null,
        userAgent: req.headers['user-agent'] ?? null,
      });
    }
    return { ok: true };
  }

  // ─────────────────────────────────────────────
  // Bulk user actions
  // ─────────────────────────────────────────────
  @Post('users/bulk-delete')
  async bulkDeleteUsers(@Body() body: unknown, @Req() req: AuthedReq) {
    const parsed: AdminBulkIdsInput = adminBulkIdsSchema.parse(body);
    const ids = parsed.ids.filter((id) => id !== req.user?.id);
    const bootstrapEmail = process.env.ADMIN_BOOTSTRAP_EMAIL ?? 'adam@sepaito.ai';
    const targets = await this.prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, email: true },
    });
    const deletable = targets.filter((t) => t.email !== bootstrapEmail).map((t) => t.id);
    const result = await this.prisma.user.deleteMany({ where: { id: { in: deletable } } });
    if (req.user) {
      await this.writeAudit({
        actor: req.user,
        action: 'admin.users.bulk_deleted',
        entityType: 'User',
        metadata: { requested: parsed.ids.length, deleted: result.count, ids: deletable },
        ip: req.ip ?? null,
        userAgent: req.headers['user-agent'] ?? null,
      });
    }
    return { ok: true, deleted: result.count, skipped: parsed.ids.length - result.count };
  }

  @Post('users/bulk-role')
  async bulkRoleUsers(@Body() body: unknown, @Req() req: AuthedReq) {
    const parsed: AdminBulkRoleInput = adminBulkRoleSchema.parse(body);
    const ids = parsed.ids;
    if (parsed.role === 'USER' && req.user && ids.includes(req.user.id)) {
      throw new ForbiddenException('Cannot demote your own account');
    }
    if (parsed.role === 'USER') {
      const adminCount = await this.prisma.user.count({ where: { role: 'ADMIN' } });
      const targets = await this.prisma.user.findMany({
        where: { id: { in: ids }, role: 'ADMIN' },
        select: { id: true },
      });
      if (adminCount - targets.length < 1) {
        throw new ForbiddenException('Cannot demote all admins — at least one must remain');
      }
    }
    const result = await this.prisma.user.updateMany({
      where: { id: { in: ids } },
      data: { role: parsed.role },
    });
    if (req.user) {
      await this.writeAudit({
        actor: req.user,
        action: 'admin.users.bulk_role',
        entityType: 'User',
        metadata: { role: parsed.role, count: result.count, ids },
        ip: req.ip ?? null,
        userAgent: req.headers['user-agent'] ?? null,
      });
    }
    return { ok: true, updated: result.count };
  }

  // ─────────────────────────────────────────────
  // Subscriptions
  // ─────────────────────────────────────────────
  @Post('subscriptions/grant')
  async grant(@Body() body: unknown, @Req() req: AuthedReq) {
    const parsed: AdminGrantSubscriptionInput = adminGrantSubscriptionSchema.parse(body);
    const sub = await this.subs.grantOrExtend({
      userId: parsed.userId,
      planCode: parsed.planCode,
      interval: parsed.interval,
      periodEnd: parsed.periodEnd ? new Date(parsed.periodEnd) : undefined,
    });
    if (req.user) {
      await this.writeAudit({
        actor: req.user,
        action: 'admin.subscription.granted',
        entityType: 'Subscription',
        entityId: sub.id,
        userId: parsed.userId,
        metadata: { planCode: parsed.planCode, interval: parsed.interval },
        ip: req.ip ?? null,
        userAgent: req.headers['user-agent'] ?? null,
      });
    }
    return sub;
  }

  // ─────────────────────────────────────────────
  // Audit log
  // ─────────────────────────────────────────────
  @Get('audit-log')
  async auditLog(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '25',
    @Query('action') action?: string,
  ) {
    const p = Math.max(1, Number(page) || 1);
    const ps = Math.min(100, Math.max(1, Number(pageSize) || 25));
    const where = action ? { action: { contains: action } } : {};
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * ps,
        take: ps,
        include: { user: { select: { email: true, name: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { items, total, page: p, pageSize: ps };
  }

  @Get('audit-log.csv')
  async auditLogCsv(
    @Query('action') action: string | undefined,
    @Res({ passthrough: true }) res: FastifyReply,
    @Req() req: AuthedReq,
  ): Promise<string> {
    const where = action ? { action: { contains: action } } : {};
    const items = await this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10_000,
      include: { user: { select: { email: true } } },
    });
    const csv = toCsv(
      ['id', 'created_at', 'actor_email', 'subject_email', 'action', 'entity_type', 'entity_id', 'ip', 'user_agent'],
      items.map((a) => [
        a.id,
        a.createdAt,
        a.actorEmail ?? '',
        a.user?.email ?? '',
        a.action,
        a.entityType ?? '',
        a.entityId ?? '',
        a.ip ?? '',
        a.userAgent ?? '',
      ]),
    );
    sendCsv(res, `audit-log-${new Date().toISOString().slice(0, 10)}.csv`);
    if (req.user) {
      await this.writeAudit({
        actor: req.user,
        action: 'admin.export.audit_log',
        entityType: 'AuditLog',
        metadata: { count: items.length, action: action ?? null },
        ip: req.ip ?? null,
        userAgent: req.headers['user-agent'] ?? null,
      });
    }
    return csv;
  }

  // ─────────────────────────────────────────────
  // Sessions
  // ─────────────────────────────────────────────
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
  async revokeSession(@Param('id') id: string, @Req() req: AuthedReq) {
    const target = await this.prisma.session.findUnique({
      where: { id },
      select: { userId: true, clientId: true },
    });
    if (!target) throw new NotFoundException('Session not found');
    await this.prisma.session.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
    if (req.user) {
      await this.writeAudit({
        actor: req.user,
        action: 'admin.session.revoked',
        entityType: 'Session',
        entityId: id,
        userId: target.userId,
        metadata: { clientId: target.clientId, by: 'admin' },
        ip: req.ip ?? null,
        userAgent: req.headers['user-agent'] ?? null,
      });
    }
    return { ok: true };
  }

  // ─────────────────────────────────────────────
  // Plans
  // ─────────────────────────────────────────────
  @Get('plans')
  async listPlans() {
    return this.prisma.plan.findMany({ orderBy: { priceMonthlyRub: 'asc' } });
  }

  @Patch('plans/:id')
  async updatePlan(@Param('id') id: string, @Body() body: unknown, @Req() req: AuthedReq) {
    const parsed: AdminUpdatePlanInput = adminUpdatePlanSchema.parse(body);
    const updated = await this.prisma.plan.update({
      where: { id },
      data: {
        name: parsed.name,
        description: parsed.description,
        priceMonthlyRub: parsed.priceMonthlyRub,
        priceYearlyRub: parsed.priceYearlyRub,
        panesLimit: parsed.panesLimit,
        workspacesLimit: parsed.workspacesLimit,
        features: parsed.features,
        isActive: parsed.isActive,
      },
    });
    if (req.user) {
      await this.writeAudit({
        actor: req.user,
        action: 'admin.plan.updated',
        entityType: 'Plan',
        entityId: id,
        metadata: parsed as Record<string, unknown>,
        ip: req.ip ?? null,
        userAgent: req.headers['user-agent'] ?? null,
      });
    }
    return updated;
  }

  // ─────────────────────────────────────────────
  // System config
  // ─────────────────────────────────────────────
  @Get('config')
  async getConfig() {
    return this.prisma.systemConfig.findMany({ orderBy: { key: 'asc' } });
  }

  @Patch('config/:key')
  async updateConfig(
    @Param('key') key: string,
    @Body() body: unknown,
    @Req() req: AuthedReq,
  ) {
    const parsed: AdminUpdateConfigInput = adminUpdateConfigSchema.parse(body);
    const result = await this.prisma.systemConfig.upsert({
      where: { key },
      create: { key, value: parsed.value, description: parsed.description ?? null },
      update: { value: parsed.value, description: parsed.description ?? undefined },
    });
    if (req.user) {
      await this.writeAudit({
        actor: req.user,
        action: 'admin.config.updated',
        entityType: 'SystemConfig',
        entityId: key,
        metadata: { key, value: parsed.value },
        ip: req.ip ?? null,
        userAgent: req.headers['user-agent'] ?? null,
      });
    }
    return result;
  }

  // ─────────────────────────────────────────────
  // Payments
  // ─────────────────────────────────────────────
  @Get('payments')
  async payments(@Query('status') status?: string) {
    return this.prisma.payment.findMany({
      where: isPaymentStatus(status) ? { status } : {},
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { user: { select: { id: true, email: true, name: true } } },
    });
  }

  @Get('payments.csv')
  async paymentsCsv(
    @Query('status') status: string | undefined,
    @Res({ passthrough: true }) res: FastifyReply,
    @Req() req: AuthedReq,
  ): Promise<string> {
    const items = await this.prisma.payment.findMany({
      where: isPaymentStatus(status) ? { status } : {},
      orderBy: { createdAt: 'desc' },
      take: 10_000,
      include: { user: { select: { email: true, name: true } } },
    });
    const csv = toCsv(
      ['id', 'invoice_id', 'user_email', 'user_name', 'amount_rub', 'currency', 'status', 'description', 'created_at', 'paid_at'],
      items.map((p) => [
        p.id,
        p.invoiceId,
        p.user.email,
        p.user.name ?? '',
        (p.amountRub / 100).toFixed(2),
        p.currency,
        p.status,
        p.description ?? '',
        p.createdAt,
        p.paidAt,
      ]),
    );
    sendCsv(res, `payments-${new Date().toISOString().slice(0, 10)}.csv`);
    if (req.user) {
      await this.writeAudit({
        actor: req.user,
        action: 'admin.export.payments',
        entityType: 'Payment',
        metadata: { count: items.length, status: status ?? null },
        ip: req.ip ?? null,
        userAgent: req.headers['user-agent'] ?? null,
      });
    }
    return csv;
  }

  @Post('payments/:id/refund')
  async refundPayment(@Param('id') id: string, @Body() body: unknown, @Req() req: AuthedReq) {
    const parsed: AdminRefundPaymentInput = adminRefundPaymentSchema.parse(body);
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      select: { id: true, status: true, userId: true, amountRub: true, invoiceId: true },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== 'SUCCEEDED') {
      throw new ForbiddenException('Only succeeded payments can be refunded');
    }
    const updated = await this.prisma.payment.update({
      where: { id },
      data: { status: 'REFUNDED' },
    });
    if (req.user) {
      await this.writeAudit({
        actor: req.user,
        action: 'admin.payment.refunded',
        entityType: 'Payment',
        entityId: id,
        userId: payment.userId,
        metadata: {
          invoiceId: payment.invoiceId,
          amountRub: payment.amountRub,
          reason: parsed.reason ?? null,
        },
        ip: req.ip ?? null,
        userAgent: req.headers['user-agent'] ?? null,
      });
    }
    return updated;
  }

  @Post('payments/:id/retry')
  async retryPayment(@Param('id') id: string, @Req() req: AuthedReq) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      select: { id: true, status: true, userId: true, invoiceId: true },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== 'FAILED') {
      throw new ForbiddenException('Only failed payments can be retried');
    }
    const updated = await this.prisma.payment.update({
      where: { id },
      data: { status: 'PENDING' },
    });
    if (req.user) {
      await this.writeAudit({
        actor: req.user,
        action: 'admin.payment.retry_queued',
        entityType: 'Payment',
        entityId: id,
        userId: payment.userId,
        metadata: { invoiceId: payment.invoiceId },
        ip: req.ip ?? null,
        userAgent: req.headers['user-agent'] ?? null,
      });
    }
    return updated;
  }

  // ─────────────────────────────────────────────
  // Webhook delivery log (filter of AuditLog)
  // ─────────────────────────────────────────────
  @Get('webhooks')
  async webhooks(@Query('page') page = '1', @Query('pageSize') pageSize = '25') {
    const p = Math.max(1, Number(page) || 1);
    const ps = Math.min(100, Math.max(1, Number(pageSize) || 25));
    const where = {
      OR: [
        { action: { startsWith: 'payment.' } },
        { action: { startsWith: 'webhook.' } },
        { action: { startsWith: 'robokassa.' } },
      ],
    };
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * ps,
        take: ps,
        include: { user: { select: { email: true, name: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { items, total, page: p, pageSize: ps };
  }
}
