// Module racine : regroupe les modules du service
import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [NotificationModule],
  controllers: [HealthController],
})
export class AppModule {}
