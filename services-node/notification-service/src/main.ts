// Point d'entree de l'application NestJS
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // Cree l'application NestJS en mode HTTP (pour l'endpoint /health)
  const app = await NestFactory.create(AppModule);

  // Active CORS pour le frontend
  app.enableCors();

  // Ecoute sur le port 9002
  const port = process.env.PORT || 9002;
  await app.listen(port);

  console.log(`[NOTIFICATION] Service HTTP demarre sur le port ${port}`);
  console.log(`[NOTIFICATION] Health check : http://localhost:${port}/health`);
}

bootstrap();
