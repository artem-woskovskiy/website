import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { BillingInterval, PlanCode } from '@sepaito/db';
import { nanoid } from 'nanoid';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { PAYMENT_PROVIDER } from './payments.tokens';
import type { PaymentProvider } from './providers/payment-provider.interface';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subs: SubscriptionsService,
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
  ) {}

  async createCheckout(args: { userId: string; planCode: PlanCode; interval: BillingInterval }) {
    const plan = await this.prisma.plan.findUnique({ where: { code: args.planCode } });
    if (!plan) throw new NotFoundException('Plan not found');
    if (plan.code === 'HOBBY') throw new BadRequestException('Hobby plan is free; no checkout');

    const amount = args.interval === 'YEAR' ? plan.priceYearlyRub : plan.priceMonthlyRub;
    if (amount <= 0) throw new BadRequestException('Plan is not purchasable');

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: args.userId } });
    const invoiceId = `${Date.now().toString(36)}${nanoid(6)}`.toUpperCase();
    const description = `Sepaito ${plan.name} · ${args.interval === 'YEAR' ? 'Yearly' : 'Monthly'}`;

    const payment = await this.prisma.payment.create({
      data: {
        userId: user.id,
        provider: this.provider.name,
        invoiceId,
        amountRub: amount,
        currency: 'RUB',
        description,
        status: 'PENDING',
        metadata: { planCode: plan.code, interval: args.interval } as object,
      },
    });

    const result = await this.provider.createCheckout({
      userId: user.id,
      email: user.email,
      planCode: plan.code,
      interval: args.interval,
      amountKopecks: amount,
      description,
      invoiceId,
    });

    return { paymentUrl: result.paymentUrl, paymentId: payment.id, invoiceId };
  }

  async handleResultCallback(payload: { OutSum: string; InvId: string; SignatureValue: string }) {
    const ok = this.provider.verifyResultCallback({
      outSum: payload.OutSum,
      invId: payload.InvId,
      signatureValue: payload.SignatureValue,
    });
    if (!ok) throw new BadRequestException('Bad signature');

    const payment = await this.prisma.payment.findUnique({ where: { invoiceId: payload.InvId } });
    if (!payment) throw new NotFoundException('Invoice not found');
    if (payment.status === 'SUCCEEDED') return `OK${payload.InvId}`; // idempotent

    const expected = (payment.amountRub / 100).toFixed(2);
    if (payload.OutSum !== expected) throw new BadRequestException('Amount mismatch');

    const meta = (payment.metadata ?? {}) as { planCode?: PlanCode; interval?: BillingInterval };
    if (!meta.planCode || !meta.interval) throw new BadRequestException('Bad invoice metadata');

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'SUCCEEDED', paidAt: new Date(), signatureValue: payload.SignatureValue },
    });

    const sub = await this.subs.grantOrExtend({
      userId: payment.userId,
      planCode: meta.planCode,
      interval: meta.interval,
      paymentId: payment.id,
    });

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { subscriptionId: sub.id },
    });

    // Robokassa requires the literal "OK<InvId>" body in the response.
    return `OK${payload.InvId}`;
  }

  async listMine(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
