import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import * as path from 'node:path';

const { like, uuid, timestamp } = MatchersV3;

describe('Restaurant consumer contract', () => {
  const restaurantId = '11111111-1111-4111-8111-111111111111';
  const provider = new PactV3({
    consumer: 'front',
    provider: 'nexuseats-api',
    dir: path.resolve(process.cwd(), 'pacts'),
  });

  it('generates a pact for GET /api/v2/restaurants/:id', async () => {
    provider
      .given('a restaurant with id 11111111-1111-4111-8111-111111111111 exists')
      .uponReceiving('a request for a restaurant by id')
      .withRequest({
        method: 'GET',
        path: `/api/v2/restaurants/${restaurantId}`,
      })
      .willRespondWith({
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: like({
          success: true,
          data: like({
            id: uuid(restaurantId),
            name: like('La Bella Italia'),
            cuisine: like('ITALIENNE'),
            location: like({
              address: like({
                street: like('12 rue de la Paix'),
                city: like('Paris'),
                zipCode: like('75002'),
                country: like('FR'),
              }),
              coordinates: like({
                lat: like(48.8),
                lng: like(2.3),
              }),
            }),
          }),
          timestamp: timestamp(
            "yyyy-MM-dd'T'HH:mm:ss.SSSX",
            '2026-03-21T12:00:00.000Z',
          ),
        }),
      });

    await provider.executeTest(async (mockServer) => {
      const response = await fetch(
        `${mockServer.url}/api/v2/restaurants/${restaurantId}`,
      );
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(restaurantId);
      expect(body.data.name).toBe('La Bella Italia');
      expect(body.data.cuisine).toBe('ITALIENNE');
      expect(body.data.location.address.city).toBe('Paris');
    });
  });
});
