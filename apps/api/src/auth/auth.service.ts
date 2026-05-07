import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Role } from '@sepaito/db';
import type {
  PerformPasswordResetInput,
  RequestPasswordResetInput,
  SignInInput,
  SignUpInput,
  VerifyEmailInput,
} from '@sepaito/shared';
import type { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { EMAIL_QUEUE } from '../queue/queue.tokens';
import { PasswordService } from './password.service';
import { TokensService } from './tokens.service';

const REFRESH_TTL_DAYS = 30;
const VERIFY_TTL_HOURS = 24;
const RESET_TTL_MINUTES = 30;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly tokens: TokensService,
    private readonly config: ConfigService,
    @Inject(EMAIL_QUEUE) private readonly emails: Queue,
  ) {}

  async register(input: SignUpInput, ctx: { ip?: string; userAgent?: string }) {
    const exists = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (exists) throw new ConflictException('Email already in use');

    const passwordHash = await this.passwords.hash(input.password);
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash,
      },
    });

    const verify = this.tokens.newOpaqueToken('sev');
    await this.prisma.verificationToken.create({
      data: {
        userId: user.id,
        tokenHash: verify.hash,
        purpose: 'email-verify',
        expiresAt: new Date(Date.now() + VERIFY_TTL_HOURS * 3600 * 1000),
      },
    });

    await this.emails.add('verify', {
      to: user.email,
      token: verify.token,
      name: user.name ?? user.email,
    });

    const session = await this.issueSession(user.id, ctx);
    return { user: this.publicUser(user), ...session };
  }

  async login(input: SignInInput, ctx: { ip?: string; userAgent?: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !user.passwordHash) throw new UnauthorizedException('Invalid credentials');
    const ok = await this.passwords.verify(user.passwordHash, input.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const session = await this.issueSession(user.id, ctx);
    return { user: this.publicUser(user), ...session };
  }

  async logout(refreshToken: string) {
    const hash = this.tokens.hashOpaque(refreshToken);
    await this.prisma.session.updateMany({
      where: { refreshTokenHash: hash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async refresh(refreshToken: string, ctx: { ip?: string; userAgent?: string }) {
    const hash = this.tokens.hashOpaque(refreshToken);
    const session = await this.prisma.session.findUnique({
      where: { refreshTokenHash: hash },
      include: { user: true },
    });
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session expired');
    }
    // rotate
    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });
    const issued = await this.issueSession(session.userId, ctx);
    return { user: this.publicUser(session.user), ...issued };
  }

  async verifyEmail(input: VerifyEmailInput) {
    const hash = this.tokens.hashOpaque(input.token);
    const t = await this.prisma.verificationToken.findUnique({ where: { tokenHash: hash } });
    if (!t || t.consumedAt || t.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired verification token');
    }
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: t.userId }, data: { emailVerifiedAt: new Date() } }),
      this.prisma.verificationToken.update({
        where: { tokenHash: hash },
        data: { consumedAt: new Date() },
      }),
    ]);
    return { ok: true };
  }

  async requestPasswordReset(input: RequestPasswordResetInput) {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (!user) {
      // do not leak existence; return ok
      return { ok: true };
    }
    const t = this.tokens.newOpaqueToken('spr');
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: t.hash,
        expiresAt: new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000),
      },
    });
    await this.emails.add('reset', {
      to: user.email,
      token: t.token,
      name: user.name ?? user.email,
    });
    return { ok: true };
  }

  async performPasswordReset(input: PerformPasswordResetInput) {
    const hash = this.tokens.hashOpaque(input.token);
    const t = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash: hash } });
    if (!t || t.consumedAt || t.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }
    const passwordHash = await this.passwords.hash(input.password);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: t.userId }, data: { passwordHash } }),
      this.prisma.passwordResetToken.update({
        where: { tokenHash: hash },
        data: { consumedAt: new Date() },
      }),
      this.prisma.session.updateMany({
        where: { userId: t.userId },
        data: { revokedAt: new Date() },
      }),
    ]);
    return { ok: true };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return this.publicUser(user);
  }

  // -----

  private async issueSession(userId: string, ctx: { ip?: string; userAgent?: string }) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const accessToken = await this.tokens.signAccess({
      sub: user.id,
      email: user.email,
      role: user.role as Role,
    });
    const refresh = this.tokens.newRefreshToken();
    await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: refresh.hash,
        userAgent: ctx.userAgent ?? null,
        ip: ctx.ip ?? null,
        expiresAt: new Date(Date.now() + REFRESH_TTL_DAYS * 86400 * 1000),
      },
    });
    return { accessToken, refreshToken: refresh.token };
  }

  private publicUser(user: {
    id: string;
    email: string;
    name: string | null;
    role: Role;
    emailVerifiedAt: Date | null;
    locale: 'EN' | 'RU';
  }) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerifiedAt: user.emailVerifiedAt,
      locale: user.locale,
    };
  }
}
