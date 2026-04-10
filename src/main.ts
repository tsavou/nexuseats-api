import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ErrorResponseDto } from './common/dto/error-response.dto';
import { useContainer } from 'class-validator';
import * as compression from 'compression';
import { availableParallelism } from 'node:os';
import type { Cluster, Worker } from 'cluster';

const cluster: Cluster = require('cluster');

async function bootstrapWorker() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  app.setGlobalPrefix('api');
  app.use(
    compression({
      threshold: 1024,
      level: 6,
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Supprime les champs non décorés
      forbidNonWhitelisted: true, // REJETTE les champs inconnus (400)
      transform: true, // Convertit les types (string → number)
      transformOptions: {
        enableImplicitConversion: true, // @Query('page') → number auto
      },
    }),
  );

  // ── CORS (pour le front-end) ──
  app.enableCors({
    origin: ['http://localhost:5173'], // Vite dev server
    credentials: true,
  });

  // ── Injection de dépendances dans les validateurs ──
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '2',
  });

  const config = new DocumentBuilder()
    .setTitle('NexusEats API')
    .setDescription(
      'API de livraison de repas NexusEats — plateforme complète pour ' +
        'la gestion des restaurants, menus, commandes et authentification. ' +
        'Utilisez le bouton **Authorize** ci-dessous pour tester les endpoints protégés avec votre JWT.',
    )
    .setVersion('2.0')
    .setContact(
      'Équipe NexusEats',
      'https://nexuseats.dev',
      'api@nexuseats.dev',
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addTag('auth', '🔐 Authentification JWT — inscription, connexion, profil')
    .addTag(
      'restaurants-v2',
      '🟢 [CURRENT] CRUD restaurants enrichis (location GPS + rayon de livraison)',
    )
    .addTag(
      'restaurants-v1',
      '⚠️ [LEGACY] CRUD restaurants classique (format address plat, sans GPS)',
    )
    .addTag('menus', '📋 Gestion des menus rattachés aux restaurants')
    .addTag('menu-items', '🍕 Gestion des items de menu et catégories')
    .addTag('orders', '📦 Commandes via le gateway RabbitMQ')
    .addTag('health', '💚 Santé de l\'application et métriques')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Entrez le token JWT obtenu via POST /api/auth/login. Format : Bearer <token>',
      },
      'JWT-auth',
    )
    .build();

  const doc = SwaggerModule.createDocument(app, config, {
    extraModels: [ErrorResponseDto],
  });
  SwaggerModule.setup('api-docs', app, doc, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      tagsSorter: 'alpha',
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(
    `🚀 Worker ${process.pid} running NexusEats API on http://localhost:${port}/api/v1`,
  );
  logger.log(
    `📚 Swagger documentation available at http://localhost:${port}/api-docs`,
  );
}

function bootstrapCluster() {
  const logger = new Logger('Cluster');

  if (cluster.isPrimary) {
    const workerCount = availableParallelism();
    logger.log(
      `Primary ${process.pid} starting ${workerCount} workers for clustering`,
    );

    for (let index = 0; index < workerCount; index += 1) {
      cluster.fork();
    }

    cluster.on('exit', (worker: Worker, code: number, signal: string) => {
      logger.warn(
        `Worker ${worker.process.pid} died (code=${code}, signal=${signal ?? 'none'}). Restarting...`,
      );
      cluster.fork();
    });

    return;
  }

  void bootstrapWorker();
}

bootstrapCluster();
