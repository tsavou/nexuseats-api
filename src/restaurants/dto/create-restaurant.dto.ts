import { IsString, IsNotEmpty, MinLength, MaxLength, IsEnum, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// Enum partagé entre DTO et Prisma schema
export enum Cuisine {
  ITALIEN = 'ITALIEN',
  JAPONAIS = 'JAPONAIS',
  FRANCAIS = 'FRANCAIS',
  INDIEN = 'INDIEN',
  MEXICAIN = 'MEXICAIN',
  CHINOIS = 'CHINOIS',
}

export class CreateRestaurantDto {
  @ApiProperty({ example: 'Le restaurant de la rue des plats', description: 'Nom du restaurant', required: true })
  @IsString()
  @IsNotEmpty({ message: 'Le nom est obligatoire' })
  @MinLength(2, { message: 'Le nom doit faire au moins 2 caractères' })
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'ITALIEN', description: 'Type de cuisine', required: true, enum: Cuisine })
  @IsEnum(Cuisine, { message: 'Cuisine invalide. Valeurs possibles : ITALIEN, JAPONAIS, ...' })
  cuisine: Cuisine;

  @ApiProperty({ example: '12 rue des plats', description: 'Adresse du restaurant', required: true })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: 'Paris', description: 'Ville du restaurant', required: true })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'Une description du restaurant', description: 'Description du restaurant', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ example: '48.8566', description: 'Latitude du restaurant', required: false, minimum: -90, maximum: 90 })
  @IsOptional()
  @IsNumber()
  @Min(-90) @Max(90)
  latitude?: number;

  @ApiProperty({ example: '2.3522', description: 'Longitude du restaurant', required: false, minimum: -180, maximum: 180 })
  @IsNumber()
  @Min(-180) @Max(180)
  longitude?: number;
}