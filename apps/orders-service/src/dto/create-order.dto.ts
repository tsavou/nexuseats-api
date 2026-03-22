export class CreateOrderDto {
  customerName!: string;
  items!: Array<{
    menuItemId: string;
    quantity: number;
  }>;
  totalAmount!: number;
}
