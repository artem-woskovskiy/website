import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminGuard } from '../common/guards/admin.guard';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { AdminController } from './admin.controller';

@Module({
  imports: [AuthModule, SubscriptionsModule],
  controllers: [AdminController],
  providers: [AdminGuard],
})
export class AdminModule {}
