import { ApiProperty } from '@nestjs/swagger';
import { RestaurantV1ResponseDto } from './restaurant-v1-response.dto';
import { PaginatedMetaDto } from '../../common/dto/paginated-meta.dto';

/**
 * DTO de réponse paginée pour la liste des restaurants (v1).
 */
export class PaginatedRestaurantV1ResponseDto {
  @ApiProperty({
    description: 'Liste des restaurants',
    type: [RestaurantV1ResponseDto],
  })
  data: RestaurantV1ResponseDto[];

  @ApiProperty({
    description: 'Métadonnées de pagination',
    type: PaginatedMetaDto,
  })
  meta: PaginatedMetaDto;
}
