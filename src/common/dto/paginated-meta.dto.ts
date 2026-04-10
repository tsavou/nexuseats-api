import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO des métadonnées de pagination.
 * Réutilisable pour toutes les réponses paginées de l'API.
 */
export class PaginatedMetaDto {
  @ApiProperty({ description: 'Nombre total de résultats', example: 42 })
  total: number;

  @ApiProperty({ description: 'Page courante', example: 1 })
  page: number;

  @ApiProperty({ description: "Nombre d'éléments par page", example: 20 })
  limit: number;

  @ApiProperty({ description: 'Nombre total de pages', example: 3 })
  totalPages: number;

  @ApiProperty({ description: 'Page suivante disponible', example: true })
  hasNext: boolean;

  @ApiProperty({ description: 'Page précédente disponible', example: false })
  hasPrevious: boolean;
}
