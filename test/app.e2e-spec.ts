import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { config as loadEnv } from 'dotenv';
import { execSync } from 'node:child_process';
import { Pool } from 'pg';
import * as request from 'supertest';
import { useContainer } from 'class-validator';
import { PrismaService } from '../src/prisma/prisma.service';

loadEnv({ path: '.env.test', quiet: true });
process.env.DATABASE_URL =
  process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL;
process.env.NODE_ENV = 'test';

type MemoryCacheEntry = {
  value: unknown;
};

function createMemoryCacheManager() {
  const store = new Map<string, MemoryCacheEntry>();

  return {
    store: {
      client: {
        keys: async (pattern: string) => {
          if (!pattern.endsWith('*')) {
            return store.has(pattern) ? [pattern] : [];
          }

          const prefix = pattern.slice(0, -1);
          return [...store.keys()].filter((key) => key.startsWith(prefix));
        },
      },
    },
    get: async (key: string) => store.get(key)?.value,
    set: async (key: string, value: unknown) => {
      store.set(key, { value });
    },
    del: async (key: string) => {
      store.delete(key);
    },
  };
}

async function ensureTestDatabaseExists(connectionString: string) {
  const databaseUrl = new URL(connectionString);
  const databaseName = databaseUrl.pathname.replace(/^\//, '');
  const adminUrl = new URL(connectionString);
  adminUrl.pathname = '/postgres';

  const pool = new Pool({ connectionString: adminUrl.toString() });

  try {
    const result = await pool.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [databaseName],
    );

    if (result.rowCount === 0) {
      const escapedDatabaseName = databaseName.replace(/"/g, '""');
      await pool.query(`CREATE DATABASE "${escapedDatabaseName}"`);
    }
  } finally {
    await pool.end();
  }
}

async function cleanupDatabase(prisma: PrismaService) {
  await prisma.category.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menu.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.user.deleteMany();
}

describe('NexusEats API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let appModuleClass: any;

  const authBasePath = '/api/auth';
  const restaurantsBasePath = '/api/v2/restaurants';

  beforeAll(async () => {
    const testDatabaseUrl = process.env.DATABASE_URL_TEST;

    if (!testDatabaseUrl) {
      throw new Error('DATABASE_URL_TEST is not defined');
    }

    process.env.DATABASE_URL = testDatabaseUrl;

    await ensureTestDatabaseExists(testDatabaseUrl);

    execSync('npx prisma migrate deploy', {
      cwd: process.cwd(),
      env: {
        ...process.env,
        DATABASE_URL: testDatabaseUrl,
      },
      stdio: 'inherit',
    });

    const { AppModule } = await import('../src/app.module');
    appModuleClass = AppModule;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(CACHE_MANAGER)
      .useValue(createMemoryCacheManager())
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '2',
    });

    useContainer(app.select(appModuleClass), { fallbackOnErrors: true });

    await app.init();

    prisma = app.get(PrismaService);
    await cleanupDatabase(prisma);
  });

  afterAll(async () => {
    if (prisma) {
      await cleanupDatabase(prisma);
    }
    if (app) {
      await app.close();
    }
  });

  describe('Authentication flow', () => {
    const ownerCredentials = {
      email: `owner-auth-${Date.now()}@nexus.test`,
      password: 'secret123',
      role: 'owner',
    };

    it('POST /auth/register returns 201 with the transformed success payload', async () => {
      const response = await request(app.getHttpServer())
        .post(`${authBasePath}/register`)
        .send(ownerCredentials)
        .expect(201);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          timestamp: expect.any(String),
          requestId: expect.any(String),
          data: expect.objectContaining({
            id: expect.any(Number),
            email: ownerCredentials.email,
            role: 'owner',
            accessToken: expect.any(String),
          }),
        }),
      );
    });

    it('POST /auth/register returns 409 on duplicated email with the global error format', async () => {
      const response = await request(app.getHttpServer())
        .post(`${authBasePath}/register`)
        .send(ownerCredentials)
        .expect(409);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            statusCode: 409,
            message: 'Cet email est déjà utilisé',
            path: `${authBasePath}/register`,
            timestamp: expect.any(String),
            requestId: expect.any(String),
          }),
        }),
      );
    });

    it('POST /auth/login returns 200 with an accessToken', async () => {
      const response = await request(app.getHttpServer())
        .post(`${authBasePath}/login`)
        .send({
          email: ownerCredentials.email,
          password: ownerCredentials.password,
        })
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          timestamp: expect.any(String),
          requestId: expect.any(String),
          data: expect.objectContaining({
            accessToken: expect.any(String),
            email: ownerCredentials.email,
          }),
        }),
      );
    });

    it('POST /auth/login returns 401 on wrong password with the global error format', async () => {
      const response = await request(app.getHttpServer())
        .post(`${authBasePath}/login`)
        .send({
          email: ownerCredentials.email,
          password: 'wrong-password',
        })
        .expect(401);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            statusCode: 401,
            message: 'Identifiants invalides',
            path: `${authBasePath}/login`,
            timestamp: expect.any(String),
            requestId: expect.any(String),
          }),
        }),
      );
    });
  });

  describe('Protected restaurants flow', () => {
    let ownerToken: string;
    let otherOwnerToken: string;
    let customerToken: string;
    let restaurantId: string;

    const buildRestaurantPayload = (name: string) => ({
      name,
      location: {
        address: {
          street: '10 rue des Tests',
          city: 'Paris',
          zipCode: '75010',
          country: 'FR',
        },
        coordinates: {
          lat: 48.8,
          lng: 2.3,
        },
      },
      deliveryRadius: 5,
      cuisine: 'ITALIENNE',
      rating: 4.5,
      averagePrice: 22,
      countryCode: '+33',
      localNumber: '612345678',
      description: 'Restaurant de test e2e',
    });

    const registerAndLogin = async (
      role: 'owner' | 'customer',
      email: string,
    ) => {
      await request(app.getHttpServer())
        .post(`${authBasePath}/register`)
        .send({
          email,
          password: 'secret123',
          role,
        })
        .expect(201);

      const loginResponse = await request(app.getHttpServer())
        .post(`${authBasePath}/login`)
        .send({
          email,
          password: 'secret123',
        })
        .expect(200);

      return loginResponse.body.data.accessToken as string;
    };

    beforeAll(async () => {
      const uniqueSeed = Date.now();
      await new Promise((r) => setTimeout(r, 1100)); // Bypass ThrottlerGuard (10 req/s limit)
      ownerToken = await registerAndLogin(
        'owner',
        `owner-${uniqueSeed}@nexus.test`,
      );
      otherOwnerToken = await registerAndLogin(
        'owner',
        `owner-bis-${uniqueSeed}@nexus.test`,
      );
      customerToken = await registerAndLogin(
        'customer',
        `customer-${uniqueSeed}@nexus.test`,
      );
    });

    it('POST /restaurants without token returns 401', async () => {
      const response = await request(app.getHttpServer())
        .post(restaurantsBasePath)
        .send(buildRestaurantPayload('Sans Token'))
        .expect(401);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            statusCode: 401,
            path: restaurantsBasePath,
            timestamp: expect.any(String),
            requestId: expect.any(String),
          }),
        }),
      );
    });

    it('POST /restaurants with owner token returns 201', async () => {
      const payload = buildRestaurantPayload('Trattoria E2E');

      const response = await request(app.getHttpServer())
        .post(restaurantsBasePath)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(payload)
        .expect(201);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          timestamp: expect.any(String),
          requestId: expect.any(String),
          data: expect.objectContaining({
            id: expect.any(String),
            name: payload.name,
            ownerId: expect.any(Number),
            location: expect.objectContaining({
              address: expect.objectContaining({
                street: '10 rue des Tests',
                city: 'Paris',
              }),
            }),
          }),
        }),
      );

      restaurantId = response.body.data.id;
    });

    it('GET /restaurants returns 200 with a non-empty array', async () => {
      const response = await request(app.getHttpServer())
        .get(restaurantsBasePath)
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          timestamp: expect.any(String),
          requestId: expect.any(String),
          data: expect.objectContaining({
            data: expect.arrayContaining([
              expect.objectContaining({
                id: restaurantId,
                name: 'Trattoria E2E',
              }),
            ]),
            meta: expect.objectContaining({
              total: expect.any(Number),
              page: 1,
            }),
          }),
        }),
      );
    });

    it('GET /restaurants/:id returns 200 for an existing restaurant', async () => {
      const response = await request(app.getHttpServer())
        .get(`${restaurantsBasePath}/${restaurantId}`)
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          timestamp: expect.any(String),
          requestId: expect.any(String),
          data: expect.objectContaining({
            id: restaurantId,
            name: 'Trattoria E2E',
          }),
        }),
      );
    });

    it('GET /restaurants/:id returns 404 for a missing restaurant', async () => {
      const missingRestaurantId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

      const response = await request(app.getHttpServer())
        .get(`${restaurantsBasePath}/${missingRestaurantId}`)
        .expect(404);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            statusCode: 404,
            message: `Restaurant ${missingRestaurantId} introuvable`,
            path: `${restaurantsBasePath}/${missingRestaurantId}`,
            timestamp: expect.any(String),
            requestId: expect.any(String),
          }),
        }),
      );
    });

    it('PATCH /restaurants/:id returns 403 for a different owner', async () => {
      const response = await request(app.getHttpServer())
        .patch(`${restaurantsBasePath}/${restaurantId}`)
        .set('Authorization', `Bearer ${otherOwnerToken}`)
        .send({ description: 'Tentative de modification interdite' })
        .expect(403);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            statusCode: 403,
            message: "Vous n'êtes pas le propriétaire de ce restaurant",
            path: `${restaurantsBasePath}/${restaurantId}`,
            timestamp: expect.any(String),
            requestId: expect.any(String),
          }),
        }),
      );
    });

    it('DELETE /restaurants/:id returns 403 for a customer role', async () => {
      const response = await request(app.getHttpServer())
        .delete(`${restaurantsBasePath}/${restaurantId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            statusCode: 403,
            message: 'Accès refusé. Rôle requis : admin',
            path: `${restaurantsBasePath}/${restaurantId}`,
            timestamp: expect.any(String),
            requestId: expect.any(String),
          }),
        }),
      );
    });

    it('POST /restaurants concurrently with the same payload yields one 201 and one 409', async () => {
      const payload = buildRestaurantPayload(`Concurrent-${Date.now()}`);

      const [firstResponse, secondResponse] = await Promise.all([
        request(app.getHttpServer())
          .post(restaurantsBasePath)
          .set('Authorization', `Bearer ${ownerToken}`)
          .send(payload),
        request(app.getHttpServer())
          .post(restaurantsBasePath)
          .set('Authorization', `Bearer ${ownerToken}`)
          .send(payload),
      ]);

      const statuses = [firstResponse.status, secondResponse.status].sort(
        (left, right) => left - right,
      );

      expect(statuses).toEqual([201, 409]);

      const conflictResponse = [firstResponse, secondResponse].find(
        (response) => response.status === 409,
      );

      expect(conflictResponse?.body).toEqual(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            statusCode: 409,
            message: 'Un restaurant avec ce nom et cette adresse existe déjà',
          }),
        }),
      );
    });
  });

  describe('Response format verification', () => {
    it('TransformInterceptor wraps successful responses with success, data and timestamp', async () => {
      const response = await request(app.getHttpServer())
        .get(restaurantsBasePath)
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          data: expect.any(Object),
          timestamp: expect.any(String),
          requestId: expect.any(String),
        }),
      );
    });

    it('GlobalExceptionFilter wraps error responses with success false and error metadata', async () => {
      const response = await request(app.getHttpServer())
        .get(`${restaurantsBasePath}/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa`)
        .expect(404);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            statusCode: 404,
            message: expect.any(String),
            path: '/api/v2/restaurants/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            timestamp: expect.any(String),
            requestId: expect.any(String),
          }),
        }),
      );
    });
  });
});
