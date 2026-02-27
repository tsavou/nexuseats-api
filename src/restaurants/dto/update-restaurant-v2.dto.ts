import { PartialType } from '@nestjs/swagger';
import { CreateRestaurantV2Dto } from './create-restaurant-v2.dto';

export class UpdateRestaurantV2Dto extends PartialType(CreateRestaurantV2Dto) {}
