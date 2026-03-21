import { INestApplication } from '@nestjs/common';
import { Verifier } from '@pact-foundation/pact';
import { CuisineType } from '@prisma/client';
import * as path from 'node:path';
import { PrismaService } from '../../src/prisma/prisma.service';
import { bootstrapTestApp, cleanupDatabase, closeTestApp } from './test-app';

describe('Restaurant provider verification', () => {
  let app: INestApplication | undefined;
  let prisma: PrismaService | undefined;
  let baseUrl = '';

  beforeAll(async () => {
    const bootstrap = await bootstrapTestApp();
    app = bootstrap.app;
    prisma = bootstrap.prisma;

    await app.listen(0);

    const address = app.getHttpServer().address();
    if (!address || typeof address === 'string') {
      throw new Error('Unable to resolve test server address');
    }

    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await closeTestApp(app, prisma);
  });

  it('verifies the front contract against the Nest provider', async () => {
    const verifier = new Verifier({
      provider: 'nexuseats-api',
      providerBaseUrl: baseUrl,
      pactUrls: [path.resolve(process.cwd(), 'pacts/front-nexuseats-api.json')],
      stateHandlers: {
        'a restaurant with id 11111111-1111-4111-8111-111111111111 exists':
          async () => {
            if (!prisma) {
              throw new Error('Prisma is not initialized');
            }

            await cleanupDatabase(prisma);

            const owner = await prisma.user.create({
              data: {
                email: 'owner-contract@nexus.test',
                password: 'hashed-password',
                role: 'owner',
              },
            });

            await prisma.restaurant.create({
              data: {
                id: '11111111-1111-4111-8111-111111111111',
                name: 'La Bella Italia',
                street: '12 rue de la Paix',
                city: 'Paris',
                zipCode: '75002',
                country: 'FR',
                cuisineType: CuisineType.ITALIENNE,
                rating: 4.6,
                averagePrice: 25,
                countryCode: '+33',
                localNumber: '612345678',
                description: 'Restaurant italien authentique au coeur de Paris',
                ownerId: owner.id,
                menus: {
                  create: [
                    {
                      id: '22222222-2222-4222-8222-222222222222',
                      name: 'Menu Midi',
                      description: 'Formule déjeuner',
                    },
                  ],
                },
              },
            });
          },
      },
    });

    const verificationResult = await verifier.verifyProvider();
    const parsedResult = JSON.parse(verificationResult) as {
      result: boolean;
      errors: unknown[];
    };

    expect(parsedResult.result).toBe(true);
    expect(parsedResult.errors).toHaveLength(0);
  });
});
