import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { OrdersServiceModule } from './orders-service.module';

async function bootstrap() {
  const logger = new Logger('OrdersServiceBootstrap');
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    OrdersServiceModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [
          process.env.RABBITMQ_URL ?? 'amqp://nexuseats:secret@localhost:5672',
        ],
        queue: 'orders_queue',
        queueOptions: {
          durable: true,
        },
      },
    },
  );

  await app.listen();
  logger.log(`Orders Service listening via RabbitMQ on process ${process.pid}`);
}

void bootstrap();
