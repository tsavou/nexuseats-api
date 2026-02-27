import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { MenusModule } from './menus/menus.module';
import { MenuItemsModule } from './menu-items/menu-items.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,  // disponible partout
      envFilePath: '.env',  // lit .env à la racine
    }),

    RestaurantsModule,
    MenusModule,
    MenuItemsModule,
    PrismaModule,
    // OrdersModule,           // Sprint 3
    // AuthModule,             // Sprint 4
  ],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule {}
