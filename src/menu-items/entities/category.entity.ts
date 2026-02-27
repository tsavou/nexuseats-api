import { ApiProperty } from '@nestjs/swagger';

export class CategoryEntity {
  @ApiProperty({
    description: 'Identifiant unique de la catégorie',
    example: '9ec7f32f-f6e8-4091-a822-741fba76d92b',
  })
  id: string;

  @ApiProperty({
    description: 'Nom unique de la catégorie',
    example: 'Pizza',
  })
  name: string;
}
