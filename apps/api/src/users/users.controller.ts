import { Body, Controller, Delete, Get, Param, Patch, UseGuards, UsePipes } from '@nestjs/common';
import { type UpdateProfileInput, updateProfileSchema } from '@sepaito/shared';
import { type AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod.pipe';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.users.getProfile(user.id);
  }

  @Patch('me')
  @UsePipes(new ZodValidationPipe(updateProfileSchema))
  update(@CurrentUser() user: AuthUser, @Body() body: UpdateProfileInput) {
    return this.users.updateProfile(user.id, body);
  }

  @Get('me/sessions')
  sessions(@CurrentUser() user: AuthUser) {
    return this.users.listSessions(user.id);
  }

  @Delete('me/sessions/:id')
  revoke(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.users.revokeSession(user.id, id);
  }
}
