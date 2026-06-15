// Point d'entree de l'application NestJS
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // Cree l'application NestJS en mode HTTP (pour les endpoints REST)
  const app = await NestFactory.create(AppModule);

  // Active CORS pour le frontend
  app.enableCors();

  // Ecoute sur le port 9009
  const port = process.env.PORT || 9009;
  await app.listen(port);

  console.log(`[AUDIT] Service HTTP demarre sur le port ${port}`);
  console.log(`[AUDIT] Health check : http://localhost:${port}/health`);
  console.log(`[AUDIT] Logs audit : http://localhost:${port}/audit`);
}

bootstrap();
