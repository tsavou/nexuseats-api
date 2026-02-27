import { ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsOptional, IsUUID } from 'class-validator';

export class UpdateMenuItemCategoriesDto {
  @ApiPropertyOptional({
    description: 'IDs de catégories à connecter',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  connectIds?: string[];

  @ApiPropertyOptional({
    description: 'IDs de catégories à déconnecter',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  disconnectIds?: string[];
}
