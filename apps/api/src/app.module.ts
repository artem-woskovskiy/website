import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AdminModule } from './admin/admin.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { AuthModule } from './auth/auth.module';
import { envSchema } from './config/env';
import { GrpcModule } from './grpc/grpc.module';
import { HealthModule } from './health/health.module';
import { PaymentsModule } from './payments/payments.module';
import { PrismaModule } from './prisma/prisma.module';
import { QueueModule } from './queue/queue.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (raw) => envSchema.parse(raw),
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    QueueModule,
    AuthModule,
    UsersModule,
    SubscriptionsModule,
    PaymentsModule,
    ApiKeysModule,
    AdminModule,
    GrpcModule,
    HealthModule,
  ],
})
export class AppModule {}
