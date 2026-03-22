import { ApiProperty } from '@nestjs/swagger';
import { CreateOrderItemDto } from './create-order.dto';

export class OrderResponseDto {
  @ApiProperty({
    description: 'UUID de la commande',
    example: '5b38d57c-d57e-4949-b3c8-4cbfca3143a6',
  })
  id!: string;

  @ApiProperty({
    description: 'Nom du client',
    example: 'John Doe',
  })
  customerName!: string;

  @ApiProperty({
    description: 'Items contenus dans la commande',
    type: CreateOrderItemDto,
    isArray: true,
  })
  items!: CreateOrderItemDto[];

  @ApiProperty({
    description: 'Montant total de la commande',
    example: 24.5,
  })
  totalAmount!: number;

  @ApiProperty({
    description: 'Date de création ISO 8601',
    example: '2026-03-22T22:15:00.000Z',
  })
  createdAt!: string;
}
