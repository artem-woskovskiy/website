import { type ExecutionContext, createParamDecorator } from '@nestjs/common';

export interface AuthUser {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const req = ctx.switchToHttp().getRequest<{ user?: AuthUser }>();
    if (!req.user) {
      throw new Error('CurrentUser used on an unauthenticated route');
    }
    return req.user;
  },
);
