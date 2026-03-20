import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CuisineType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FindRestaurantsQueryDto } from './dto/find-restaurants-query.dto';

@Injectable()
export class RestaurantsService {
  private readonly logger = new Logger(RestaurantsService.name);

  // Préfixes de clés Redis
  private readonly LIST_PREFIX = 'restaurants:list:';
  private readonly DETAIL_PREFIX = 'restaurants:detail:';

  // TTL en millisecondes
  private readonly LIST_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly DETAIL_TTL = 10 * 60 * 1000; // 10 minutes

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  // ─────────────────────────────────────────────
  // Cache-aside : findAll
  // ─────────────────────────────────────────────

  async findAll(query: FindRestaurantsQueryDto) {
    const cacheKey = `${this.LIST_PREFIX}${JSON.stringify(query)}`;

    // 1. Vérifier le cache
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      this.logger.log(`Cache HIT for key: ${cacheKey}`);
      return cached;
    }

    this.logger.log(`Cache MISS for key: ${cacheKey}`);

    // 2. Cache miss → requête PostgreSQL
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

    const result = {
      data: restaurants.map((restaurant) =>
        this.toRestaurantResponse(restaurant),
      ),
      meta: {
        total,
        page,
        lastPage,
        hasNext: page < lastPage,
        limit,
      },
    };

    // 3. Stocker en cache avec TTL 5 min
    await this.cacheManager.set(cacheKey, result, this.LIST_TTL);

    return result;
  }

  // ─────────────────────────────────────────────
  // Cache-aside : findOne
  // ─────────────────────────────────────────────

  async findOne(id: string) {
    const cacheKey = `${this.DETAIL_PREFIX}${id}`;

    // 1. Vérifier le cache
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      this.logger.log(`Cache HIT for key: ${cacheKey}`);
      return cached;
    }

    this.logger.log(`Cache MISS for key: ${cacheKey}`);

    // 2. Cache miss → requête PostgreSQL
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

    const result = {
      ...this.toRestaurantResponse(restaurant),
      menus: restaurant.menus,
    };

    // 3. Stocker en cache avec TTL 10 min
    await this.cacheManager.set(cacheKey, result, this.DETAIL_TTL);

    return result;
  }

  // ─────────────────────────────────────────────
  // Create + Invalidation de restaurants:list:*
  // ─────────────────────────────────────────────

  async create(data: Prisma.RestaurantUncheckedCreateInput) {
    const existing = await this.prisma.restaurant.findFirst({
      where: {
        name: data.name,
        street: data.street,
        city: data.city,
        zipCode: data.zipCode,
        country: data.country,
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

    // Invalider toutes les clés de liste
    await this.invalidateListCache();

    return this.toRestaurantResponse(restaurant);
  }

  // ─────────────────────────────────────────────
  // Update + Invalidation detail + list
  // ─────────────────────────────────────────────

  async update(id: string, data: Prisma.RestaurantUpdateInput) {
    await this.ensureActiveRestaurant(id);

    const restaurant = await this.prisma.restaurant.update({
      where: { id },
      data,
    });

    // Invalider le cache détail de ce restaurant + toutes les listes
    await this.invalidateDetailCache(id);
    await this.invalidateListCache();

    return this.toRestaurantResponse(restaurant);
  }

  // ─────────────────────────────────────────────
  // Remove (soft delete) + Invalidation detail + list
  // ─────────────────────────────────────────────

  async softDelete(id: string) {
    await this.ensureActiveRestaurant(id);

    await this.prisma.restaurant.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Invalider le cache détail de ce restaurant + toutes les listes
    await this.invalidateDetailCache(id);
    await this.invalidateListCache();
  }

  // ─────────────────────────────────────────────
  // Méthodes d'invalidation du cache
  // ─────────────────────────────────────────────

  /**
   * Invalide toutes les clés commençant par "restaurants:list:"
   * Utilise le client Redis natif pour le pattern matching avec KEYS
   */
  private async invalidateListCache(): Promise<void> {
    try {
      // Accéder au client Redis natif via cache-manager-redis-yet (v5)
      const store = (this.cacheManager as any).store;
      const client = store?.client;

      if (client && typeof client.keys === 'function') {
        const keys: string[] = await client.keys(`${this.LIST_PREFIX}*`);
        if (keys.length > 0) {
          await Promise.all(keys.map((key) => this.cacheManager.del(key)));
          this.logger.log(
            `Invalidated ${keys.length} list cache key(s): ${keys.join(', ')}`,
          );
        }
      } else {
        this.logger.warn('Redis client not available for pattern invalidation');
      }
    } catch (error) {
      this.logger.warn(`Failed to invalidate list cache: ${error.message}`);
    }
  }

  /**
   * Invalide la clé de cache pour un restaurant spécifique
   */
  private async invalidateDetailCache(id: string): Promise<void> {
    const cacheKey = `${this.DETAIL_PREFIX}${id}`;
    await this.cacheManager.del(cacheKey);
    this.logger.log(`Invalidated detail cache for key: ${cacheKey}`);
  }

  // ─────────────────────────────────────────────
  // Méthodes privées utilitaires
  // ─────────────────────────────────────────────

  private async ensureActiveRestaurant(id: string) {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });

    if (!restaurant) {
      throw new NotFoundException(`Restaurant ${id} introuvable`);
    }
  }

  private toRestaurantResponse(restaurant: {
    id: string;
    name: string;
    street: string;
    city: string;
    zipCode: string;
    country: string;
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
  }) {
    return {
      id: restaurant.id,
      name: restaurant.name,
      address: `${restaurant.street}, ${restaurant.zipCode} ${restaurant.city}, ${restaurant.country}`,
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
