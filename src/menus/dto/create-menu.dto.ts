import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateMenuDto {
  @ApiProperty({ description: 'Nom du menu', example: 'Menu midi' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Description du menu',
    example: 'Formule dejeuner italienne avec entree, plat et dessert',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
