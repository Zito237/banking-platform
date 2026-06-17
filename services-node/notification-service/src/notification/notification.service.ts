// Service de notification : ecoute RabbitMQ et simule l'envoi de notifications
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client, ClientRMQ, Transport } from '@nestjs/microservices';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';

// Interface des evenements recus
interface TransactionEvent {
  id: string;
  reference: string;
  amount: number;
  customerId?: string;
  customer_id?: string;
}

interface LoanEvent {
  id: string;
  customerId?: string;
  customer_id?: string;
  principal?: number;
}

interface AccountEvent {
  id: string;
  customerId?: string;
  customer_id?: string;
  accountNumber?: string;
}

@Injectable()
export class NotificationService implements OnModuleInit {

  // Au demarrage du module
  onModuleInit() {
    console.log('[NOTIFICATION] Service de notification initialise');
    console.log('[NOTIFICATION] En attente des evenements RabbitMQ...');
  }

  // ============================================================
  // PATTERN 1 : transaction.completed
  // Quand une transaction est terminee, on notifie le client
  // ============================================================
  @EventPattern('transaction.completed')
  async handleTransactionCompleted(
    @Payload() data: TransactionEvent,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    // Extrait l'identifiant client (snake_case ou camelCase selon l'emetteur)
    const customerId = data.customerId || data.customer_id || 'inconnu';
    const reference = data.reference || data.id;
    const amount = data.amount || 0;

    // Simule l'envoi d'une notification (en vrai : appel API SMS/email)
    console.log('');
    console.log('============================================================');
    console.log('[NOTIFICATION] 📧 NOUVELLE NOTIFICATION CLIENT');
    console.log('============================================================');
    console.log(`  Destinataire : Client ${customerId}`);
    console.log(`  Canal        : SMS + Email (simule)`);
    console.log(`  Sujet        : Transaction reussie`);
    console.log(`  Message      : Votre transaction ${reference} de ${amount} XAF a ete effectuee avec succes.`);
    console.log('============================================================');

    // Acquitte le message (supprime de la file)
    channel.ack(originalMsg);
  }

  // ============================================================
  // PATTERN 2 : loan.approved
  // Quand un pret est approuve, on notifie le client
  // ============================================================
  @EventPattern('loan.approved')
  async handleLoanApproved(
    @Payload() data: LoanEvent,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    const customerId = data.customerId || data.customer_id || 'inconnu';
    const principal = data.principal || 0;

    console.log('');
    console.log('============================================================');
    console.log('[NOTIFICATION] 📧 NOUVELLE NOTIFICATION CLIENT');
    console.log('============================================================');
    console.log(`  Destinataire : Client ${customerId}`);
    console.log(`  Canal        : SMS + Email (simule)`);
    console.log(`  Sujet        : Pret approuve`);
    console.log(`  Message      : Bonne nouvelle ! Votre demande de pret de ${principal} XAF a ete approuvee. L'echeancier est disponible dans votre espace.`);
    console.log('============================================================');

    channel.ack(originalMsg);
  }

  // ============================================================
  // PATTERN 3 : account.opened
  // Quand un compte est ouvert, on notifie le client
  // ============================================================
  @EventPattern('account.opened')
  async handleAccountOpened(
    @Payload() data: AccountEvent,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    const customerId = data.customerId || data.customer_id || 'inconnu';
    const accountNumber = data.accountNumber || data.id;

    console.log('');
    console.log('============================================================');
    console.log('[NOTIFICATION] 📧 NOUVELLE NOTIFICATION CLIENT');
    console.log('============================================================');
    console.log(`  Destinataire : Client ${customerId}`);
    console.log(`  Canal        : SMS + Email (simule)`);
    console.log(`  Sujet        : Ouverture de compte`);
    console.log(`  Message      : Felicitations ! Votre compte ${accountNumber} a ete ouvert avec succes. Vous pouvez des maintenant effectuer des operations.`);
    console.log('============================================================');

    channel.ack(originalMsg);
  }
}
