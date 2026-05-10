import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { oauthRevokeSchema, oauthTokenSchema } from '@sepaito/shared';
import type { FastifyRequest } from 'fastify';
import { z } from 'zod';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod.pipe';
import { OAuthService } from './oauth.service';

const authorizeBodySchema = z.object({
  client_id: z.enum(['ide-desktop', 'cli', 'vscode-ext']),
  redirect_uri: z.string().min(1),
  scope: z.array(z.string()).max(8),
  code_challenge: z
    .string()
    .min(43)
    .max(128)
    .regex(/^[A-Za-z0-9_-]+$/),
  code_challenge_method: z.literal('S256'),
  device_name: z.string().max(120).optional().nullable(),
  platform: z.string().max(60).optional().nullable(),
});

@Controller('oauth')
export class OAuthController {
  constructor(private readonly oauth: OAuthService) {}

  // -------------------- web-facing endpoints (cookie/JWT) --------------------

  /**
   * Public client metadata. Loaded by the consent page so the website can
   * show the human name and icon. Returns 404 for unknown/inactive clients.
   */
  @Get('clients/:clientId')
  async client(@Param('clientId') clientId: string) {
    const client = await this.oauth.lookupClient(clientId);
    if (!client) throw new NotFoundException({ error: 'invalid_client' });
    return {
      clientId: client.clientId,
      name: client.name,
      description: client.description,
      iconUrl: client.iconUrl,
      redirectUris: client.redirectUris,
      allowedScopes: client.allowedScopes,
      requirePkce: client.requirePkce,
    };
  }

  /**
   * Called by the website's consent page when the user clicks "Open".
   * Requires a logged-in browser session. The returned `code` is built into
   * the deep-link redirect on the website (never sent to the IDE directly).
   */
  @Post('authorize')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async authorize(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(authorizeBodySchema))
    body: z.infer<typeof authorizeBodySchema>,
    @Req() req: FastifyRequest,
  ) {
    return this.oauth.createAuthorization({
      userId: user.id,
      clientId: body.client_id,
      redirectUri: body.redirect_uri,
      scope: body.scope,
      codeChallenge: body.code_challenge,
      codeChallengeMethod: body.code_challenge_method,
      deviceName: body.device_name ?? null,
      platform: body.platform ?? null,
      ctx: ctxFromReq(req),
    });
  }

  /**
   * List active device sessions for the logged-in user. Rendered on
   * /account/devices.
   */
  @Get('devices')
  @UseGuards(JwtAuthGuard)
  async devices(@CurrentUser() user: AuthUser) {
    const list = await this.oauth.listUserDevices(user.id);
    return list.map((s) => ({
      id: s.id,
      clientId: s.clientId,
      clientName: s.oauthClient?.name ?? s.clientId,
      deviceName: s.deviceName,
      platform: s.platform,
      ip: s.ip,
      geoCountry: s.geoCountry,
      userAgent: s.userAgent,
      scope: s.scope,
      lastSeenAt: s.lastSeenAt?.toISOString() ?? null,
      createdAt: s.createdAt.toISOString(),
      expiresAt: s.expiresAt.toISOString(),
    }));
  }

  @Delete('devices/:sessionId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async revokeDevice(
    @CurrentUser() user: AuthUser,
    @Param('sessionId') sessionId: string,
    @Req() req: FastifyRequest,
  ) {
    await this.oauth.revokeUserSession({
      userId: user.id,
      sessionId,
      ctx: ctxFromReq(req),
    });
  }

  // -------------------- IDE-facing endpoints (no cookies) --------------------

  /**
   * RFC 6749 §4.1.3 token endpoint. Implements two grant types:
   *  - `authorization_code` (PKCE-protected, after user clicks "Open" on the consent screen)
   *  - `refresh_token`     (rotates the long-lived OAuth refresh token)
   *
   * Returned shape matches RFC 6749 §5.1 (lowercased + underscored field names).
   */
  @Post('token')
  @HttpCode(200)
  async token(
    @Body(new ZodValidationPipe(oauthTokenSchema))
    body: { grant_type: 'authorization_code' | 'refresh_token' } & Record<string, unknown>,
    @Req() req: FastifyRequest,
  ) {
    const ctx = ctxFromReq(req);
    if (body.grant_type === 'authorization_code') {
      const b = body as {
        grant_type: 'authorization_code';
        client_id: string;
        code: string;
        code_verifier: string;
        redirect_uri: string;
      };
      return this.oauth.exchangeAuthorizationCode({
        code: b.code,
        codeVerifier: b.code_verifier,
        clientId: b.client_id,
        redirectUri: b.redirect_uri,
        ctx,
      });
    }
    const b = body as {
      grant_type: 'refresh_token';
      client_id: string;
      refresh_token: string;
    };
    return this.oauth.exchangeRefreshToken({
      refreshToken: b.refresh_token,
      clientId: b.client_id,
      ctx,
    });
  }

  /**
   * RFC 7009 token revocation. Always returns 200 — the endpoint MUST NOT
   * tell the caller whether the token was valid (prevents enumeration).
   */
  @Post('revoke')
  @HttpCode(200)
  async revoke(
    @Body(new ZodValidationPipe(oauthRevokeSchema))
    body: {
      client_id: string;
      token: string;
      token_type_hint?: 'access_token' | 'refresh_token';
    },
    @Req() req: FastifyRequest,
  ) {
    await this.oauth.revoke({
      clientId: body.client_id,
      token: body.token,
      tokenTypeHint: body.token_type_hint,
      ctx: ctxFromReq(req),
    });
    return { ok: true };
  }
}

function ctxFromReq(req: FastifyRequest) {
  const ip =
    (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ?? req.ip;
  const userAgent = (req.headers['user-agent'] as string | undefined) ?? null;
  return { ip: ip ?? undefined, userAgent: userAgent ?? undefined };
}
