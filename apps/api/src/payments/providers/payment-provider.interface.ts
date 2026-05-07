import type { BillingInterval, PlanCode } from '@sepaito/db';

export interface CreateCheckoutArgs {
  userId: string;
  email: string;
  planCode: PlanCode;
  interval: BillingInterval;
  amountKopecks: number;
  description: string;
  invoiceId: string;
}

export interface CheckoutResult {
  paymentUrl: string;
  invoiceId: string;
}

export interface PaymentProvider {
  readonly name: 'ROBOKASSA' | 'ROBOKASSA_STUB';
  createCheckout(args: CreateCheckoutArgs): Promise<CheckoutResult>;
  /**
   * Verify the server-to-server `ResultURL` callback.
   * Returns true if the signature + amount match the stored invoice.
   */
  verifyResultCallback(args: {
    outSum: string;
    invId: string;
    signatureValue: string;
  }): boolean;
}
