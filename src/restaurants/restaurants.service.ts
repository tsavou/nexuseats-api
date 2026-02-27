import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRestaurantDto, Cuisine } from './dto/create-restaurant-v1.dto';
import { randomUUID } from 'crypto';
import { Restaurant } from './entities/restaurant.entity';
import { CreateRestaurantV2Dto } from './dto/create-restaurant-v2.dto';

@Injectable()    // ← Dit à NestJS : "je suis injectable via DI"
export class RestaurantsService {

  // Pour l'instant, stockage en mémoire (Sprint 3 = Prisma + PostgreSQL)
  private restaurants: Restaurant[] = [
    {
      id: randomUUID(),
      name: 'La Bella Italia',
      address: '12 rue de la Paix, 75002 Paris',
      cuisineType: Cuisine.ITALIENNE,
      rating: 4.2,
      averagePrice: 25,
      phoneNumber: '+33 1 42 61 23 45',
      countryCode: '+33',
      localNumber: '123456789',
      description: 'Restaurant italien authentique au coeur de Paris',
    },
    {
      id: randomUUID(),
      name: 'Sushi Master',
      address: "8 avenue de l'Opéra, 75001 Paris",
      cuisineType: Cuisine.JAPONAISE,
      rating: 4.5,
      averagePrice: 35,
      phoneNumber: '+33 1 53 78 91 23',
      description: 'Sushis frais préparés par des chefs japonais',
    },
    {
      id: randomUUID(),
      name: 'Le Bistrot Français',
      address: '22 boulevard Saint-Germain, 75005 Paris',
      cuisineType: Cuisine.FRANCAISE,
      rating: 4.0,
      averagePrice: 28,
      phoneNumber: '+33 1 46 33 12 34',
      description: 'Bistrot français traditionnel',
    },
  ];

  findAll(page = 1, limit = 10) {
    const start = (page - 1) * limit;
    return {
      data: this.restaurants.slice(start, start + limit),
      meta: { page, limit, total: this.restaurants.length },
    };
  }

  findOne(id: string) {
    const restaurant = this.restaurants.find(r => r.id === id);
    if (!restaurant) {
      throw new NotFoundException(`Restaurant ${id} introuvable`);
      // → NestJS retourne automatiquement 404 + message JSON
    }
    return restaurant;
  }

  create(dto: CreateRestaurantDto | CreateRestaurantV2Dto) {
    const restaurant = {
      id: randomUUID(),    // UUID v4
      ...dto,
      rating: 0,
    };
    this.restaurants.push(restaurant);
    return restaurant;
  }

  update(id: string, dto: Partial<CreateRestaurantDto | CreateRestaurantV2Dto>) {
    const restaurant = this.findOne(id);
    Object.assign(restaurant, dto);
    return restaurant;
  }

  remove(id: string) {
    const index = this.restaurants.findIndex(r => r.id === id);
    if (index === -1) throw new NotFoundException();
    this.restaurants.splice(index, 1);
  }
}