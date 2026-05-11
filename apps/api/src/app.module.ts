import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AdminModule } from './admin/admin.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { AuthModule } from './auth/auth.module';
import { envSchema } from './config/env';
import { GrpcModule } from './grpc/grpc.module';
import { HealthModule } from './health/health.module';
import { OAuthModule } from './oauth/oauth.module';
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
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 5 },    // 5 req/sec
      { name: 'medium', ttl: 10000, limit: 30 },  // 30 req/10sec
      { name: 'long', ttl: 60000, limit: 100 },   // 100 req/min
    ]),
    PrismaModule,
    QueueModule,
    AuthModule,
    OAuthModule,
    UsersModule,
    SubscriptionsModule,
    PaymentsModule,
    ApiKeysModule,
    AdminModule,
    GrpcModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
