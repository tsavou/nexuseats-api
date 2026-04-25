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
} from 'class-validator';
import { Type } from 'class-transformer';
import { CuisineType } from '@prisma/client';
import { LocationDto } from './location.dto';
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
export class CreateRestaurantV2Dto {
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
  name: string;

  @ApiProperty({
    type: () => LocationDto,
    description: 'Localisation complète du restaurant (adresse + coordonnées)',
  })
  @ValidateNested()
  @Type(() => LocationDto)
  @IsNotEmpty({ message: 'La localisation est obligatoire' })
  location: LocationDto;

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
    description: 'Rayon de livraison en kilomètres',
    example: 5,
    minimum: 1,
    maximum: 100,
  })
  @IsNumber({}, { message: 'Le rayon doit être un nombre' })
  @Min(1)
  @Max(100)
  deliveryRadius: number;

  @ApiProperty({ example: '+33', description: 'Indicatif pays' })
  @IsString()
  @IsNotEmpty({ message: "L'indicatif pays est obligatoire" })
  @MinLength(2)
  @MaxLength(3)
  countryCode: string;

  @ApiProperty({ example: '612345678', description: 'Numéro local' })
  @IsString()
  @IsNotEmpty({ message: 'Le numéro local est obligatoire' })
  @MinLength(9)
  @MaxLength(15)
  localNumber: string;

  @ApiProperty({
    description: 'Email de contact du restaurant',
    example: 'contact@labellaitalia.fr',
  })
  @IsEmail({}, { message: "L'email doit être valide" })
  email: string;

  @ApiPropertyOptional({
    description: "Horaires d'ouverture",
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
