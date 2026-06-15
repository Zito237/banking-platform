package com.banking_platform.customer_service.messaging;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  NotificationEventListener.java — Genere les notifications client            ║
 * ║                                                                              ║
 * ║  Ecoute la queue "customer.notifications.queue" (liee a "loan.*") et cree   ║
 * ║  une notification pour le client concerne lorsqu'un pret est approuve ou    ║
 * ║  rejete.                                                                     ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import com.banking_platform.customer_service.config.RabbitMQConfig;
import com.banking_platform.customer_service.entity.Notification;
import com.banking_platform.customer_service.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;

@Component
public class NotificationEventListener {

    private static final Logger logger = LoggerFactory.getLogger(NotificationEventListener.class);

    private final NotificationRepository notificationRepository;

    public NotificationEventListener(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @RabbitListener(queues = RabbitMQConfig.QUEUE_LOAN_NOTIFICATIONS)
    public void handleLoanDecision(Map<String, Object> payload, @Header(AmqpHeaders.RECEIVED_ROUTING_KEY) String routingKey) {
        Object customerIdValue = payload.get("customerId");
        if (customerIdValue == null) {
            logger.warn("Evenement {} sans customerId, notification ignoree : {}", routingKey, payload);
            return;
        }
        UUID customerId = UUID.fromString(customerIdValue.toString());

        String message = switch (routingKey) {
            case "loan.approved" -> String.format(
                    "Votre demande de pret de %s a ete approuvee (taux %s%%, duree %s mois).",
                    payload.get("principal"), payload.get("interestRate"), payload.get("termMonths"));
            case "loan.rejected" -> "Votre demande de pret a ete rejetee : " + payload.get("reason");
            default -> null;
        };

        if (message == null) {
            return;
        }

        notificationRepository.save(new Notification(customerId, message));
        logger.info("Notification creee pour le client {} : {}", customerId, message);
    }
}
