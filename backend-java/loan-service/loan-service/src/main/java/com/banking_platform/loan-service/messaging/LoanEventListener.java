package com.banking_platform.loan_service.messaging;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  LoanEventListener.java — Consommateur d'événements RabbitMQ                 ║
 * ║                                                                              ║
 * ║  Écoute :                                                                    ║
 * ║  • "document.processed" → enrichit l'analyse du dossier de prêt             ║
 * ║                                                                              ║
 * ║  Quand un document est traité par l'OCR, ce listener met à jour             ║
 * ║  les informations du client pour l'analyse du dossier de prêt.            ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import com.banking_platform.loan_service.config.RabbitMQConfig;
import com.banking_platform.loan_service.messaging.DocumentProcessedEvent;

@Component
public class LoanEventListener {

    private static final Logger logger = LoggerFactory.getLogger(LoanEventListener.class);

    @RabbitListener(queues = RabbitMQConfig.QUEUE_LOAN_EVENTS)
    public void handleDocumentProcessed(DocumentProcessedEvent event) {
        logger.info("Document traité reçu pour analyse de prêt : documentId={}, customerId={}, confidence={}",
                event.getDocumentId(), event.getCustomerId(), event.getConfidence());

        // Enrichissement du dossier de prêt avec les données OCR
        // Par exemple : vérification de l'identité, du domicile, du revenu...
        if (event.getFields() != null) {
            logger.info("Champs extraits : {}", event.getFields());
            // Ici on pourrait mettre à jour une table d'analyse de dossier
            // ou marquer le dossier comme "prêt pour révision"
        }

        // Si le score de confiance est faible, on pourrait marquer le dossier
        // comme nécessitant une vérification manuelle
        if (event.getConfidence() < 0.7f) {
            logger.warn("Score de confiance faible ({}) pour le document {} - vérification manuelle recommandée",
                    event.getConfidence(), event.getDocumentId());
        }
    }
}
