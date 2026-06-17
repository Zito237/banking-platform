// Schema MongoDB pour les entrees d'audit
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

// Type du document MongoDB (avec les methodes Mongoose)
export type AuditLogDocument = HydratedDocument<AuditLog>;

@Schema({ timestamps: true })
export class AuditLog {
  // Acteur qui a declenche l'action (ex: "client-123", "operator-456")
  @Prop({ required: true, index: true })
  actor: string;

  // Action realisee (ex: "TRANSACTION_DEPOSIT", "LOAN_APPROVED")
  @Prop({ required: true, index: true })
  action: string;

  // Ressource concernee (ex: "account", "loan", "transaction")
  @Prop({ required: true, index: true })
  resource: string;

  // Payload complet de l'evenement (stocke en JSON)
  @Prop({ type: Object })
  payload: Record<string, any>;

  // Routing key RabbitMQ d'origine
  @Prop()
  routingKey: string;

  // Timestamp de l'evenement (fourni par l'emetteur ou genere ici)
  @Prop({ required: true, index: true })
  timestamp: Date;
}

// Cree le schema Mongoose a partir de la classe
export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

// Index compose pour les recherches frequentes
AuditLogSchema.index({ resource: 1, timestamp: -1 });
AuditLogSchema.index({ actor: 1, timestamp: -1 });
