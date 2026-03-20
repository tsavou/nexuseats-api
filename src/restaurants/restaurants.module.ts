import { Module } from '@nestjs/common';
import { RestaurantsV1Controller } from './restaurants-v1.controller';
import { RestaurantsV2Controller } from './restaurants-v2.controller';
import { RestaurantsService } from './restaurants.service';
import { IsUniqueRestaurantNameConstraint } from './validators/is-unique-restaurant-name.validator';

@Module({
  controllers: [RestaurantsV1Controller, RestaurantsV2Controller],
  providers: [RestaurantsService, IsUniqueRestaurantNameConstraint],
  exports: [RestaurantsService],
})
export class RestaurantsModule {}
