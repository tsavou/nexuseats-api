import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CuisineType } from '@prisma/client';
import { LocationDto } from './location.dto';

/**
 * DTO de réponse restaurant pour la v2.
 *
 * Format TP2 attendu :
 * {
 *   "id": "uuid",
 *   "name": "Chez Marco",
 *   "cuisine": "ITALIEN",
 *   "location": {
 *     "address": { "street": "1 rue...", "city": "Paris", "zipCode": "75001" },
 *     "coordinates": { "lat": 48.8566, "lng": 2.3522 }
 *   },
 *   "rating": 4.5,
 *   "deliveryRadius": 5
 * }
 */
export class RestaurantV2ResponseDto {
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
    description: 'Localisation complète du restaurant (adresse + GPS)',
    type: () => LocationDto,
  })
  location: LocationDto;

  @ApiPropertyOptional({
    description: 'Note moyenne du restaurant (sur 5)',
    example: 4.5,
  })
  rating: number;

  @ApiProperty({
    description: 'Rayon de livraison en kilomètres',
    example: 5,
  })
  deliveryRadius: number;

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
