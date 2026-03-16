import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CuisineType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FindRestaurantsQueryDto } from './dto/find-restaurants-query.dto';

@Injectable()
export class RestaurantsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: FindRestaurantsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const where: Prisma.RestaurantWhereInput = { deletedAt: null };

    if (query.cuisineType) {
      where.cuisineType = query.cuisineType;
    }
    if (query.ratingMin !== undefined) {
      where.rating = { gte: query.ratingMin };
    }
    if (query.isOpen !== undefined) {
      where.isOpen = query.isOpen;
    }

    const [total, restaurants] = await this.prisma.$transaction([
      this.prisma.restaurant.count({ where }),
      this.prisma.restaurant.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const lastPage = total === 0 ? 0 : Math.ceil(total / limit);

    return {
      data: restaurants.map((restaurant) => this.toRestaurantResponse(restaurant)),
      meta: {
        total,
        page,
        lastPage,
        hasNext: page < lastPage,
        limit,
      },
    };
  }

  async findOne(id: string) {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: { id, deletedAt: null },
      include: {
        menus: {
          where: { deletedAt: null },
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            description: true,
            restaurantId: true,
            items: {
              where: { deletedAt: null },
              orderBy: { name: 'asc' },
              select: {
                id: true,
                name: true,
                price: true,
                available: true,
                menuId: true,
                categories: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!restaurant) {
      throw new NotFoundException(`Restaurant ${id} introuvable`);
    }

    return {
      ...this.toRestaurantResponse(restaurant),
      menus: restaurant.menus,
    };
  }

  async create(data: Prisma.RestaurantUncheckedCreateInput) {
    const existing = await this.prisma.restaurant.findFirst({
      where: {
        name: data.name,
        address: data.address,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException(
        'Un restaurant avec ce nom et cette adresse existe déjà',
      );
    }

    const restaurant = await this.prisma.restaurant.create({
      data,
    });

    return this.toRestaurantResponse(restaurant);
  }

  async update(id: string, data: Prisma.RestaurantUpdateInput) {
    await this.ensureActiveRestaurant(id);

    const restaurant = await this.prisma.restaurant.update({
      where: { id },
      data,
    });

    return this.toRestaurantResponse(restaurant);
  }

  async softDelete(id: string) {
    await this.ensureActiveRestaurant(id);

    await this.prisma.restaurant.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private async ensureActiveRestaurant(id: string) {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });

    if (!restaurant) {
      throw new NotFoundException(`Restaurant ${id} introuvable`);
    }
  }

  private toRestaurantResponse(
    restaurant: {
      id: string;
      name: string;
      address: string;
      cuisineType: CuisineType;
      rating: number;
      averagePrice: number;
      phoneNumber: string | null;
      countryCode: string | null;
      localNumber: string | null;
      description: string | null;
      isOpen: boolean;
      ownerId: number;
      createdAt: Date;
      updatedAt: Date;
    },
  ) {
    return {
      id: restaurant.id,
      name: restaurant.name,
      address: restaurant.address,
      cuisineType: restaurant.cuisineType,
      rating: restaurant.rating,
      averagePrice: restaurant.averagePrice,
      phoneNumber: restaurant.phoneNumber ?? undefined,
      countryCode: restaurant.countryCode ?? undefined,
      localNumber: restaurant.localNumber ?? undefined,
      description: restaurant.description ?? undefined,
      isOpen: restaurant.isOpen,
      ownerId: restaurant.ownerId,
      createdAt: restaurant.createdAt,
      updatedAt: restaurant.updatedAt,
    };
  }
}
