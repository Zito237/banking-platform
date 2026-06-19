package com.banking_platform.customer_service.config;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  RabbitMQConfig.java — Configuration RabbitMQ pour le customer-service        ║
 * ║                                                                              ║
 * ║  Definit :                                                                   ║
 * ║  • L'exchange TOPIC "banking.events" (point central de messagerie)        ║
 * ║  • La queue "document.processed.queue" pour consommer les resultats OCR    ║
 * ║  • Le binding entre la queue et l'exchange avec la routing key              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.DefaultJackson2JavaTypeMapper;
import org.springframework.amqp.support.converter.Jackson2JavaTypeMapper;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    // Nom de l'exchange (defini dans la configuration centralisee)
    public static final String EXCHANGE_NAME = "banking.events";

    // Routing keys
    public static final String ROUTING_KEY_DOCUMENT_SUBMITTED = "document.submitted";
    public static final String ROUTING_KEY_DOCUMENT_PROCESSED = "document.processed";

    // Nom de la queue pour consommer les documents traites
    public static final String QUEUE_DOCUMENT_PROCESSED = "document.processed.queue";

    // Nom de la queue pour consommer les decisions de pret (notifications client)
    public static final String QUEUE_LOAN_NOTIFICATIONS = "customer.notifications.queue";

    /**
     * Declare l'exchange TOPIC.
     * Un exchange TOPIC route les messages selon un pattern de routing key.
     */
    @Bean
    public TopicExchange bankingExchange() {
        return new TopicExchange(EXCHANGE_NAME);
    }

    /**
     * Declare la queue qui recoit les documents traites par l'OCR.
     */
    @Bean
    public Queue documentProcessedQueue() {
        return new Queue(QUEUE_DOCUMENT_PROCESSED, true);  // true = durable
    }

    /**
     * Lie la queue a l'exchange avec la routing key "document.processed".
     */
    @Bean
    public Binding documentProcessedBinding(Queue documentProcessedQueue, TopicExchange bankingExchange) {
        return BindingBuilder
                .bind(documentProcessedQueue)
                .to(bankingExchange)
                .with(ROUTING_KEY_DOCUMENT_PROCESSED);
    }

    /**
     * Declare la queue qui recoit les decisions de pret (loan.approved / loan.rejected)
     * pour generer des notifications client.
     */
    @Bean
    public Queue loanNotificationsQueue() {
        return new Queue(QUEUE_LOAN_NOTIFICATIONS, true);
    }

    /**
     * Lie la queue de notifications a l'exchange avec le pattern "loan.*"
     * (capture loan.approved et loan.rejected).
     */
    @Bean
    public Binding loanNotificationsBinding(Queue loanNotificationsQueue, TopicExchange bankingExchange) {
        return BindingBuilder
                .bind(loanNotificationsQueue)
                .to(bankingExchange)
                .with("loan.*");
    }

    /**
     * Convertisseur JSON pour les messages RabbitMQ.
     * Mode INFERRED : le type cible est determine par la signature du listener,
     * sans dependre de l'en-tete __TypeId__ (les evenements de pret viennent
     * d'un autre service et ne sont pas sur ce classpath).
     */
    @Bean
    public Jackson2JsonMessageConverter jsonMessageConverter() {
        Jackson2JsonMessageConverter converter = new Jackson2JsonMessageConverter();
        DefaultJackson2JavaTypeMapper typeMapper = new DefaultJackson2JavaTypeMapper();
        typeMapper.setTypePrecedence(Jackson2JavaTypeMapper.TypePrecedence.INFERRED);
        converter.setJavaTypeMapper(typeMapper);
        return converter;
    }

    /**
     * Template RabbitMQ configure avec le convertisseur JSON.
     * Utilise pour publier des evenements.
     */
    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter());
        return template;
    }
}
