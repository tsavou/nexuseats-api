import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';

@Injectable()    // ← Dit à NestJS : "je suis injectable via DI"
export class RestaurantsService {

  // Pour l'instant, stockage en mémoire (Sprint 3 = Prisma + PostgreSQL)
  private restaurants = [
    { id: 'uuid-1', name: 'Chez Luigi', cuisine: 'ITALIEN', rating: 4.5 },
    { id: 'uuid-2', name: 'Sakura', cuisine: 'JAPONAIS', rating: 4.8 },
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

  create(dto: CreateRestaurantDto) {
    const restaurant = {
      id: crypto.randomUUID(),    // UUID v4
      ...dto,
      rating: 0,
    };
    this.restaurants.push(restaurant);
    return restaurant;
  }

  update(id: string, dto: Partial<CreateRestaurantDto>) {
    const restaurant = this.findOne(id);       // Réutilise findOne (+ 404 auto)
    Object.assign(restaurant, dto);
    return restaurant;
  }

  remove(id: string) {
    const index = this.restaurants.findIndex(r => r.id === id);
    if (index === -1) throw new NotFoundException();
    this.restaurants.splice(index, 1);
  }
}