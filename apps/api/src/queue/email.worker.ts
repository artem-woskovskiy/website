import {
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type Job, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { REDIS } from './queue.tokens';

interface VerifyJob {
  to: string;
  token: string;
  name: string;
}
interface ResetJob {
  to: string;
  token: string;
  name: string;
}

/**
 * Tiny dev worker that prints email payloads to the log. In production, swap
 * for a Resend transport — same job names, same payloads.
 */
@Injectable()
export class EmailWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmailWorker.name);
  private worker?: Worker;

  constructor(
    @Inject(REDIS) private readonly connection: IORedis,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    this.worker = new Worker(
      'email',
      async (job: Job<VerifyJob | ResetJob>) => {
        const webUrl = this.config.get<string>('PUBLIC_WEB_URL', 'http://localhost:3000');
        if (job.name === 'verify') {
          const data = job.data as VerifyJob;
          this.logger.log(`📧 [verify] to=${data.to} link=${webUrl}/verify?token=${data.token}`);
        } else if (job.name === 'reset') {
          const data = job.data as ResetJob;
          this.logger.log(
            `📧 [reset] to=${data.to} link=${webUrl}/reset-password?token=${data.token}`,
          );
        } else {
          this.logger.warn(`unknown email job ${job.name}`);
        }
      },
      { connection: this.connection.duplicate(), concurrency: 5 },
    );
    this.worker.on('failed', (job, err) =>
      this.logger.error(`email job ${job?.id} failed: ${err.message}`),
    );
  }

  async onModuleDestroy() {
    await this.worker?.close();
  }
}
