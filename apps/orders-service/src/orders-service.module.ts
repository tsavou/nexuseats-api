import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { OrdersServiceController } from './orders-service.controller';
import { OrdersServiceService } from './orders-service.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'ORDERS_EVENTS',
        transport: Transport.RMQ,
        options: {
          urls: [
            process.env.RABBITMQ_URL ??
              'amqp://nexuseats:secret@localhost:5672',
          ],
          queue: 'orders_events_publisher',
          queueOptions: {
            durable: false,
          },
          exchange: 'orders.events',
          exchangeType: 'fanout',
          persistent: true,
        },
      },
    ]),
  ],
  controllers: [OrdersServiceController],
  providers: [OrdersServiceService],
})
export class OrdersServiceModule {}
