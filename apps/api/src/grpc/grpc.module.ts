import { Module } from '@nestjs/common';
import { IdeSubscriptionController } from './ide-subscription.controller';

@Module({
  controllers: [IdeSubscriptionController],
})
export class GrpcModule {}
