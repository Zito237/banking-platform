package com.banking_platform.operator_service.config;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  RabbitMQConfig.java — Configuration RabbitMQ pour l'operator-service        ║
 * ║                                                                              ║
 * ║  Le journal d'audit ecoute les evenements metier publies par les autres     ║
 * ║  services sur l'exchange TOPIC "banking.events" :                            ║
 * ║  • auth.login / auth.register   (auth-service)                              ║
 * ║  • loan.approved / loan.rejected (loan-service)                              ║
 * ║  • transaction.completed / transaction.failed (transaction-service)         ║
 * ║  • document.submitted / document.processed (customer-service / OCR)         ║
 * ║                                                                              ║
 * ║  Le convertisseur JSON est configure en mode INFERRED : le type Java cible   ║
 * ║  est determine par la signature du listener (Map<String,Object>), sans      ║
 * ║  necessiter que les classes d'evenement des autres services soient          ║
 * ║  presentes sur le classpath de operator-service.                            ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.DefaultJackson2JavaTypeMapper;
import org.springframework.amqp.support.converter.Jackson2JavaTypeMapper;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE_NAME = "banking.events";
    public static final String QUEUE_AUDIT_EVENTS = "audit.events.queue";

    @Bean
    public TopicExchange bankingExchange() {
        return new TopicExchange(EXCHANGE_NAME);
    }

    @Bean
    public Queue auditEventsQueue() {
        return new Queue(QUEUE_AUDIT_EVENTS, true);
    }

    @Bean
    public Binding authEventsBinding(Queue auditEventsQueue, TopicExchange bankingExchange) {
        return BindingBuilder.bind(auditEventsQueue).to(bankingExchange).with("auth.*");
    }

    @Bean
    public Binding loanEventsBinding(Queue auditEventsQueue, TopicExchange bankingExchange) {
        return BindingBuilder.bind(auditEventsQueue).to(bankingExchange).with("loan.*");
    }

    @Bean
    public Binding transactionEventsBinding(Queue auditEventsQueue, TopicExchange bankingExchange) {
        return BindingBuilder.bind(auditEventsQueue).to(bankingExchange).with("transaction.*");
    }

    @Bean
    public Binding documentEventsBinding(Queue auditEventsQueue, TopicExchange bankingExchange) {
        return BindingBuilder.bind(auditEventsQueue).to(bankingExchange).with("document.*");
    }

    @Bean
    public Jackson2JsonMessageConverter jsonMessageConverter() {
        Jackson2JsonMessageConverter converter = new Jackson2JsonMessageConverter();
        DefaultJackson2JavaTypeMapper typeMapper = new DefaultJackson2JavaTypeMapper();
        typeMapper.setTypePrecedence(Jackson2JavaTypeMapper.TypePrecedence.INFERRED);
        converter.setJavaTypeMapper(typeMapper);
        return converter;
    }
}
