import { ApiProperty } from '@nestjs/swagger';
import { RestaurantV2ResponseDto } from './restaurant-v2-response.dto';
import { PaginatedMetaDto } from '../../common/dto/paginated-meta.dto';

/**
 * DTO de réponse paginée pour la liste des restaurants (v2).
 */
export class PaginatedRestaurantV2ResponseDto {
  @ApiProperty({
    description: 'Liste des restaurants (format v2 avec location + coordinates)',
    type: [RestaurantV2ResponseDto],
  })
  data: RestaurantV2ResponseDto[];

  @ApiProperty({
    description: 'Métadonnées de pagination',
    type: PaginatedMetaDto,
  })
  meta: PaginatedMetaDto;
}
