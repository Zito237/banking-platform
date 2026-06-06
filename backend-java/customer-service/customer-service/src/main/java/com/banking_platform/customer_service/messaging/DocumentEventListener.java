package com.banking_platform.customer_service.messaging;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  DocumentEventListener.java — Consommateur d'evenements RabbitMQ            ║
 * ║                                                                              ║
 * ║  Ecoute la queue "document.processed.queue" et traite les resultats OCR.    ║
 * ║                                                                              ║
 * ║  Quand un document est traite par l'OCR :                                    ║
 * ║  1. Ce listener recoit l'evenement DocumentProcessed                         ║
 * ║  2. Il marque le document comme "verified = true"                             ║
 * ║  3. Si le score de confiance est bon (> 0.7), il met a jour le KYC a VERIFIED  ║
 * ║  4. Sinon, le KYC passe a REJECTED                                           ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import com.banking_platform.customer_service.config.RabbitMQConfig;
import com.banking_platform.customer_service.entity.DocumentReference;
import com.banking_platform.customer_service.entity.KycStatus;
import com.banking_platform.customer_service.repository.CustomerRepository;
import com.banking_platform.customer_service.repository.DocumentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class DocumentEventListener {

    private static final Logger logger = LoggerFactory.getLogger(DocumentEventListener.class);

    private final DocumentRepository documentRepository;
    private final CustomerRepository customerRepository;

    public DocumentEventListener(DocumentRepository documentRepository,
                                  CustomerRepository customerRepository) {
        this.documentRepository = documentRepository;
        this.customerRepository = customerRepository;
    }

    /**
     * Consomme l'evenement "document.processed".
     * Met a jour le statut du document et le KYC du client.
     */
    @RabbitListener(queues = RabbitMQConfig.QUEUE_DOCUMENT_PROCESSED)
    public void handleDocumentProcessed(DocumentProcessedEvent event) {
        logger.info("Document traite recu : documentId={}, confidence={}",
                event.getDocumentId(), event.getConfidence());

        // Cherche le document en base
        DocumentReference document = documentRepository.findById(event.getDocumentId())
                .orElse(null);

        if (document == null) {
            logger.error("Document non trouve : {}", event.getDocumentId());
            return;
        }

        // Marque le document comme verifie
        document.setVerified(true);
        documentRepository.save(document);
        logger.info("Document {} marque comme verifie", event.getDocumentId());

        // Met a jour le KYC du client selon le score de confiance
        var customer = customerRepository.findById(document.getCustomer().getId()).orElse(null);
        if (customer != null) {
            if (event.getConfidence() >= 0.7f) {
                customer.setKycStatus(KycStatus.VERIFIED);
                logger.info("KYC du client {} passe a VERIFIED (confidence={})",
                        customer.getId(), event.getConfidence());
            } else {
                customer.setKycStatus(KycStatus.REJECTED);
                logger.warn("KYC du client {} passe a REJECTED (confidence={})",
                        customer.getId(), event.getConfidence());
            }
            customerRepository.save(customer);
        }
    }
}
