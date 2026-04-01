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

type SimpleOrderEvent = {
  orderId: string;
  timestamp: string;
};

@Controller()
export class NotificationsServiceController {
  private readonly logger = new Logger(NotificationsServiceController.name);

  @EventPattern('order.created')
  handleOrderCreated(@Payload() event: OrderCreatedEvent) {
    this.logger.log(
      `Email envoye : Commande #${event.orderId} confirmee (${event.customerEmail ?? 'client inconnu'})`,
    );
  }

  @EventPattern('payment.confirmed')
  handlePaymentConfirmed(@Payload() event: SimpleOrderEvent) {
    this.logger.log(`Email envoye : Paiement #${event.orderId} recu`);
  }

  @EventPattern('order.delivered')
  handleOrderDelivered(@Payload() event: SimpleOrderEvent) {
    this.logger.log(`Email envoye : Commande #${event.orderId} livree`);
  }
}
