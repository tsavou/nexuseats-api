import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { ConfigModule } from '@nestjs/config';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,  // disponible partout
      envFilePath: '.env',  // lit .env à la racine
    }),

    RestaurantsModule,
    // OrdersModule,           // Sprint 3
    // AuthModule,             // Sprint 4
  ],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule {}
