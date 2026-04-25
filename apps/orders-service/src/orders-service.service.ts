import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { randomUUID } from 'crypto';
import { CreateOrderDto } from './dto/create-order.dto';

type OrderItem = {
  menuItemId: string;
  quantity: number;
};

type Order = {
  id: string;
  customerName: string;
  items: OrderItem[];
  totalAmount: number;
  createdAt: string;
};

@Injectable()
export class OrdersServiceService {
  private readonly logger = new Logger(OrdersServiceService.name);
  private readonly orders: Order[] = [];

  constructor(
    @Inject('ORDERS_EVENTS') private readonly ordersEventsClient: ClientProxy,
  ) {}

  create(dto: CreateOrderDto) {
    this.logger.log(
      `Received create_order for customer="${dto.customerName}" with ${dto.items.length} item(s)`,
    );

    const order: Order = {
      id: randomUUID(),
      customerName: dto.customerName,
      items: dto.items,
      totalAmount: dto.totalAmount,
      createdAt: new Date().toISOString(),
    };

    this.orders.push(order);
    this.logger.log(`Order created successfully with id=${order.id}`);
    this.ordersEventsClient.emit('order.created', {
      orderId: order.id,
      customerEmail: `${dto.customerName.toLowerCase().replace(/\s+/g, '.')}@nexus.test`,
      items: order.items,
      total: order.totalAmount,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`Event emitted: order.created for id=${order.id}`);
    return order;
  }

  findAll() {
    this.logger.log(
      `Received get_orders, returning ${this.orders.length} order(s)`,
    );
    return this.orders;
  }

  findOne(id: string) {
    this.logger.log(`Received get_order_by_id for id=${id}`);
    const order = this.orders.find((candidate) => candidate.id === id);

    if (!order) {
      this.logger.warn(`Order not found for id=${id}`);
      throw new NotFoundException(`Order ${id} not found`);
    }

    this.logger.log(`Order found for id=${id}`);
    return order;
  }
}
