import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MenuItemEntity } from '../../menu-items/entities/menu-item.entity';

export class MenuEntity {
  @ApiProperty({
    description: 'Identifiant unique du menu',
    example: '3a94c616-2331-4d9f-a0fe-62a77f0915ff',
  })
  id: string;

  @ApiProperty({
    description: 'Nom du menu',
    example: 'Menu Midi',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Description du menu',
    example: 'Formule dejeuner italienne',
  })
  description?: string;

  @ApiProperty({
    description: 'UUID du restaurant parent',
    example: '11111111-1111-4111-8111-111111111111',
  })
  restaurantId: string;

  @ApiPropertyOptional({
    description: 'Items actifs du menu',
    type: [MenuItemEntity],
  })
  items?: MenuItemEntity[];
}
