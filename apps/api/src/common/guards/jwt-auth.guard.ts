import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { FastifyRequest } from 'fastify';
import type { AuthUser } from '../decorators/current-user.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<FastifyRequest & { user?: AuthUser }>();
    const auth = req.headers.authorization;
    const cookieToken = (req as unknown as { cookies?: Record<string, string> }).cookies?.sep_at;
    const token = cookieToken ?? (auth?.startsWith('Bearer ') ? auth.slice(7) : undefined);
    if (!token) throw new UnauthorizedException('Missing access token');

    try {
      const payload = await this.jwt.verifyAsync<{
        sub: string;
        email: string;
        role: 'USER' | 'ADMIN';
      }>(token, { secret: this.config.get<string>('JWT_SECRET') });
      req.user = { id: payload.sub, email: payload.email, role: payload.role };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
