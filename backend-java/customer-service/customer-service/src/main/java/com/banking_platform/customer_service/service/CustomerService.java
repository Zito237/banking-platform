package com.banking_platform.customer_service.service;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  CustomerService.java — Service metier des clients                             ║
 * ║                                                                              ║
 * ║  Contient la logique metier pour :                                           ║
 * ║  • Inscrire un client (kycStatus = PENDING)                                  ║
 * ║  • Consulter un client avec ses documents                                   ║
 * ║  • Soumettre un document et publier un evenement RabbitMQ                    ║
 * ║                                                                              ║
 * ║  Quand un document est soumis :                                              ║
 * ║  1. Le document est enregistre en base                                       ║
 * ║  2. Un evenement DocumentSubmitted est publie sur RabbitMQ                  ║
 * ║  3. Le service OCR le consomme, fait l'OCR, puis publie DocumentProcessed   ║
 * ║  4. Ce service consomme DocumentProcessed et met a jour le KYC             ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import com.banking_platform.customer_service.dto.*;
import com.banking_platform.customer_service.entity.*;
import com.banking_platform.customer_service.messaging.DocumentSubmittedEvent;
import com.banking_platform.customer_service.config.RabbitMQConfig;
import com.banking_platform.customer_service.repository.CustomerRepository;
import com.banking_platform.customer_service.repository.DocumentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CustomerService {

    private static final Logger logger = LoggerFactory.getLogger(CustomerService.class);

    private final CustomerRepository customerRepository;
    private final DocumentRepository documentRepository;
    private final RabbitTemplate rabbitTemplate;

    public CustomerService(CustomerRepository customerRepository,
                           DocumentRepository documentRepository,
                           RabbitTemplate rabbitTemplate) {
        this.customerRepository = customerRepository;
        this.documentRepository = documentRepository;
        this.rabbitTemplate = rabbitTemplate;
    }

    /**
     * Inscrit un nouveau client.
     * Le kycStatus est initialise a PENDING par defaut.
     */
    @Transactional
    public CustomerResponse createCustomer(CustomerRequest request) {
        // Verification des doublons
        if (customerRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Un client avec cet email existe deja");
        }
        if (customerRepository.existsByNationalIdNumber(request.getNationalIdNumber())) {
            throw new RuntimeException("Un client avec ce numero d'identite existe deja");
        }

        // Creation du client
        Customer customer = new Customer();
        customer.setFirstName(request.getFirstName());
        customer.setLastName(request.getLastName());
        customer.setDateOfBirth(request.getDateOfBirth());
        customer.setEmail(request.getEmail());
        customer.setPhone(request.getPhone());
        customer.setAddress(request.getAddress());
        customer.setNationalIdNumber(request.getNationalIdNumber());
        customer.setOperatorId(request.getOperatorId());
        // kycStatus = PENDING par defaut (defini dans l'entite)

        Customer saved = customerRepository.save(customer);
        logger.info("Client cree : id={}, email={}", saved.getId(), saved.getEmail());

        return mapToResponse(saved);
    }

    /**
     * Recupere un client par son ID avec ses documents.
     */
    public CustomerResponse getCustomer(UUID id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client non trouve"));
        return mapToResponse(customer);
    }

    /**
     * Soumet un document pour un client et publie un evenement RabbitMQ.
     * L'evenement sera consomme par le service OCR pour traitement.
     */
    @Transactional
    public DocumentResponse submitDocument(DocumentRequest request) {
        // Verifie que le client existe
        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Client non trouve"));

        // Cree le document
        DocumentType docType = DocumentType.valueOf(request.getDocumentType().toUpperCase());
        DocumentReference document = new DocumentReference(docType, request.getFileUrl());
        customer.addDocument(document);

        // Sauvegarde (cascade sauvegarde aussi le document)
        customerRepository.save(customer);

        logger.info("Document soumis : id={}, type={}, client={}",
                document.getId(), docType, customer.getId());

        // Publie l'evenement DocumentSubmitted sur RabbitMQ
        // Le service OCR consommera cet evenement pour faire l'extraction
        DocumentSubmittedEvent event = new DocumentSubmittedEvent(
                document.getId(),
                customer.getId(),
                docType.name(),
                request.getFileUrl()
        );

        rabbitTemplate.convertAndSend(
                RabbitMQConfig.EXCHANGE_NAME,
                RabbitMQConfig.ROUTING_KEY_DOCUMENT_SUBMITTED,
                event
        );

        logger.info("Evenement DocumentSubmitted publie sur RabbitMQ : documentId={}",
                document.getId());

        return mapToDocumentResponse(document);
    }

    /**
     * Convertit une entite Customer en DTO CustomerResponse.
     */
    private CustomerResponse mapToResponse(Customer customer) {
        CustomerResponse response = new CustomerResponse();
        response.setId(customer.getId());
        response.setFirstName(customer.getFirstName());
        response.setLastName(customer.getLastName());
        response.setDateOfBirth(customer.getDateOfBirth());
        response.setEmail(customer.getEmail());
        response.setPhone(customer.getPhone());
        response.setAddress(customer.getAddress());
        response.setNationalIdNumber(customer.getNationalIdNumber());
        response.setOperatorId(customer.getOperatorId());
        response.setKycStatus(customer.getKycStatus().name());
        response.setCreatedAt(customer.getCreatedAt());

        // Conversion des documents
        List<DocumentResponse> docResponses = customer.getDocuments().stream()
                .map(this::mapToDocumentResponse)
                .collect(Collectors.toList());
        response.setDocuments(docResponses);

        return response;
    }

    /**
     * Convertit une entite DocumentReference en DTO DocumentResponse.
     */
    private DocumentResponse mapToDocumentResponse(DocumentReference document) {
        DocumentResponse response = new DocumentResponse();
        response.setId(document.getId());
        response.setDocumentType(document.getDocumentType().name());
        response.setFileUrl(document.getFileUrl());
        response.setVerified(document.isVerified());
        return response;
    }
}
