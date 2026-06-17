// Service d'audit : consommateur RabbitMQ + logique de stockage MongoDB
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { AuditLog } from '../schema/audit-log.schema';


@Injectable()
export class AuditService implements OnModuleInit {

  // Injection du modele MongoDB AuditLog
  constructor(
    @InjectModel(AuditLog.name) private auditModel: Model<AuditLog>,
  ) {}

  // Au demarrage du module
  onModuleInit() {
    console.log('[AUDIT] Service d\'audit initialise');
    console.log('[AUDIT] En attente des evenements RabbitMQ (toutes les routing keys #)...');

  }

  // ============================================================
  // PATTERN "#" : capture TOUS les evenements de l'exchange
  // Le symbole # en RabbitMQ signifie "tous les sous-niveaux"
  // ============================================================
  @EventPattern('#')
  async handleAllEvents(
    @Payload() data: any,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    // Recupere la routing key du message recu
    const routingKey = context.getPattern();

    // Extrait les infos de l'evenement
    const actor = this.extractActor(data, routingKey);
    const action = this.formatAction(routingKey);
    const resource = this.extractResource(routingKey);

    // Cree l'entree d'audit dans MongoDB
    const auditEntry = new this.auditModel({
      actor,
      action,
      resource,
      payload: data,
      routingKey,
      timestamp: new Date(),
    });

    await auditEntry.save();

    // Journalise dans la console
    console.log('');
    console.log('============================================================');
    console.log('[AUDIT] 📋 NOUVELLE ENTREE D\'AUDIT ENREGISTREE');
    console.log('============================================================');

    console.log(`  Routing Key : ${routingKey}`);
    console.log(`  Acteur      : ${actor}`);
    console.log(`  Action      : ${action}`);
    console.log(`  Ressource   : ${resource}`);
    console.log(`  Timestamp   : ${new Date().toISOString()}`);
    console.log(`  ID MongoDB  : ${auditEntry._id}`);
    console.log('============================================================');

    // Acquitte le message (supprime de la file)
    channel.ack(originalMsg);
  }

  // ============================================================
  // Recherche paginee des logs d'audit (pour l'admin)
  // ============================================================
  async findLogs(filters: {
    resource?: string;
    actor?: string;
    action?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) {
    const { resource, actor, action, from, to, page = 1, limit = 20 } = filters;

    // Construction du filtre MongoDB
    const query: any = {};

    if (resource) query.resource = resource;
    if (actor) query.actor = actor;
    if (action) query.action = action;
    if (from || to) {
      query.timestamp = {};
      if (from) query.timestamp.$gte = new Date(from);
      if (to) query.timestamp.$lte = new Date(to);
    }

    // Compte total pour la pagination
    const total = await this.auditModel.countDocuments(query);

    // Recupere les logs avec pagination (du plus recent au plus ancien)
    const logs = await this.auditModel
      .find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    return {
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  // ============================================================
  // Helpers : extraction des infos depuis l'evenement
  // ============================================================

  private extractActor(data: any, routingKey: string): string {
    // Essaie de trouver l'identifiant de l'acteur dans le payload
    if (data.customerId || data.customer_id) {
      return `client:${data.customerId || data.customer_id}`;
    }
    if (data.operatorId || data.operator_id) {
      return `operator:${data.operatorId || data.operator_id}`;
    }
    if (data.userId || data.user_id) {
      return `user:${data.userId || data.user_id}`;
    }
    if (data.actor) {
      return data.actor;
    }
    // Par defaut, utilise la routing key comme identifiant
    return `system:${routingKey}`;
  }

  private formatAction(routingKey: string): string {
    // Convertit "transaction.completed" en "TRANSACTION_COMPLETED"
    return routingKey.toUpperCase().replace(/\./g, '_');
  }

  private extractResource(routingKey: string): string {
    // Extrait la ressource depuis la routing key
    // "transaction.completed" -> "transaction"
    // "loan.approved" -> "loan"
    const parts = routingKey.split('.');
    return parts[0] || 'unknown';
  }
}
