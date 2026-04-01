import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateMenuItemDto {
  @ApiPropertyOptional({ description: "Nom de l'item", example: 'Pizza Margherita XL' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ description: 'Prix TTC', example: 14.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ description: 'Disponibilité', example: true })
  @IsOptional()
  @IsBoolean()
  available?: boolean;
}
