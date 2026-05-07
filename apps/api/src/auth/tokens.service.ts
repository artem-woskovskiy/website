import { createHash, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Role } from '@sepaito/db';

@Injectable()
export class TokensService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async signAccess(payload: { sub: string; email: string; role: Role }): Promise<string> {
    return this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACCESS_TTL') ?? '15m',
    });
  }

  newRefreshToken(): { token: string; hash: string } {
    const token = `srt_${randomBytes(32).toString('base64url')}`;
    const hash = createHash('sha256').update(token).digest('hex');
    return { token, hash };
  }

  hashOpaque(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  newOpaqueToken(prefix = 'sov'): { token: string; hash: string } {
    const token = `${prefix}_${randomBytes(24).toString('base64url')}`;
    return { token, hash: this.hashOpaque(token) };
  }
}
