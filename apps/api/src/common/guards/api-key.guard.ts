import { createHash } from 'node:crypto';
import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { PrismaService } from '../../prisma/prisma.service';

export interface ApiKeyAuth {
  userId: string;
  apiKeyId: string;
}

/**
 * Used by the IDE app's REST endpoints. Header: `Authorization: Bearer sep_live_xxx`
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<FastifyRequest & { apiKey?: ApiKeyAuth }>();
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException('Missing API key');
    const raw = auth.slice(7);
    const keyHash = createHash('sha256').update(raw, 'utf8').digest('hex');
    const apiKey = await this.prisma.apiKey.findUnique({ where: { keyHash } });
    if (!apiKey || apiKey.revokedAt) throw new UnauthorizedException('Invalid API key');
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      throw new UnauthorizedException('API key expired');
    }
    await this.prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } });
    req.apiKey = { userId: apiKey.userId, apiKeyId: apiKey.id };
    return true;
  }
}
