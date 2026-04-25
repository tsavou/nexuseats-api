import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AnalyticsServiceModule } from './analytics-service.module';

async function bootstrap() {
  const logger = new Logger('AnalyticsBootstrap');
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AnalyticsServiceModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [
          process.env.RABBITMQ_URL ?? 'amqp://nexuseats:secret@localhost:5672',
        ],
        queue: 'analytics_queue',
        queueOptions: {
          durable: true,
        },
        exchange: 'orders.events',
        exchangeType: 'fanout',
        persistent: true,
      },
    },
  );

  await app.listen();
  logger.log(
    `Analytics Service listening to orders.events on process ${process.pid}`,
  );
}

void bootstrap();
