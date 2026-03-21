import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CuisineType } from '@prisma/client';
/**
 * Entité Restaurant — définit le schéma de réponse Swagger.
 *
 * En décorant chaque propriété avec @ApiProperty, Swagger peut
 * générer automatiquement les schemas dans la section "Schemas"
 * et les afficher dans les réponses des endpoints.
 */
export class Restaurant {
 @ApiProperty({
 description: 'Identifiant unique du restaurant',
 example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
 })
 id: string;

 @ApiProperty({
 description: 'Nom du restaurant',
 example: 'La Bella Italia',
 })
 name: string;

 @ApiProperty({
 description: 'Adresse complète du restaurant',
 example: '12 rue de la Paix, 75002 Paris',
 })
 address: string;

 @ApiProperty({
 description: 'Type de cuisine proposée',
 enum: CuisineType,
 example: CuisineType.ITALIENNE,
 })
 cuisineType: CuisineType;

 @ApiProperty({
 description: 'Alias front du type de cuisine',
 enum: CuisineType,
 example: CuisineType.ITALIENNE,
 })
 cuisine: CuisineType;

 @ApiPropertyOptional({
 description: 'Note moyenne du restaurant (sur 5)',
 example: 4.2,
 })
 rating?: number;

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
 description: 'Code pays',
 example: '+33',
 })
 countryCode?: string;

 @ApiPropertyOptional({
 description: 'Numéro local',
 example: '123456789',
 })
 localNumber?: string;

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
