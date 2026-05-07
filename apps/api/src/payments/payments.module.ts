import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PAYMENT_PROVIDER } from './payments.tokens';
import { RobokassaStubProvider } from './providers/robokassa-stub.provider';

export { PAYMENT_PROVIDER };

@Module({
  imports: [AuthModule, SubscriptionsModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    RobokassaStubProvider,
    {
      provide: PAYMENT_PROVIDER,
      useExisting: RobokassaStubProvider,
    },
  ],
  exports: [PaymentsService, PAYMENT_PROVIDER],
})
export class PaymentsModule {}
