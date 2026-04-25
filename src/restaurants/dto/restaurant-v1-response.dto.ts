import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CuisineType } from '@prisma/client';
import { AddressDto } from './address.dto';

/**
 * DTO de réponse restaurant pour la v1.
 * Utilisé uniquement pour la documentation Swagger (@ApiResponse).
 *
 * Format TP2 :
 * { id, name, cuisine, address: { street, city }, rating }
 */
export class RestaurantV1ResponseDto {
  @ApiProperty({
    description: 'Identifiant unique du restaurant',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  id: string;

  @ApiProperty({
    description: 'Nom du restaurant',
    example: 'Chez Marco',
  })
  name: string;

  @ApiProperty({
    description: 'Type de cuisine proposée',
    enum: CuisineType,
    example: CuisineType.ITALIENNE,
  })
  cuisine: CuisineType;

  @ApiProperty({
    description: 'Adresse du restaurant',
    type: () => AddressDto,
  })
  address: AddressDto;

  @ApiPropertyOptional({
    description: 'Note moyenne du restaurant (sur 5)',
    example: 4.5,
  })
  rating: number;

  @ApiProperty({
    description: 'Prix moyen par personne en euros',
    example: 25,
  })
  averagePrice: number;

  @ApiPropertyOptional({
    description: 'Numéro de téléphone',
    example: '+33612345678',
  })
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'Description courte du restaurant',
    example: 'Restaurant italien authentique au coeur de Paris',
  })
  description?: string;

  @ApiProperty({
    description: "Statut d'ouverture du restaurant",
    example: true,
  })
  isOpen: boolean;

  @ApiPropertyOptional({
    description: 'ID du propriétaire du restaurant',
    example: 1,
  })
  ownerId?: number;

  @ApiProperty({
    description: 'Date de création',
    example: '2026-02-27T13:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date de dernière mise à jour',
    example: '2026-02-27T14:00:00.000Z',
  })
  updatedAt: Date;
}
