import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  app.setGlobalPrefix('api/v1'); 

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,              // Supprime les champs non décorés
    forbidNonWhitelisted: true,   // REJETTE les champs inconnus (400)
    transform: true,              // Convertit les types (string → number)
    transformOptions: {
      enableImplicitConversion: true,  // @Query('page') → number auto
    },
  }));

// ── CORS (pour le front-end) ──
  app.enableCors({
    origin: ['http://localhost:5173'],   // Vite dev server
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('NexusEats API')
    .setDescription('API de livraison de repas NexusEats')
    .setVersion('1.0')
.addTag('restaurants', 'CRUD des restaurants partenaires NexusEats')
    .build();
  
  const doc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, doc);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`🚀 NexusEats API running on http://localhost:${port}/api/v1`);
}
bootstrap();


