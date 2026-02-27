import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryEntity } from './category.entity';

export class MenuItemEntity {
  @ApiProperty({
    description: "Identifiant unique de l'item",
    example: '2f7c14a4-1092-43a4-9b8d-2c72289a7f77',
  })
  id: string;

  @ApiProperty({
    description: "Nom de l'item",
    example: 'Pizza Margherita',
  })
  name: string;

  @ApiProperty({
    description: 'Prix TTC de l’item',
    example: '12.50',
  })
  price: string;

  @ApiProperty({
    description: 'Disponibilité de l’item',
    example: true,
  })
  available: boolean;

  @ApiProperty({
    description: 'UUID du menu parent',
    example: '3a94c616-2331-4d9f-a0fe-62a77f0915ff',
  })
  menuId: string;

  @ApiPropertyOptional({
    description: 'Catégories liées à l’item',
    type: [CategoryEntity],
  })
  categories?: CategoryEntity[];
}
