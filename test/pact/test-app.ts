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
import { useContainer } from 'class-validator';
import { PrismaService } from '../../src/prisma/prisma.service';

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

export async function cleanupDatabase(prisma: PrismaService) {
  await prisma.category.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menu.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.user.deleteMany();
}

export async function bootstrapTestApp() {
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

  const { AppModule } = await import('../../src/app.module');

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(CACHE_MANAGER)
    .useValue(createMemoryCacheManager())
    .compile();

  const app = moduleFixture.createNestApplication();
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

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  await app.init();

  const prisma = app.get(PrismaService);
  await cleanupDatabase(prisma);

  return { app, prisma };
}

export async function closeTestApp(
  app: INestApplication | undefined,
  prisma: PrismaService | undefined,
) {
  if (prisma) {
    await cleanupDatabase(prisma);
  }
  if (app) {
    await app.close();
  }
}
