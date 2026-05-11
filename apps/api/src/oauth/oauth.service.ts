import { createHash, randomBytes } from 'node:crypto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Role } from '@sepaito/db';
import type { OAuthScope, OAuthTokenResponse } from '@sepaito/shared';
import { TokensService } from '../auth/tokens.service';
import { PrismaService } from '../prisma/prisma.service';
import { verifyPkceS256 } from './pkce';

// Authorization codes are short-lived per RFC 6749 §4.1.2 — must be expired
// after one minute. We stretch to 5 to tolerate slow OS deep-link prompts.
const AUTH_CODE_TTL_SECONDS = 5 * 60;

// IDE / CLI sessions live longer than browser sessions so users do not
// have to re-authorise every month. 90 days matches GitHub Desktop and
// VS Code Settings Sync conventions.
const OAUTH_REFRESH_TTL_DAYS = 90;
const ACCESS_TTL_SECONDS = 15 * 60;

type Ctx = { ip?: string; userAgent?: string };

@Injectable()
export class OAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokensService,
    private readonly config: ConfigService,
  ) {}

  // -------------------- authorization_code --------------------

  async exchangeAuthorizationCode(input: {
    code: string;
    codeVerifier: string;
    clientId: string;
    redirectUri: string;
    ctx: Ctx;
  }): Promise<OAuthTokenResponse> {
    const codeHash = createHash('sha256').update(input.code).digest('hex');
    const authz = await this.prisma.deviceAuthorization.findUnique({
      where: { codeHash },
      include: { user: true, oauthClient: true },
    });

    // Always raise the same "invalid_grant" so attackers can't tell the
    // difference between "unknown code" and "consumed code".
    if (!authz) throw new BadRequestException({ error: 'invalid_grant' });
    if (authz.status !== 'APPROVED') {
      throw new BadRequestException({ error: 'invalid_grant' });
    }
    if (authz.expiresAt.getTime() < Date.now()) {
      await this.prisma.deviceAuthorization.update({
        where: { id: authz.id },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException({ error: 'invalid_grant' });
    }
    if (authz.clientId !== input.clientId) {
      throw new BadRequestException({ error: 'invalid_grant' });
    }
    if (authz.redirectUri !== input.redirectUri) {
      throw new BadRequestException({ error: 'invalid_grant' });
    }
    if (!authz.user) {
      throw new BadRequestException({ error: 'invalid_grant' });
    }
    if (!authz.user.emailVerifiedAt) {
      throw new ForbiddenException({ error: 'email_not_verified' });
    }
    if (authz.codeChallengeMethod !== 'S256') {
      throw new BadRequestException({ error: 'invalid_grant' });
    }
    if (!verifyPkceS256(input.codeVerifier, authz.codeChallenge)) {
      throw new BadRequestException({ error: 'invalid_grant' });
    }

    // Burn the code before issuing tokens. If anything below throws we still
    // refuse to honour the same code twice.
    await this.prisma.deviceAuthorization.update({
      where: { id: authz.id },
      data: { status: 'CONSUMED', consumedAt: new Date() },
    });

    const { accessToken, refreshToken, session } = await this.issueOauthSession({
      userId: authz.user.id,
      email: authz.user.email,
      role: authz.user.role as Role,
      clientId: authz.clientId,
      scope: authz.scope as OAuthScope[],
      deviceName: authz.deviceName,
      platform: authz.platform,
      geoCountry: authz.geoCountry,
      ctx: input.ctx,
    });

    await this.prisma.auditLog.create({
      data: {
        userId: authz.user.id,
        actorEmail: authz.user.email,
        action: 'oauth.device.authorized',
        entityType: 'Session',
        entityId: session.id,
        ip: input.ctx.ip ?? null,
        userAgent: input.ctx.userAgent ?? null,
        metadata: {
          clientId: authz.clientId,
          scope: authz.scope,
          deviceName: authz.deviceName,
          platform: authz.platform,
        },
      },
    });

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: ACCESS_TTL_SECONDS,
      refresh_token: refreshToken,
      scope: authz.scope.join(' '),
      user: {
        id: authz.user.id,
        email: authz.user.email,
        name: authz.user.name,
        role: authz.user.role as Role,
      },
    };
  }

  // -------------------- refresh_token --------------------

  async exchangeRefreshToken(input: {
    refreshToken: string;
    clientId: string;
    ctx: Ctx;
  }): Promise<OAuthTokenResponse> {
    const refreshHash = this.tokens.hashOpaque(input.refreshToken);
    const session = await this.prisma.session.findUnique({
      where: { refreshTokenHash: refreshHash },
      include: { user: true },
    });

    if (!session || session.revokedAt || session.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException({ error: 'invalid_grant' });
    }
    if (session.clientId !== input.clientId) {
      // Browser refresh tokens MUST NOT be exchangeable on the OAuth endpoint.
      throw new UnauthorizedException({ error: 'invalid_grant' });
    }

    // Rotate: revoke the presented token, mint a fresh pair on the same client.
    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    const issued = await this.issueOauthSession({
      userId: session.user.id,
      email: session.user.email,
      role: session.user.role as Role,
      clientId: session.clientId,
      scope: session.scope as OAuthScope[],
      deviceName: session.deviceName,
      platform: session.platform,
      geoCountry: session.geoCountry,
      ctx: input.ctx,
    });

    return {
      access_token: issued.accessToken,
      token_type: 'Bearer',
      expires_in: ACCESS_TTL_SECONDS,
      refresh_token: issued.refreshToken,
      scope: (session.scope as string[]).join(' '),
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role as Role,
      },
    };
  }

  // -------------------- revoke --------------------

  async revoke(input: {
    clientId: string;
    token: string;
    tokenTypeHint?: 'access_token' | 'refresh_token';
    ctx: Ctx;
  }): Promise<void> {
    // Per RFC 7009 we MUST return 200 whether or not the token existed.
    // We still log the attempt for audit.
    const refreshHash = this.tokens.hashOpaque(input.token);
    const session = await this.prisma.session.findUnique({
      where: { refreshTokenHash: refreshHash },
    });
    if (!session || session.clientId !== input.clientId) return;
    if (session.revokedAt) return;

    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'oauth.device.revoked',
        entityType: 'Session',
        entityId: session.id,
        ip: input.ctx.ip ?? null,
        userAgent: input.ctx.userAgent ?? null,
        metadata: { clientId: session.clientId, by: 'client' },
      },
    });
  }

  // -------------------- helpers --------------------

  /**
   * Mint a `Session` row that doubles as the OAuth refresh token store
   * (refresh_token = `srt_<random>`, only the SHA-256 hash is persisted).
   */
  private async issueOauthSession(args: {
    userId: string;
    email: string;
    role: Role;
    clientId: string;
    scope: OAuthScope[];
    deviceName: string | null;
    platform: string | null;
    geoCountry: string | null;
    ctx: Ctx;
  }) {
    const refresh = this.tokens.newRefreshToken();
    const session = await this.prisma.session.create({
      data: {
        userId: args.userId,
        refreshTokenHash: refresh.hash,
        clientId: args.clientId,
        scope: args.scope,
        deviceName: args.deviceName,
        platform: args.platform,
        geoCountry: args.geoCountry,
        userAgent: args.ctx.userAgent ?? null,
        ip: args.ctx.ip ?? null,
        expiresAt: new Date(Date.now() + OAUTH_REFRESH_TTL_DAYS * 86400 * 1000),
      },
    });
    const accessToken = await this.tokens.signOauthAccess({
      sub: args.userId,
      email: args.email,
      role: args.role,
      clientId: args.clientId,
      scope: args.scope,
      sid: session.id,
    });
    return { accessToken, refreshToken: refresh.token, session };
  }

  // -------------------- introspection helper (used by the consent screen) --------------------

  /**
   * Loaded by /[locale]/oauth/authorize to decide whether to render the
   * consent UI at all. Returns null for unknown/inactive clients.
   */
  async lookupClient(clientId: string) {
    const client = await this.prisma.oAuthClient.findUnique({
      where: { clientId },
    });
    if (!client || !client.isActive) return null;
    return client;
  }

  /**
   * Create a one-shot authorization code after the user clicks "Open" on
   * the consent screen. The plaintext `code` is returned ONCE and used to
   * build the deep-link redirect; only its SHA-256 hash is stored.
   *
   * Caller (web /oauth/authorize action) must have already:
   *  - validated the JWT cookie,
   *  - confirmed the user's email is verified,
   *  - intersected the requested scope with the client's allowedScopes.
   */
  async createAuthorization(input: {
    userId: string;
    clientId: string;
    redirectUri: string;
    scope: string[];
    codeChallenge: string;
    codeChallengeMethod: 'S256';
    deviceName: string | null;
    platform: string | null;
    ctx: Ctx & { geoCountry?: string | null };
  }): Promise<{ code: string }> {
    const client = await this.lookupClient(input.clientId);
    if (!client) throw new NotFoundException({ error: 'invalid_client' });
    if (!client.redirectUris.includes(input.redirectUri)) {
      throw new BadRequestException({ error: 'invalid_request', field: 'redirect_uri' });
    }
    if (client.requirePkce && input.codeChallengeMethod !== 'S256') {
      throw new BadRequestException({ error: 'invalid_request', field: 'code_challenge_method' });
    }
    const allowed = new Set(client.allowedScopes);
    const requestedScope = input.scope.filter((s) => allowed.has(s));
    if (requestedScope.length === 0) {
      throw new BadRequestException({ error: 'invalid_scope' });
    }

    const code = `dac_${randomBytes(32).toString('base64url')}`;
    const codeHash = createHash('sha256').update(code).digest('hex');
    await this.prisma.deviceAuthorization.create({
      data: {
        clientId: client.clientId,
        userId: input.userId,
        codeHash,
        codeChallenge: input.codeChallenge,
        codeChallengeMethod: input.codeChallengeMethod,
        redirectUri: input.redirectUri,
        scope: requestedScope,
        status: 'APPROVED',
        deviceName: input.deviceName,
        platform: input.platform,
        ip: input.ctx.ip ?? null,
        userAgent: input.ctx.userAgent ?? null,
        geoCountry: input.ctx.geoCountry ?? null,
        approvedAt: new Date(),
        expiresAt: new Date(Date.now() + AUTH_CODE_TTL_SECONDS * 1000),
      },
    });
    return { code };
  }

  /**
   * Returns the user's active OAuth sessions for /account/devices.
   */
  async listUserDevices(userId: string) {
    return this.prisma.session.findMany({
      where: {
        userId,
        clientId: { not: null },
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { oauthClient: true },
      orderBy: { lastSeenAt: 'desc' },
    });
  }

  async revokeUserSession(args: { userId: string; sessionId: string; ctx: Ctx }) {
    const session = await this.prisma.session.findUnique({
      where: { id: args.sessionId },
    });
    if (!session) throw new NotFoundException();
    if (session.userId !== args.userId) {
      // IDOR guard.
      throw new ForbiddenException();
    }
    if (session.revokedAt) return;
    await this.prisma.session.update({
      where: { id: args.sessionId },
      data: { revokedAt: new Date() },
    });
    await this.prisma.auditLog.create({
      data: {
        userId: args.userId,
        action: 'oauth.device.revoked',
        entityType: 'Session',
        entityId: session.id,
        ip: args.ctx.ip ?? null,
        userAgent: args.ctx.userAgent ?? null,
        metadata: { clientId: session.clientId, by: 'user' },
      },
    });
  }
}
