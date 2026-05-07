import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  buildInitSignature,
  buildInitUrl,
  verifyResultSignature,
} from '@sepaito/shared/robokassa';
import type {
  CheckoutResult,
  CreateCheckoutArgs,
  PaymentProvider,
} from './payment-provider.interface';

/**
 * Stub Robokassa provider.
 *
 * - Builds a URL pointed at our own /api/payments/robokassa/stub
 *   so the developer doesn't need a real merchant account.
 * - Signature math is identical to production Robokassa, so swapping
 *   to the real provider is a one-line change.
 */
@Injectable()
export class RobokassaStubProvider implements PaymentProvider {
  readonly name = 'ROBOKASSA_STUB' as const;

  constructor(private readonly config: ConfigService) {}

  async createCheckout(args: CreateCheckoutArgs): Promise<CheckoutResult> {
    const merchantLogin = this.config.get<string>('ROBOKASSA_MERCHANT_LOGIN', 'demo');
    const password1 = this.config.get<string>('ROBOKASSA_PASSWORD_1', 'password1');
    const isTest = this.config.get<boolean>('ROBOKASSA_TEST_MODE', true);
    const apiUrl = this.config.get<string>('PUBLIC_API_URL', 'http://localhost:4000');

    const outSum = formatRub(args.amountKopecks);
    const shp: Record<string, string> = {
      Shp_userId: args.userId,
      Shp_planCode: args.planCode,
      Shp_interval: args.interval,
    };

    const signature = buildInitSignature({
      merchantLogin,
      outSum,
      invId: args.invoiceId,
      password1,
      shp,
    });

    const paymentUrl = buildInitUrl({
      // The stub endpoint *is* our payment page. In production replace with:
      // baseUrl: 'https://auth.robokassa.ru/Merchant/Index.aspx'
      baseUrl: `${apiUrl}/api/payments/robokassa/stub`,
      merchantLogin,
      outSum,
      invId: args.invoiceId,
      description: args.description,
      signature,
      isTest,
      culture: 'en',
      shp,
    });

    return { paymentUrl, invoiceId: args.invoiceId };
  }

  verifyResultCallback(args: { outSum: string; invId: string; signatureValue: string }): boolean {
    const password2 = this.config.get<string>('ROBOKASSA_PASSWORD_2', 'password2');
    return verifyResultSignature({
      outSum: args.outSum,
      invId: args.invId,
      password2,
      signatureValue: args.signatureValue,
    });
  }
}

function formatRub(kopecks: number): string {
  // Robokassa expects a string with two decimal places.
  const rub = (kopecks / 100).toFixed(2);
  return rub;
}
