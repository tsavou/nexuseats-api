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
} from 'class-validator';

/**
 * Enum des types de cuisine — partagé entre DTO, entité et Swagger.
 */
export enum Cuisine {
  FRANCAISE = 'française',
  ITALIENNE = 'italienne',
  JAPONAISE = 'japonaise',
  CHINOISE = 'chinoise',
  INDIENNE = 'indienne',
  MEXICAINE = 'mexicaine',
  AMERICAINE = 'américaine',
  THAILANDAISE = 'thaïlandaise',
  LIBANAISE = 'libanaise',
  AUTRE = 'autre',
}

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
    description: 'Adresse complète du restaurant',
    example: '12 rue de la Paix, 75002 Paris',
    minLength: 5,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty({ message: "L'adresse est obligatoire" })
  @MinLength(5)
  @MaxLength(255)
  address: string;

  @ApiProperty({
    description: 'Type de cuisine proposée',
    enum: Cuisine,
    example: Cuisine.ITALIENNE,
  })
  @IsEnum(Cuisine, {
    message: `Type de cuisine invalide. Valeurs : ${Object.values(Cuisine).join(', ')}`,
  })
  cuisineType: Cuisine;

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


  @ApiProperty({ example: '+33', description: 'Indicatif pays' })
  @IsString()
  @IsNotEmpty({ message: 'L\'indicatif pays est obligatoire' })
  @MinLength(2)
  @MaxLength(3)
  countryCode: string;

  @ApiProperty({ example: '612345678', description: 'Numéro local' })
  @IsString()
  @IsNotEmpty({ message: 'Le numéro local est obligatoire' })
  @MinLength(9)
  @MaxLength(15)
  localNumber: string;
  
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
