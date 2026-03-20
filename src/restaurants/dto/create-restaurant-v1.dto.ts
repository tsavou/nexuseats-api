import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
  Min,
  Max,
  MinLength,
  MaxLength,
  ValidateNested,
  IsEmail,
  IsArray,
  ArrayMinSize,
  IsUUID,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AddressDto } from './address.dto';
import { CuisineType } from '@prisma/client';
import { IsUniqueRestaurantName } from '../validators/is-unique-restaurant-name.validator';
import { IsOpeningHoursValid } from '../validators/is-opening-hours-valid.validator';
import { OpeningHourDto } from './opening-hour.dto';

/**
 * DTO de création d'un restaurant.
 *
 * Chaque propriété combine :
 * - @ApiProperty / @ApiPropertyOptional → documentation Swagger
 * - Décorateurs class-validator → validation runtime
 *
 * Les deux sont nécessaires : @ApiProperty documente, class-validator valide.
 */
export class CreateRestaurantDto {

  @ApiProperty({
    description: 'Nom du restaurant',
    example: 'La Bella Italia',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'Le nom est obligatoire' })
  @MinLength(2, { message: 'Le nom doit faire au moins 2 caractères' })
  @MaxLength(100)
  @IsUniqueRestaurantName()
  name: string;

  @ApiProperty({ type: () => AddressDto, description: 'Adresse complète du restaurant' })
  @ValidateNested()
  @Type(() => AddressDto)
  @IsNotEmpty({ message: "L'adresse est obligatoire" })
  address: AddressDto;

  @ApiProperty({
    description: 'Type de cuisine proposée',
    enum: CuisineType,
    example: CuisineType.ITALIENNE,
  })
  @IsEnum(CuisineType, {
    message: `Type de cuisine invalide. Valeurs : ${Object.values(CuisineType).join(', ')}`,
  })
  cuisine: CuisineType;

  @ApiPropertyOptional({
    description: 'Note moyenne du restaurant (sur 5)',
    example: 4.2,
    minimum: 0,
    maximum: 5,
    default: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'La note doit être un nombre' })
  @Min(0, { message: 'La note minimale est 0' })
  @Max(5, { message: 'La note maximale est 5' })
  rating?: number;

  @ApiProperty({
    description: 'Prix moyen par personne en euros',
    example: 25,
    minimum: 1,
    maximum: 500,
  })
  @IsNumber()
  @Min(1, { message: 'Le prix minimum est 1€' })
  @Max(500)
  averagePrice: number;

  @ApiProperty({
    description: 'Numéro de téléphone du restaurant au format international',
    example: '+33142612345',
  })
  @IsString()
  @Matches(/^\+?[0-9]{10,15}$/, { message: 'Le format du téléphone doit être international (ex: +33123456789)' })
  phone: string;

  @ApiProperty({
    description: 'Email de contact du restaurant',
    example: 'contact@labellaitalia.fr',
  })
  @IsEmail({}, { message: 'L\'email doit être valide' })
  email: string;

  @ApiProperty({
    description: 'Liste des IDs de catégories (UUIDv4)',
    type: [String],
    example: ['123e4567-e89b-12d3-a456-426614174000'],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Au moins une catégorie est requise' })
  @IsUUID('4', { each: true, message: 'Chaque catégorie doit être un UUID v4 valide' })
  categoryIds: string[];

  @ApiPropertyOptional({
    description: 'Horaires d\'ouverture',
    type: [OpeningHourDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OpeningHourDto)
  @IsOpeningHoursValid()
  openingHours?: OpeningHourDto[];
  
  @ApiPropertyOptional({
    description: 'Description courte du restaurant',
    example: 'Restaurant italien authentique au coeur de Paris',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
