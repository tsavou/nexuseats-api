import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  app.setGlobalPrefix('api');

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
    .setDescription('API de livraison de repas NexusEats')
    .setVersion('2.0')
    .addTag(
      'restaurants-v1',
      '⚠️ [DEPRECATED] API utilisant le champ global phoneNumber',
    )
    .addTag(
      'restaurants-v2',
      '✅ [CURRENT] API utilisant countryCode et localNumber',
    )
    .addTag('menus', 'API de gestion des menus')
    .addTag('menu-items', 'API de gestion des items de menu')
    .addTag('auth', 'Authentification JWT')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT-auth', // This is the name of the security requirement
    )
    .build();

  const doc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, doc);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`🚀 NexusEats API running on http://localhost:${port}/api/v1`);
  logger.log(
    `📚 Swagger documentation available at http://localhost:${port}/api-docs`,
  );
}
bootstrap();
