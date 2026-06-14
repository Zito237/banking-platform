package com.banking_platform.auth_service.config;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  RabbitMQConfig.java — Configuration RabbitMQ pour l'auth-service             ║
 * ║                                                                              ║
 * ║  Publie les evenements "auth.login" et "auth.register" sur l'exchange       ║
 * ║  TOPIC "banking.events", consommes par operator-service pour alimenter      ║
 * ║  le journal d'audit.                                                         ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE_NAME = "banking.events";
    public static final String ROUTING_KEY_LOGIN = "auth.login";
    public static final String ROUTING_KEY_REGISTER = "auth.register";

    @Bean
    public TopicExchange bankingExchange() {
        return new TopicExchange(EXCHANGE_NAME);
    }

    @Bean
    public Jackson2JsonMessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter());
        return template;
    }
}
