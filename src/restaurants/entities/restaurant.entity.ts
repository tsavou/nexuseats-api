import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Cuisine } from '../enums/cuisine.enum';
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
 enum: Cuisine,
 example: Cuisine.ITALIENNE,
 })
 cuisineType: Cuisine;

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
}
