package com.banking_platform.loan_service.config;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  RabbitMQConfig.java — Configuration RabbitMQ pour le loan-service           ║
 * ║                                                                              ║
 * ║  Définit :                                                                   ║
 * ║  • L'exchange TOPIC "banking.events"                                         ║
 * ║  • La queue "loan.events.queue" pour consommer les événements               ║
 * ║  • Le binding pour écouter "document.processed" (enrichissement KYC)        ║
 * ║  • Le convertisseur JSON                                                     ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE_NAME = "banking.events";
    public static final String QUEUE_LOAN_EVENTS = "loan.events.queue";
    public static final String ROUTING_KEY_LOAN_APPROVED = "loan.approved";
    public static final String ROUTING_KEY_LOAN_REJECTED = "loan.rejected";
    public static final String ROUTING_KEY_DOCUMENT_PROCESSED = "document.processed";

    @Bean
    public TopicExchange bankingExchange() {
        return new TopicExchange(EXCHANGE_NAME);
    }

    @Bean
    public Queue loanEventsQueue() {
        return new Queue(QUEUE_LOAN_EVENTS, true);
    }

    @Bean
    public Binding loanEventsBinding(Queue loanEventsQueue, TopicExchange bankingExchange) {
        return BindingBuilder
                .bind(loanEventsQueue)
                .to(bankingExchange)
                .with("loan.*");
    }

    @Bean
    public Binding documentProcessedBinding(Queue loanEventsQueue, TopicExchange bankingExchange) {
        return BindingBuilder
                .bind(loanEventsQueue)
                .to(bankingExchange)
                .with(ROUTING_KEY_DOCUMENT_PROCESSED);
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
