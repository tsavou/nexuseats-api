import {
  BadRequestException,
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
import { ScrollRestaurantsQueryDto } from './dto/scroll-restaurants-query.dto';

@Injectable()
export class RestaurantsService {
  private readonly logger = new Logger(RestaurantsService.name);
  private readonly defaultListFields = [
    'id',
    'name',
    'address',
    'cuisine',
    'cuisineType',
    'rating',
    'averagePrice',
    'phoneNumber',
    'countryCode',
    'localNumber',
    'description',
    'latitude',
    'longitude',
    'deliveryRadius',
    'isOpen',
    'ownerId',
    'createdAt',
    'updatedAt',
  ] as const;
  private readonly allowedListFields = new Set<string>(this.defaultListFields);

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
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const fieldSelection = this.buildFieldSelection(query.fields);
    const normalizedQuery = {
      page,
      limit,
      ...(query.cuisineType ? { cuisineType: query.cuisineType } : {}),
      ...(query.ratingMin !== undefined ? { ratingMin: query.ratingMin } : {}),
      ...(query.isOpen !== undefined ? { isOpen: query.isOpen } : {}),
      ...(fieldSelection.cacheFields.length > 0
        ? { fields: fieldSelection.cacheFields }
        : {}),
    };
    const cacheKey = `${this.LIST_PREFIX}${JSON.stringify(normalizedQuery)}`;

    // 1. Vérifier le cache
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      this.logger.log(`Cache HIT for key: ${cacheKey}`);
      return cached;
    }

    this.logger.log(`Cache MISS for key: ${cacheKey}`);

    // 2. Cache miss → requête PostgreSQL
    const where = this.buildRestaurantWhere(query);

    const [total, restaurants] = await this.prisma.$transaction([
      this.prisma.restaurant.count({ where }),
      this.prisma.restaurant.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: fieldSelection.select,
      }),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    const result = {
      data: restaurants,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };

    // 3. Stocker en cache avec TTL 5 min
    await this.cacheManager.set(cacheKey, result, this.LIST_TTL);

    return result;
  }

  async findAllCursor(query: ScrollRestaurantsQueryDto) {
    const limit = query.limit ?? 20;

    if (query.cursor) {
      await this.ensureActiveRestaurant(query.cursor);
    }

    const restaurants = await this.prisma.restaurant.findMany({
      where: { deletedAt: null },
      orderBy: { id: 'asc' },
      ...(query.cursor
        ? {
            cursor: { id: query.cursor },
            skip: 1,
          }
        : {}),
      take: limit + 1,
      select: this.buildDefaultListSelect(),
    });

    const hasNext = restaurants.length > limit;
    const pageItems = hasNext ? restaurants.slice(0, limit) : restaurants;
    const nextCursor = hasNext
      ? (pageItems[pageItems.length - 1]?.id ?? null)
      : null;

    return {
      data: pageItems,
      meta: {
        nextCursor,
        hasNext,
      },
    };
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
      ...restaurant,
    };

    // 3. Stocker en cache avec TTL 10 min
    await this.cacheManager.set(cacheKey, result, this.DETAIL_TTL);

    return result;
  }

  // ─────────────────────────────────────────────
  // Create + Invalidation de restaurants:list:*
  // ─────────────────────────────────────────────

  async create(data: Prisma.RestaurantUncheckedCreateInput) {
    const lockKey = [
      data.name,
      data.street,
      data.city,
      data.zipCode,
      data.country,
    ].join('|');

    const restaurant = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

      const existing = await tx.restaurant.findFirst({
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

      return tx.restaurant.create({
        data,
      });
    });

    // Invalider toutes les clés de liste
    await this.invalidateListCache();

    return restaurant;
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

    return restaurant;
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

  private buildRestaurantWhere(
    query: Pick<
      FindRestaurantsQueryDto,
      'cuisineType' | 'ratingMin' | 'isOpen'
    >,
  ): Prisma.RestaurantWhereInput {
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

    return where;
  }

  private buildFieldSelection(fields?: string) {
    const responseFields = this.parseRequestedFields(fields);
    const fieldsToSelect = responseFields ?? [...this.defaultListFields];
    const select: Prisma.RestaurantSelect = {};

    for (const field of fieldsToSelect) {
      switch (field) {
        case 'id':
        case 'name':
        case 'rating':
        case 'averagePrice':
        case 'phoneNumber':
        case 'description':
        case 'latitude':
        case 'longitude':
        case 'deliveryRadius':
        case 'isOpen':
        case 'ownerId':
        case 'createdAt':
        case 'updatedAt':
          select[field] = true;
          break;
        case 'cuisine':
        case 'cuisineType':
          select.cuisineType = true;
          break;
        case 'address':
          select.street = true;
          select.city = true;
          select.zipCode = true;
          select.country = true;
          break;
      }
    }

    return {
      responseFields,
      select,
      cacheFields: responseFields ? [...responseFields].sort() : [],
    };
  }

  private buildDefaultListSelect(): Prisma.RestaurantSelect {
    return this.buildFieldSelection().select;
  }

  private parseRequestedFields(fields?: string): string[] | null {
    if (!fields) {
      return null;
    }

    const requestedFields = [
      ...new Set(fields.split(',').map((field) => field.trim())),
    ].filter(Boolean);

    if (requestedFields.length === 0) {
      return null;
    }

    const invalidFields = requestedFields.filter(
      (field) => !this.allowedListFields.has(field),
    );

    if (invalidFields.length > 0) {
      throw new BadRequestException(
        `Invalid fields: ${invalidFields.join(', ')}. Allowed fields: ${[...this.allowedListFields].join(', ')}`,
      );
    }

    return requestedFields;
  }

  private toRestaurantResponse(
    restaurant: Partial<{
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
    }>,
    responseFields?: string[] | null,
  ) {
    const shouldInclude = (field: string) =>
      !responseFields || responseFields.includes(field);

    const response: Record<string, unknown> = {};

    if (shouldInclude('id')) response.id = restaurant.id;
    if (shouldInclude('name')) response.name = restaurant.name;
    if (shouldInclude('address')) {
      response.address = {
        street: restaurant.street,
        city: restaurant.city,
        zipCode: restaurant.zipCode,
        country: restaurant.country,
      };
    }
    if (shouldInclude('cuisine')) response.cuisine = restaurant.cuisineType;
    if (shouldInclude('rating')) response.rating = restaurant.rating;
    if (shouldInclude('averagePrice'))
      response.averagePrice = restaurant.averagePrice;
    if (shouldInclude('phoneNumber') && restaurant.phoneNumber !== undefined) {
      response.phoneNumber = restaurant.phoneNumber ?? undefined;
    }

    if (shouldInclude('description') && restaurant.description !== undefined) {
      response.description = restaurant.description ?? undefined;
    }
    if (shouldInclude('isOpen')) response.isOpen = restaurant.isOpen;
    if (shouldInclude('ownerId')) response.ownerId = restaurant.ownerId;
    if (shouldInclude('createdAt')) response.createdAt = restaurant.createdAt;
    if (shouldInclude('updatedAt')) response.updatedAt = restaurant.updatedAt;

    return response;
  }

  /**
   * Format de réponse V1 :
   * Réponse de base avec address comme objet { street, city, zipCode, country }
   */
  toV1Response(restaurant: any) {
    return this.toRestaurantResponse(restaurant);
  }

  /**
   * Format de réponse V2 :
   * Réponse de base + location { address, coordinates } + deliveryRadius
   */
  toV2Response(restaurant: any) {
    const { address, ...base } = this.toRestaurantResponse(restaurant);
    return {
      ...base,
      location: {
        address,
        coordinates: {
          lat: restaurant.latitude ?? 0,
          lng: restaurant.longitude ?? 0,
        },
      },
      deliveryRadius: restaurant.deliveryRadius ?? 5,
    };
  }
}
