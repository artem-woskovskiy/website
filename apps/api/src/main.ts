import 'reflect-metadata';
import { join } from 'node:path';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { type MicroserviceOptions, Transport } from '@nestjs/microservices';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false, trustProxy: true }),
    { bufferLogs: true },
  );

  const webOrigin = process.env.PUBLIC_WEB_URL ?? 'http://localhost:3000';
  await app.register(import('@fastify/cors' as never) as never, {
    origin: [webOrigin],
    credentials: true,
  });
  await app.register(import('@fastify/cookie' as never) as never);
  await app.register(import('@fastify/helmet' as never) as never, {
    contentSecurityPolicy: false, // handled by Next.js on the frontend
  });

  app.setGlobalPrefix('api', { exclude: ['/health', '/'] });
  // Validation is handled per-endpoint via ZodValidationPipe — no global pipe.

  // gRPC microservice for the IDE
  const grpcBind = process.env.GRPC_BIND ?? '0.0.0.0:50051';
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'sepaito',
      protoPath: join(__dirname, 'grpc/proto/sepaito.proto'),
      url: grpcBind,
    },
  });

  await app.startAllMicroservices();

  const port = Number(process.env.PORT ?? 4000);
  await app.listen({ port, host: '0.0.0.0' });

  Logger.log(`API listening on http://0.0.0.0:${port}`, 'Bootstrap');
  Logger.log(`gRPC listening on ${grpcBind}`, 'Bootstrap');
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
