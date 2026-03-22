import { Module } from '@nestjs/common';
import { OrdersServiceController } from './orders-service.controller';
import { OrdersServiceService } from './orders-service.service';

@Module({
  controllers: [OrdersServiceController],
  providers: [OrdersServiceService],
})
export class OrdersServiceModule {}
