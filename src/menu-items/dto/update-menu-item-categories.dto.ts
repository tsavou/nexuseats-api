import { ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsOptional, IsUUID } from 'class-validator';

export class UpdateMenuItemCategoriesDto {
  @ApiPropertyOptional({
    description: 'IDs de catégories à connecter',
    type: [String],
    example: ['9ec7f32f-f6e8-4091-a822-741fba76d92b'],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  connectIds?: string[];

  @ApiPropertyOptional({
    description: 'IDs de catégories à déconnecter',
    type: [String],
    example: ['57f85f4a-3926-4f42-bf3b-8bfbb7a97f6b'],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  disconnectIds?: string[];
}
