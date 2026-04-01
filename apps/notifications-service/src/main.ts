import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { NotificationsServiceModule } from './notifications-service.module';

async function bootstrap() {
  const logger = new Logger('NotificationsBootstrap');
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    NotificationsServiceModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [
          process.env.RABBITMQ_URL ??
            'amqp://nexuseats:secret@localhost:5672',
        ],
        queue: 'notifications_queue',
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
    `Notifications Service listening to orders.events on process ${process.pid}`,
  );
}

void bootstrap();
