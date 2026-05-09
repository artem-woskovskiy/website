import { createHash } from 'node:crypto';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Post,
  Query,
  Res,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  type CreateCheckoutInput,
  type RobokassaResultInput,
  createCheckoutSchema,
  robokassaResultSchema,
} from '@sepaito/shared';
import type { FastifyReply } from 'fastify';
import { type AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod.pipe';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly payments: PaymentsService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Step 1: user clicks "Pay" → we create a pending Payment + return a redirect URL.
   */
  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ZodValidationPipe(createCheckoutSchema))
  checkout(@CurrentUser() user: AuthUser, @Body() body: CreateCheckoutInput) {
    return this.payments.createCheckout({
      userId: user.id,
      planCode: body.planCode,
      interval: body.interval,
    });
  }

  /**
   * Step 2 (server-to-server): Robokassa hits ResultURL with OutSum, InvId, SignatureValue.
   * Must respond with literal "OK<InvId>" on success.
   */
  @Post('robokassa/result')
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(robokassaResultSchema))
  async result(@Body() body: RobokassaResultInput, @Res({ passthrough: true }) res: FastifyReply) {
    const text = await this.payments.handleResultCallback(body);
    res.header('content-type', 'text/plain; charset=utf-8');
    return text;
  }

  /**
   * Step 3 (browser redirect): SuccessURL — user lands here after paying.
   * Display friendly redirect; sub status is authoritative from /payments/robokassa/result.
   */
  @Get('robokassa/success')
  success(@Query('InvId') invId: string, @Res({ passthrough: true }) res: FastifyReply) {
    const url = new URL(this.config.get<string>('PUBLIC_WEB_URL', 'http://localhost:3000'));
    url.pathname = '/account/billing';
    url.searchParams.set('payment', 'success');
    if (invId) url.searchParams.set('inv', invId);
    res.status(302).redirect(url.toString());
  }

  @Get('robokassa/fail')
  fail(@Query('InvId') invId: string, @Res({ passthrough: true }) res: FastifyReply) {
    const url = new URL(this.config.get<string>('PUBLIC_WEB_URL', 'http://localhost:3000'));
    url.pathname = '/pricing';
    url.searchParams.set('payment', 'failed');
    if (invId) url.searchParams.set('inv', invId);
    res.status(302).redirect(url.toString());
  }

  /**
   * Stub-only: simulates Robokassa firing the ResultURL after the user clicks "Pay".
   * Computes the password-2 signature server-side, calls the real result handler,
   * then redirects the browser to SuccessURL.
   */
  @Post('robokassa/stub-confirm')
  async stubConfirm(
    @Body() body: { OutSum: string; InvId: string },
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    // Stub endpoints are dev/test-only. Refuse to operate when ROBOKASSA_TEST_MODE
    // is off — never expose the synthetic-signature backdoor in real environments.
    if (this.config.get<string>('ROBOKASSA_TEST_MODE') !== '1') {
      throw new NotFoundException();
    }
    const password2 = this.config.get<string>('ROBOKASSA_PASSWORD_2', 'password2');
    const sig = createHash('md5')
      .update(`${body.OutSum}:${body.InvId}:${password2}`, 'utf8')
      .digest('hex')
      .toUpperCase();
    await this.payments.handleResultCallback({
      OutSum: body.OutSum,
      InvId: body.InvId,
      SignatureValue: sig,
    });
    const url = new URL(this.config.get<string>('PUBLIC_API_URL', 'http://localhost:4000'));
    url.pathname = '/api/payments/robokassa/success';
    url.searchParams.set('InvId', body.InvId);
    res.status(302).redirect(url.toString());
  }

  /**
   * Stub-only: simulates the Robokassa hosted payment page.
   * Renders a tiny HTML page with two buttons (Pay / Cancel) that POST back to /stub-confirm.
   */
  @Get('robokassa/stub')
  stub(
    @Query('MerchantLogin') merchantLogin: string,
    @Query('OutSum') outSum: string,
    @Query('InvId') invId: string,
    @Query('Description') description: string,
    @Query('SignatureValue') signature: string,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    if (this.config.get<string>('ROBOKASSA_TEST_MODE') !== '1') {
      throw new NotFoundException();
    }
    const html = renderStubPage({ merchantLogin, outSum, invId, description, signature });
    res.header('content-type', 'text/html; charset=utf-8');
    return html;
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  mine(@CurrentUser() user: AuthUser) {
    return this.payments.listMine(user.id);
  }
}

function renderStubPage(args: {
  merchantLogin: string;
  outSum: string;
  invId: string;
  description: string;
  signature: string;
}): string {
  const safe = (s: string) =>
    String(s ?? '').replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
    );
  return /* html */ `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Robokassa (stub) — Sepaito</title>
<style>
  :root { color-scheme: dark; }
  body { font:14px/1.5 system-ui,Inter,Segoe UI,sans-serif; background:#0e0c0a; color:#f3eee6; margin:0; }
  main { max-width:480px; margin:48px auto; padding:32px; border:1px solid #2a2622; border-radius:12px; background:#15110d; }
  h1 { font-size:20px; margin:0 0 8px; }
  p { color:#a89e8e; margin:6px 0; }
  dl { margin:16px 0 24px; display:grid; grid-template-columns: 110px 1fr; gap:6px 12px; }
  dt { color:#a89e8e; }
  .row { display:flex; gap:12px; margin-top:16px; }
  button { flex:1; padding:12px 14px; border-radius:8px; border:1px solid #2a2622; cursor:pointer; font:inherit; }
  .pay { background:#f2a24a; color:#1c150c; border-color:#f2a24a; font-weight:600; }
  .cancel { background:transparent; color:#f3eee6; }
  small { color:#7a7060; }
  code { background:#0a0806; padding:2px 6px; border-radius:4px; }
</style></head><body>
<main>
  <h1>Robokassa <small>(stub — dev only)</small></h1>
  <p>This stub mirrors a real Robokassa hosted page. Click <b>Pay</b> to simulate a successful server callback.</p>
  <dl>
    <dt>Merchant</dt><dd>${safe(args.merchantLogin)}</dd>
    <dt>Description</dt><dd>${safe(args.description)}</dd>
    <dt>Amount</dt><dd>${safe(args.outSum)} RUB</dd>
    <dt>Invoice</dt><dd><code>${safe(args.invId)}</code></dd>
    <dt>Signature</dt><dd><code>${safe(args.signature)}</code></dd>
  </dl>
  <form id="pay" method="post" action="/api/payments/robokassa/stub-confirm">
    <input type="hidden" name="OutSum" value="${safe(args.outSum)}"/>
    <input type="hidden" name="InvId" value="${safe(args.invId)}"/>
    <div class="row">
      <button type="submit" class="pay">Pay ${safe(args.outSum)} RUB</button>
      <a class="cancel" href="/api/payments/robokassa/fail?InvId=${encodeURIComponent(args.invId)}" style="display:flex;align-items:center;justify-content:center;text-decoration:none;border:1px solid #2a2622;border-radius:8px;padding:12px 14px;">Cancel</a>
    </div>
  </form>
</main>
</body></html>`;
}
