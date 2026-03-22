import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersGatewayService {
  constructor(
    @Inject('ORDERS_SERVICE') private readonly ordersClient: ClientProxy,
  ) {}

  createOrder(dto: CreateOrderDto) {
    return firstValueFrom(
      this.ordersClient.send({ cmd: 'create_order' }, dto).pipe(timeout(3000)),
    );
  }

  getOrders() {
    return firstValueFrom(
      this.ordersClient.send({ cmd: 'get_orders' }, {}).pipe(timeout(3000)),
    );
  }

  getOrderById(id: string) {
    return firstValueFrom(
      this.ordersClient
        .send({ cmd: 'get_order_by_id' }, id)
        .pipe(timeout(3000)),
    );
  }
}
