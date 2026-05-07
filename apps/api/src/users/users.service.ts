import { Injectable, NotFoundException } from '@nestjs/common';
import type { UpdateProfileInput } from '@sepaito/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        locale: true,
        role: true,
        emailVerifiedAt: true,
        defaultThemeId: true,
        defaultModelId: true,
        createdAt: true,
        updatedAt: true,
        subscriptions: {
          where: { status: { in: ['TRIALING', 'ACTIVE', 'PAST_DUE'] } },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { plan: true },
        },
        devices: { orderBy: { lastSeenAt: 'desc' } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        name: input.name,
        locale: input.locale,
        defaultThemeId: input.defaultThemeId ?? undefined,
        defaultModelId: input.defaultModelId ?? undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        locale: true,
        role: true,
        emailVerifiedAt: true,
        defaultThemeId: true,
        defaultModelId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async listSessions(userId: string) {
    return this.prisma.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { lastSeenAt: 'desc' },
    });
  }

  async revokeSession(userId: string, sessionId: string) {
    await this.prisma.session.updateMany({
      where: { id: sessionId, userId },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }
}
