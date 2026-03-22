import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { OrdersGatewayController } from './orders-gateway.controller';
import { OrdersGatewayService } from './orders-gateway.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'ORDERS_SERVICE',
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
    ]),
  ],
  controllers: [OrdersGatewayController],
  providers: [OrdersGatewayService],
})
export class OrdersGatewayModule {}
