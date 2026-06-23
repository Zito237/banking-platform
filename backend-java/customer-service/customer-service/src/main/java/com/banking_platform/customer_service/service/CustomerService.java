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

import com.banking_platform.customer_service.dto.CustomerResponse;
import com.banking_platform.customer_service.entity.Customer;
import com.banking_platform.customer_service.entity.DocumentReference;
import com.banking_platform.customer_service.entity.DocumentType;
import com.banking_platform.customer_service.entity.KycStatus;
import com.banking_platform.customer_service.entity.Notification;
import com.banking_platform.customer_service.messaging.DocumentSubmittedEvent;
import com.banking_platform.customer_service.dto.DocumentResponse;
import com.banking_platform.customer_service.dto.DocumentRequest;
import com.banking_platform.customer_service.dto.NotificationResponse;
import com.banking_platform.customer_service.dto.OcrResultRequest;
import com.banking_platform.customer_service.config.RabbitMQConfig;
import com.banking_platform.customer_service.repository.CustomerRepository;
import com.banking_platform.customer_service.repository.DocumentRepository;
import com.banking_platform.customer_service.repository.NotificationRepository;
import com.banking_platform.customer_service.dto.CustomerRequest;
import com.banking_platform.customer_service.dto.CustomerUpdateRequest;
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
    private final NotificationRepository notificationRepository;
    private final RabbitTemplate rabbitTemplate;

    public CustomerService(CustomerRepository customerRepository,
                           DocumentRepository documentRepository,
                           NotificationRepository notificationRepository,
                           RabbitTemplate rabbitTemplate) {
        this.customerRepository = customerRepository;
        this.documentRepository = documentRepository;
        this.notificationRepository = notificationRepository;
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
     * Indique si un client existe pour cet ID (utilise par les autres services via Feign).
     */
    public boolean existsById(UUID id) {
        return customerRepository.existsById(id);
    }

    /**
     * Met a jour les informations modifiables d'un client (nom, telephone, adresse, date de naissance).
     * L'email, le numero d'identite et l'operateur ne peuvent pas etre changes.
     */
    @Transactional
    public CustomerResponse updateCustomer(UUID id, CustomerUpdateRequest request) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client non trouve"));

        customer.setFirstName(request.getFirstName());
        customer.setLastName(request.getLastName());
        customer.setDateOfBirth(request.getDateOfBirth());
        customer.setPhone(request.getPhone());
        customer.setAddress(request.getAddress());

        Customer saved = customerRepository.save(customer);
        logger.info("Client mis a jour : id={}", saved.getId());
        return mapToResponse(saved);
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
        // save() effectue un merge() car customer est deja persiste : il faut donc
        // recuperer le document depuis l'entite fusionnee pour obtenir son id genere.
        Customer saved = customerRepository.save(customer);
        document = saved.getDocuments().get(saved.getDocuments().size() - 1);

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

        try {
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.EXCHANGE_NAME,
                    RabbitMQConfig.ROUTING_KEY_DOCUMENT_SUBMITTED,
                    event
            );
            logger.info("Evenement DocumentSubmitted publie sur RabbitMQ : documentId={}",
                    document.getId());
        } catch (Exception e) {
            logger.warn("Impossible de publier l'evenement DocumentSubmitted : {}", e.getMessage());
        }

        return mapToDocumentResponse(document);
    }

    /**
     * Applique directement le resultat OCR sur un document (sans passer par RabbitMQ).
     * Met a jour verified=true et le KYC du client selon le score de confiance.
     */
    @Transactional
    public void applyOcrResult(UUID documentId, float confidence) {
        DocumentReference document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document non trouve : " + documentId));

        document.setOcrConfidence(confidence);

        if (confidence >= 0.7f) {
            document.setVerified(true);
            documentRepository.save(document);

            Customer customer = customerRepository.findById(document.getCustomer().getId())
                    .orElseThrow(() -> new RuntimeException("Client non trouve"));
            customer.setKycStatus(KycStatus.VERIFIED);
            customerRepository.save(customer);

            logger.info("Document {} auto-valide : confidence={}, kycStatus=VERIFIED", documentId, confidence);
        } else {
            document.setVerified(false);
            documentRepository.save(document);
            logger.info("Document {} en attente de revue admin : confidence={}", documentId, confidence);
        }
    }

    /**
     * Liste les notifications d'un client (plus recentes en premier).
     */
    public List<NotificationResponse> getNotifications(UUID customerId) {
        return notificationRepository.findByCustomerIdOrderByCreatedAtDesc(customerId).stream()
                .map(n -> new NotificationResponse(n.getId(), n.getMessage(), n.isRead(), n.getCreatedAt()))
                .collect(Collectors.toList());
    }

    /**
     * Marque une notification comme lue.
     */
    @Transactional
    public void markNotificationRead(UUID notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification non trouvee"));
        notification.setRead(true);
        notificationRepository.save(notification);
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
     * Retourne tous les documents (tous clients) — pour la vue admin KYC.
     */
    public List<DocumentResponse> getAllDocuments() {
        return documentRepository.findAll().stream()
                .map(this::mapToDocumentResponse)
                .collect(Collectors.toList());
    }

    /**
     * Valide manuellement un document (admin) et passe le KYC du client a VERIFIED.
     */
    @Transactional
    public void verifyDocument(UUID documentId) {
        DocumentReference document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document non trouve : " + documentId));
        document.setVerified(true);
        documentRepository.save(document);

        Customer customer = customerRepository.findById(document.getCustomer().getId())
                .orElseThrow(() -> new RuntimeException("Client non trouve"));
        customer.setKycStatus(KycStatus.VERIFIED);
        customerRepository.save(customer);

        logger.info("Document {} valide manuellement par admin, KYC client {} = VERIFIED", documentId, customer.getId());
    }

    /**
     * Convertit une entite DocumentReference en DTO DocumentResponse.
     * Inclut customerId et customerName pour la vue admin.
     */
    private DocumentResponse mapToDocumentResponse(DocumentReference document) {
        DocumentResponse response = new DocumentResponse();
        response.setId(document.getId());
        response.setDocumentType(document.getDocumentType().name());
        response.setFileUrl(document.getFileUrl());
        response.setVerified(document.isVerified());
        response.setOcrConfidence(document.getOcrConfidence());
        if (document.getCustomer() != null) {
            response.setCustomerId(document.getCustomer().getId());
            response.setCustomerName(document.getCustomer().getFirstName() + " " + document.getCustomer().getLastName());
        }
        return response;
    }
}
