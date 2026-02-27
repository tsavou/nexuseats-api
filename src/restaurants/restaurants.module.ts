import { Module } from '@nestjs/common';
import { RestaurantsV1Controller } from './restaurants-v1.controller';
import { RestaurantsV2Controller } from './restaurants-v2.controller';
import { RestaurantsService } from './restaurants.service';

@Module({
  controllers: [RestaurantsV1Controller, RestaurantsV2Controller],
  providers: [RestaurantsService],
  exports: [RestaurantsService],
})
export class RestaurantsModule {}
