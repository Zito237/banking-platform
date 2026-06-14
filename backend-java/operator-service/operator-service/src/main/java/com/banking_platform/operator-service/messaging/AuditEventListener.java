package com.banking_platform.operator_service.messaging;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  AuditEventListener.java — Consommateur d'evenements pour le journal d'audit ║
 * ║                                                                              ║
 * ║  Ecoute la queue "audit.events.queue" (liee a auth.*, loan.*,                ║
 * ║  transaction.* et document.*) et transforme chaque evenement en une         ║
 * ║  ligne du journal d'audit (action, userId, horodatage, details).            ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import com.banking_platform.operator_service.config.RabbitMQConfig;
import com.banking_platform.operator_service.entity.AuditLog;
import com.banking_platform.operator_service.repository.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Map;

@Component
public class AuditEventListener {

    private static final Logger logger = LoggerFactory.getLogger(AuditEventListener.class);

    private final AuditLogRepository auditLogRepository;

    public AuditEventListener(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @RabbitListener(queues = RabbitMQConfig.QUEUE_AUDIT_EVENTS)
    public void handleEvent(Map<String, Object> payload, @Header(AmqpHeaders.RECEIVED_ROUTING_KEY) String routingKey) {
        logger.info("Evenement d'audit recu : routingKey={}, payload={}", routingKey, payload);

        String userId = extractUserId(payload);
        String details = buildDetails(routingKey, payload);

        AuditLog entry = new AuditLog(routingKey, userId, LocalDateTime.now(), details);
        auditLogRepository.save(entry);
    }

    private String extractUserId(Map<String, Object> payload) {
        for (String key : new String[]{"username", "customerId", "sourceAccountId", "destinationAccountId",
                "accountId", "transactionId", "applicationId", "documentId", "loanId"}) {
            Object value = payload.get(key);
            if (value != null) {
                return value.toString();
            }
        }
        return null;
    }

    private String buildDetails(String routingKey, Map<String, Object> payload) {
        switch (routingKey) {
            case "auth.register":
                return "Inscription d'un nouvel utilisateur : " + payload.get("username");
            case "auth.login":
                return "Connexion de l'utilisateur : " + payload.get("username");
            case "loan.approved":
                return String.format("Pret approuve : montant=%s, taux=%s, duree=%s mois",
                        payload.get("principal"), payload.get("interestRate"), payload.get("termMonths"));
            case "loan.rejected":
                return "Pret rejete : " + payload.get("reason");
            case "transaction.completed":
                return String.format("Transaction %s effectuee : montant=%s (ref %s)",
                        payload.get("type"), payload.get("amount"), payload.get("reference"));
            case "transaction.failed":
                return "Transaction echouee (ref " + payload.get("reference") + ") : " + payload.get("reason");
            case "document.submitted":
                return "Document soumis : type=" + payload.get("documentType");
            case "document.processed":
                return "Document traite par l'OCR (confiance=" + payload.get("confidence") + ")";
            default:
                return payload.toString();
        }
    }
}
