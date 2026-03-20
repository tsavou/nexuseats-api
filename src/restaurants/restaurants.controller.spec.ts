import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { OwnershipGuard } from '../auth/guards/ownership.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PrismaService } from '../prisma/prisma.service';
import { RestaurantsV1Controller } from './restaurants-v1.controller';
import { RestaurantsService } from './restaurants.service';

describe('RestaurantsController', () => {
  let controller: RestaurantsV1Controller;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RestaurantsV1Controller],
      providers: [
        {
          provide: RestaurantsService,
          useValue: {},
        },
        {
          provide: RolesGuard,
          useValue: { canActivate: jest.fn() },
        },
        {
          provide: OwnershipGuard,
          useValue: { canActivate: jest.fn() },
        },
        {
          provide: PrismaService,
          useValue: {
            restaurant: {
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<RestaurantsV1Controller>(RestaurantsV1Controller);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
