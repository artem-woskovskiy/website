import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { type AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SubscriptionsService } from './subscriptions.service';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subs: SubscriptionsService) {}

  @Get('plans')
  plans() {
    return this.subs.listPlans();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthUser) {
    return this.subs.getCurrent(user.id);
  }

  @Post('me/cancel')
  @UseGuards(JwtAuthGuard)
  cancel(@CurrentUser() user: AuthUser) {
    return this.subs.cancelAtPeriodEnd(user.id);
  }
}
