import { createHash, randomBytes } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, name: string) {
    // sep_live_xxxxxxxxxxxxxxxx — 32 url-safe random chars
    const random = randomBytes(24).toString('base64url');
    const raw = `sep_live_${random}`;
    const keyHash = createHash('sha256').update(raw).digest('hex');
    const keyPrefix = raw.slice(0, 12); // "sep_live_xxx"

    const key = await this.prisma.apiKey.create({
      data: { userId, name: name.slice(0, 80), keyHash, keyPrefix, scopes: ['ide:read'] },
    });

    // raw is shown once and only once
    return { id: key.id, name: key.name, prefix: key.keyPrefix, raw, createdAt: key.createdAt };
  }

  async list(userId: string) {
    return this.prisma.apiKey.findMany({
      where: { userId, revokedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        lastUsedAt: true,
        createdAt: true,
        scopes: true,
      },
    });
  }

  async revoke(userId: string, id: string) {
    const key = await this.prisma.apiKey.findFirst({ where: { id, userId } });
    if (!key) throw new NotFoundException('Key not found');
    await this.prisma.apiKey.update({ where: { id }, data: { revokedAt: new Date() } });
    return { ok: true };
  }
}
