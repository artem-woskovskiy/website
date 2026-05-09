// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type {} from '@fastify/cookie';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import {
  performPasswordResetSchema,
  requestPasswordResetSchema,
  signInSchema,
  signUpSchema,
  verifyEmailSchema,
} from '@sepaito/shared';
import type {
  PerformPasswordResetInput,
  RequestPasswordResetInput,
  SignInInput,
  SignUpInput,
  VerifyEmailInput,
} from '@sepaito/shared';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { type AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SameOriginGuard } from '../common/guards/same-origin.guard';
import { Throttle } from '../common/guards/throttle.guard';
import { ZodValidationPipe } from '../common/pipes/zod.pipe';
import { AuthService } from './auth.service';

const SignInThrottle = Throttle({ scope: 'auth.sign-in', windowMs: 60_000, max: 8 });
const SignUpThrottle = Throttle({ scope: 'auth.sign-up', windowMs: 60_000, max: 5 });
const ForgotThrottle = Throttle({ scope: 'auth.forgot', windowMs: 60_000, max: 5 });
const ResetThrottle = Throttle({ scope: 'auth.reset', windowMs: 60_000, max: 8 });

const REFRESH_COOKIE = 'sep_rt';
const ACCESS_COOKIE = 'sep_at';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('sign-up')
  @UseGuards(SignUpThrottle)
  @UsePipes(new ZodValidationPipe(signUpSchema))
  async signUp(
    @Body() body: SignUpInput,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const result = await this.auth.register(body, ctxFromReq(req));
    setSessionCookies(res, result.accessToken, result.refreshToken);
    return { user: result.user };
  }

  @Post('sign-in')
  @HttpCode(200)
  @UseGuards(SignInThrottle)
  @UsePipes(new ZodValidationPipe(signInSchema))
  async signIn(
    @Body() body: SignInInput,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const result = await this.auth.login(body, ctxFromReq(req));
    setSessionCookies(res, result.accessToken, result.refreshToken);
    return { user: result.user };
  }

  @Post('sign-out')
  @HttpCode(204)
  @UseGuards(SameOriginGuard)
  async signOut(@Req() req: FastifyRequest, @Res({ passthrough: true }) res: FastifyReply) {
    const rt = (req as unknown as { cookies?: Record<string, string> }).cookies?.[REFRESH_COOKIE];
    if (rt) await this.auth.logout(rt);
    clearSessionCookies(res);
  }

  @Post('refresh')
  @HttpCode(200)
  @UseGuards(SameOriginGuard)
  async refresh(@Req() req: FastifyRequest, @Res({ passthrough: true }) res: FastifyReply) {
    const rt = (req as unknown as { cookies?: Record<string, string> }).cookies?.[REFRESH_COOKIE];
    if (!rt) return { user: null };
    const result = await this.auth.refresh(rt, ctxFromReq(req));
    setSessionCookies(res, result.accessToken, result.refreshToken);
    return { user: result.user };
  }

  @Post('verify-email')
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(verifyEmailSchema))
  async verifyEmail(@Body() body: VerifyEmailInput) {
    return this.auth.verifyEmail(body);
  }

  @Post('forgot-password')
  @HttpCode(200)
  @UseGuards(ForgotThrottle)
  @UsePipes(new ZodValidationPipe(requestPasswordResetSchema))
  async forgot(@Body() body: RequestPasswordResetInput) {
    return this.auth.requestPasswordReset(body);
  }

  @Post('reset-password')
  @HttpCode(200)
  @UseGuards(ResetThrottle)
  @UsePipes(new ZodValidationPipe(performPasswordResetSchema))
  async reset(@Body() body: PerformPasswordResetInput) {
    return this.auth.performPasswordReset(body);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: AuthUser) {
    return this.auth.getMe(user.id);
  }
}

function ctxFromReq(req: FastifyRequest) {
  const ip =
    (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ?? req.ip;
  const userAgent = (req.headers['user-agent'] as string | undefined) ?? null;
  return { ip: ip ?? undefined, userAgent: userAgent ?? undefined };
}

function setSessionCookies(res: FastifyReply, accessToken: string, refreshToken: string) {
  const isProd = process.env.NODE_ENV === 'production';
  // 15 min access, 30 day refresh.
  // sameSite=strict on the refresh token: it is only ever sent by our own
  // /auth/refresh fetch and never needs to survive a cross-site navigation.
  // Access token stays sameSite=lax so links from email/IDE landings still work.
  res.setCookie(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 15,
  });
  res.setCookie(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

function clearSessionCookies(res: FastifyReply) {
  res.clearCookie(ACCESS_COOKIE, { path: '/' });
  res.clearCookie(REFRESH_COOKIE, { path: '/' });
}
