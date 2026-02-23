import { ApiProperty } from '@nestjs/swagger';

export class Restaurant {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', description: 'ID unique du restaurant' })
  id: string;

  @ApiProperty({ example: 'La Bella Italia', description: 'Nom du restaurant' })
  name: string;

  @ApiProperty({ example: 'italienne', description: 'Type de cuisine' })
  cuisineType?: string;
  
  @ApiProperty({ example: 'ITALIEN', description: 'Type de cuisine (enum)' })
  cuisine?: string;

  @ApiProperty({ example: 4.2, description: 'Note du restaurant' })
  rating: number;

  @ApiProperty({ example: 25, description: 'Prix moyen', required: false })
  averagePrice?: number;
}
