import { ApiPropertyOptional } from '@nestjs/swagger';
import { CuisineType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

function toBoolean(value: unknown): unknown {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') {
      return true;
    }
    if (normalized === 'false') {
      return false;
    }
  }

  return value;
}

export class FindRestaurantsQueryDto {
  @ApiPropertyOptional({
    description: 'Numéro de page',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: "Nombre d'éléments par page",
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Filtre type de cuisine',
    example: 'ITALIENNE',
    enum: CuisineType,
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsEnum(CuisineType)
  cuisineType?: CuisineType;

  @ApiPropertyOptional({
    description: 'Filtre note minimale',
    minimum: 0,
    maximum: 5,
    example: 4,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  ratingMin?: number;

  @ApiPropertyOptional({
    description: "Filtre sur le statut d'ouverture",
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  isOpen?: boolean;
}
