import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

type OrderCreatedEvent = {
  orderId: string;
  customerEmail?: string;
  items: Array<{
    menuItemId: string;
    quantity: number;
  }>;
  total: number;
  timestamp: string;
};

@Controller()
export class AnalyticsServiceController {
  private readonly logger = new Logger(AnalyticsServiceController.name);

  @EventPattern('order.created')
  handleOrderCreated(@Payload() event: OrderCreatedEvent) {
    this.logger.log(
      `Analytics recu : order.created #${event.orderId} total=${event.total}`,
    );
  }
}
