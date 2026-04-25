import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderItemDto {
  @ApiProperty({
    description: "UUID de l'item commandé",
    example: '11111111-1111-4111-8111-111111111111',
  })
  @IsUUID()
  menuItemId!: string;

  @ApiProperty({
    description: 'Quantité commandée pour cet item',
    example: 2,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  quantity!: number;
}

export class CreateOrderDto {
  @ApiProperty({
    description: 'Nom du client',
    example: 'John Doe',
  })
  @IsString()
  customerName!: string;

  @ApiProperty({
    description: 'Liste des items de la commande',
    type: CreateOrderItemDto,
    isArray: true,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @ApiProperty({
    description: 'Montant total de la commande',
    example: 24.5,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  totalAmount!: number;
}
