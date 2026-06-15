// Module racine : regroupe les modules du service
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthController } from '../health/health.controller';
import { AuditModule } from '../audit/audit.module';

// URI MongoDB depuis les variables d'environnement
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/audit';

@Module({
  imports: [
    // Connexion a MongoDB via Mongoose
    MongooseModule.forRoot(MONGO_URI),
    AuditModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
