import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersServiceService } from './orders-service.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller()
export class OrdersServiceController {
  constructor(private readonly ordersService: OrdersServiceService) {}

  @MessagePattern({ cmd: 'create_order' })
  createOrder(@Payload() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @MessagePattern({ cmd: 'get_orders' })
  getOrders() {
    return this.ordersService.findAll();
  }

  @MessagePattern({ cmd: 'get_order_by_id' })
  getOrderById(@Payload() id: string) {
    return this.ordersService.findOne(id);
  }
}
