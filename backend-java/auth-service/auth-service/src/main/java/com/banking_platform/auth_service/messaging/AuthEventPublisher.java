package com.banking_platform.auth_service.messaging;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  AuthEventPublisher.java — Publie les evenements d'authentification          ║
 * ║                                                                              ║
 * ║  Publie "auth.login" / "auth.register" sur l'exchange "banking.events".     ║
 * ║  Consomme par operator-service pour alimenter le journal d'audit.           ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import com.banking_platform.auth_service.config.RabbitMQConfig;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Map;

@Component
public class AuthEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    public AuthEventPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publishRegister(String username) {
        publish(RabbitMQConfig.ROUTING_KEY_REGISTER, username);
    }

    public void publishLogin(String username) {
        publish(RabbitMQConfig.ROUTING_KEY_LOGIN, username);
    }

    private void publish(String routingKey, String username) {
        Map<String, Object> event = Map.of(
                "username", username,
                "timestamp", LocalDateTime.now().toString()
        );
        rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE_NAME, routingKey, event);
    }
}
