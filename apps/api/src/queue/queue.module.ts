import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { EmailWorker } from './email.worker';
import { EMAIL_QUEUE, REDIS } from './queue.tokens';

export { EMAIL_QUEUE, REDIS };

@Global()
@Module({
  providers: [
    {
      provide: REDIS,
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
        return new IORedis(url, { maxRetriesPerRequest: null });
      },
      inject: [ConfigService],
    },
    {
      provide: EMAIL_QUEUE,
      useFactory: (connection: IORedis) =>
        new Queue('email', {
          connection,
          defaultJobOptions: { attempts: 5, backoff: { type: 'exponential', delay: 5000 } },
        }),
      inject: [REDIS],
    },
    EmailWorker,
  ],
  exports: [REDIS, EMAIL_QUEUE],
})
export class QueueModule {}
