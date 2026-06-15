// Module d'audit : regroupe le schema MongoDB, le service et le controleur
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { AuditLog, AuditLogSchema } from '../schema/audit-log.schema';


@Module({
  imports: [
    // Enregistre le schema MongoDB pour le modele AuditLog
    MongooseModule.forFeature([{ name: AuditLog.name, schema: AuditLogSchema }]),
  ],
  controllers: [AuditController],
  providers: [AuditService],
})
export class AuditModule {}
