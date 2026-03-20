import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CuisineType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RestaurantsService } from './restaurants.service';

describe('RestaurantsService', () => {
  let service: RestaurantsService;

  const restaurant = {
    id: 'restaurant-1',
    name: 'Nexus Pasta',
    street: '12 rue de la Paix',
    city: 'Paris',
    zipCode: '75002',
    country: 'France',
    cuisineType: CuisineType.ITALIENNE,
    rating: 4.7,
    averagePrice: 22,
    phoneNumber: '0102030405',
    countryCode: '+33',
    localNumber: '102030405',
    description: 'Fresh pasta daily',
    isOpen: true,
    ownerId: 9,
    createdAt: new Date('2026-03-15T10:00:00.000Z'),
    updatedAt: new Date('2026-03-16T10:00:00.000Z'),
    deletedAt: null,
  };

  const restaurantResponse = {
    id: restaurant.id,
    name: restaurant.name,
    address: `${restaurant.street}, ${restaurant.zipCode} ${restaurant.city}, ${restaurant.country}`,
    cuisineType: restaurant.cuisineType,
    rating: restaurant.rating,
    averagePrice: restaurant.averagePrice,
    phoneNumber: restaurant.phoneNumber,
    countryCode: restaurant.countryCode,
    localNumber: restaurant.localNumber,
    description: restaurant.description,
    isOpen: restaurant.isOpen,
    ownerId: restaurant.ownerId,
    createdAt: restaurant.createdAt,
    updatedAt: restaurant.updatedAt,
  };

  const prismaMock = {
    $transaction: jest.fn(),
    restaurant: {
      count: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const redisKeysMock = jest.fn();
  const cacheManagerMock: any = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    store: {
      client: {
        keys: redisKeysMock,
      },
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    redisKeysMock.mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestaurantsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: CACHE_MANAGER,
          useValue: cacheManagerMock,
        },
      ],
    }).compile();

    service = module.get<RestaurantsService>(RestaurantsService);
  });

  it('findAll returns cached data without querying Prisma', async () => {
    const query = { page: 1, limit: 10 };
    const cachedResult = { data: [restaurantResponse], meta: { total: 1 } };

    cacheManagerMock.get.mockResolvedValue(cachedResult);

    await expect(service.findAll(query)).resolves.toEqual(cachedResult);
    expect(cacheManagerMock.get).toHaveBeenCalledWith(
      'restaurants:list:{"page":1,"limit":10}',
    );
    expect(prismaMock.restaurant.count).not.toHaveBeenCalled();
    expect(prismaMock.restaurant.findMany).not.toHaveBeenCalled();
  });

  it('findAll queries Prisma on cache miss and stores the result', async () => {
    const query = {
      page: 2,
      limit: 1,
      cuisineType: CuisineType.ITALIENNE,
      ratingMin: 4,
      isOpen: true,
    };

    cacheManagerMock.get.mockResolvedValue(undefined);
    prismaMock.$transaction.mockResolvedValue([2, [restaurant]]);

    const result = await service.findAll(query);

    expect(prismaMock.restaurant.count).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        cuisineType: CuisineType.ITALIENNE,
        rating: { gte: 4 },
        isOpen: true,
      },
    });
    expect(prismaMock.restaurant.findMany).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        cuisineType: CuisineType.ITALIENNE,
        rating: { gte: 4 },
        isOpen: true,
      },
      skip: 1,
      take: 1,
      orderBy: { createdAt: 'desc' },
    });
    expect(cacheManagerMock.set).toHaveBeenCalledWith(
      'restaurants:list:{"page":2,"limit":1,"cuisineType":"ITALIENNE","ratingMin":4,"isOpen":true}',
      result,
      300000,
    );
    expect(result).toEqual({
      data: [restaurantResponse],
      meta: {
        total: 2,
        page: 2,
        lastPage: 2,
        hasNext: false,
        limit: 1,
      },
    });
  });

  it('findAll returns empty pagination metadata when no restaurant matches', async () => {
    cacheManagerMock.get.mockResolvedValue(undefined);
    prismaMock.$transaction.mockResolvedValue([0, []]);

    await expect(service.findAll({})).resolves.toEqual({
      data: [],
      meta: {
        total: 0,
        page: 1,
        lastPage: 0,
        hasNext: false,
        limit: 10,
      },
    });
  });

  it('findOne returns cached restaurant details without querying Prisma', async () => {
    const cachedRestaurant = { ...restaurantResponse, menus: [] };

    cacheManagerMock.get.mockResolvedValue(cachedRestaurant);

    await expect(service.findOne(restaurant.id)).resolves.toEqual(cachedRestaurant);
    expect(cacheManagerMock.get).toHaveBeenCalledWith(
      `restaurants:detail:${restaurant.id}`,
    );
    expect(prismaMock.restaurant.findFirst).not.toHaveBeenCalled();
  });

  it('findOne returns a restaurant and stores details in cache on miss', async () => {
    const restaurantWithMenus = {
      ...restaurant,
      menus: [
        {
          id: 'menu-1',
          name: 'Lunch',
          description: 'Midday menu',
          restaurantId: restaurant.id,
          items: [
            {
              id: 'item-1',
              name: 'Lasagna',
              price: 18,
              available: true,
              menuId: 'menu-1',
              categories: [{ id: 'cat-1', name: 'Pasta' }],
            },
          ],
        },
      ],
    };

    cacheManagerMock.get.mockResolvedValue(undefined);
    prismaMock.restaurant.findFirst.mockResolvedValue(restaurantWithMenus);

    const result = await service.findOne(restaurant.id);

    expect(prismaMock.restaurant.findFirst).toHaveBeenCalledWith({
      where: { id: restaurant.id, deletedAt: null },
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
    expect(cacheManagerMock.set).toHaveBeenCalledWith(
      `restaurants:detail:${restaurant.id}`,
      result,
      600000,
    );
    expect(result).toEqual({
      ...restaurantResponse,
      menus: restaurantWithMenus.menus,
    });
  });

  it('findOne throws NotFoundException when restaurant does not exist', async () => {
    cacheManagerMock.get.mockResolvedValue(undefined);
    prismaMock.restaurant.findFirst.mockResolvedValue(null);

    await expect(service.findOne('missing-id')).rejects.toThrow(NotFoundException);
    expect(cacheManagerMock.set).not.toHaveBeenCalled();
  });

  it('create persists a new restaurant and invalidates list cache', async () => {
    const dto = {
      name: restaurant.name,
      street: restaurant.street,
      city: restaurant.city,
      zipCode: restaurant.zipCode,
      country: restaurant.country,
      cuisineType: restaurant.cuisineType,
      averagePrice: restaurant.averagePrice,
      rating: restaurant.rating,
      ownerId: restaurant.ownerId,
    };

    prismaMock.restaurant.findFirst.mockResolvedValueOnce(null);
    prismaMock.restaurant.create.mockResolvedValue(restaurant);
    redisKeysMock.mockResolvedValue([
      'restaurants:list:{}',
      'restaurants:list:{"page":1}',
    ]);

    await expect(service.create(dto)).resolves.toEqual(restaurantResponse);
    expect(prismaMock.restaurant.create).toHaveBeenCalledWith({ data: dto });
    expect(redisKeysMock).toHaveBeenCalledWith('restaurants:list:*');
    expect(cacheManagerMock.del).toHaveBeenCalledWith('restaurants:list:{}');
    expect(cacheManagerMock.del).toHaveBeenCalledWith('restaurants:list:{"page":1}');
  });

  it('create throws ConflictException when the same name and address already exist', async () => {
    prismaMock.restaurant.findFirst.mockResolvedValue({ id: restaurant.id });

    await expect(
      service.create({
        name: restaurant.name,
        street: restaurant.street,
        city: restaurant.city,
        zipCode: restaurant.zipCode,
        country: restaurant.country,
        cuisineType: restaurant.cuisineType,
        averagePrice: restaurant.averagePrice,
        ownerId: restaurant.ownerId,
      }),
    ).rejects.toThrow(ConflictException);
    expect(prismaMock.restaurant.create).not.toHaveBeenCalled();
  });

  it('update persists changes and invalidates detail and list caches', async () => {
    prismaMock.restaurant.findFirst.mockResolvedValueOnce({ id: restaurant.id });
    prismaMock.restaurant.update.mockResolvedValue({
      ...restaurant,
      name: 'Nexus Pasta Prime',
    });
    redisKeysMock.mockResolvedValue(['restaurants:list:{}']);

    const result = await service.update(restaurant.id, { name: 'Nexus Pasta Prime' });

    expect(prismaMock.restaurant.update).toHaveBeenCalledWith({
      where: { id: restaurant.id },
      data: { name: 'Nexus Pasta Prime' },
    });
    expect(cacheManagerMock.del).toHaveBeenCalledWith(
      `restaurants:detail:${restaurant.id}`,
    );
    expect(cacheManagerMock.del).toHaveBeenCalledWith('restaurants:list:{}');
    expect(result).toEqual({
      ...restaurantResponse,
      name: 'Nexus Pasta Prime',
    });
  });

  it('update throws NotFoundException when restaurant does not exist', async () => {
    prismaMock.restaurant.findFirst.mockResolvedValue(null);

    await expect(
      service.update('missing-id', { name: 'Ghost Kitchen' }),
    ).rejects.toThrow(NotFoundException);
    expect(prismaMock.restaurant.update).not.toHaveBeenCalled();
  });

  it('softDelete marks the restaurant as deleted and invalidates caches', async () => {
    prismaMock.restaurant.findFirst.mockResolvedValueOnce({ id: restaurant.id });
    prismaMock.restaurant.update.mockResolvedValue(undefined);
    redisKeysMock.mockResolvedValue(['restaurants:list:{}']);

    await expect(service.softDelete(restaurant.id)).resolves.toBeUndefined();
    expect(prismaMock.restaurant.update).toHaveBeenCalledWith({
      where: { id: restaurant.id },
      data: { deletedAt: expect.any(Date) },
    });
    expect(cacheManagerMock.del).toHaveBeenCalledWith(
      `restaurants:detail:${restaurant.id}`,
    );
    expect(cacheManagerMock.del).toHaveBeenCalledWith('restaurants:list:{}');
  });

  it('softDelete throws NotFoundException when restaurant is already absent', async () => {
    prismaMock.restaurant.findFirst.mockResolvedValue(null);

    await expect(service.softDelete('ghost-id')).rejects.toThrow(NotFoundException);
    expect(prismaMock.restaurant.update).not.toHaveBeenCalled();
  });

  it('create does not fail when Redis pattern invalidation is unavailable', async () => {
    const dto = {
      name: restaurant.name,
      street: restaurant.street,
      city: restaurant.city,
      zipCode: restaurant.zipCode,
      country: restaurant.country,
      cuisineType: restaurant.cuisineType,
      averagePrice: restaurant.averagePrice,
      rating: restaurant.rating,
      ownerId: restaurant.ownerId,
    };

    prismaMock.restaurant.findFirst.mockResolvedValueOnce(null);
    prismaMock.restaurant.create.mockResolvedValue(restaurant);
    cacheManagerMock.store.client = undefined;

    await expect(service.create(dto)).resolves.toEqual(restaurantResponse);
    expect(cacheManagerMock.del).not.toHaveBeenCalled();

    cacheManagerMock.store.client = {
      keys: redisKeysMock,
    };
  });
});
