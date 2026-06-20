package com.banking_platform.customer_service.controller;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  CustomerController.java — Controller REST pour les clients                  ║
 * ║                                                                              ║
 * ║  Expose les endpoints :                                                      ║
 * ║  • POST /customers         → inscrire un client                              ║
 * ║  • GET  /customers/{id}  → profil client avec documents                    ║
 * ║  • POST /documents         → soumettre un document (declenche l'OCR)        ║
 * ║                                                                              ║
 * ║  La documentation Swagger est accessible sur /swagger-ui.html               ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */


import com.banking_platform.customer_service.dto.DocumentResponse;
import com.banking_platform.customer_service.dto.DocumentRequest;
import com.banking_platform.customer_service.dto.CustomerResponse;
import com.banking_platform.customer_service.dto.CustomerRequest;
import com.banking_platform.customer_service.dto.CustomerUpdateRequest;
import com.banking_platform.customer_service.dto.NotificationResponse;
import com.banking_platform.customer_service.dto.OcrResultRequest;
import com.banking_platform.customer_service.service.CustomerService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    /**
     * POST /customers
     * Inscrit un nouveau client.
     * Le kycStatus est initialise a PENDING automatiquement.
     */
    @PostMapping("/customers")
    public ResponseEntity<CustomerResponse> createCustomer(
            @Valid @RequestBody CustomerRequest request) {
        CustomerResponse response = customerService.createCustomer(request);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /customers/{id}
     * Recupere le profil d'un client avec ses documents.
     */
    @GetMapping("/customers/{id}")
    public ResponseEntity<CustomerResponse> getCustomer(@PathVariable UUID id) {
        CustomerResponse response = customerService.getCustomer(id);
        return ResponseEntity.ok(response);
    }

    /**
     * PUT /customers/{id}
     * Met a jour les informations modifiables d'un client (nom, telephone, adresse, date de naissance).
     */
    @PutMapping("/customers/{id}")
    public ResponseEntity<CustomerResponse> updateCustomer(
            @PathVariable UUID id,
            @Valid @RequestBody CustomerUpdateRequest request) {
        return ResponseEntity.ok(customerService.updateCustomer(id, request));
    }

    /**
     * GET /customers/{id}/exists
     * Indique si un client existe pour cet ID (utilise par les autres services via Feign).
     */
    @GetMapping("/customers/{id}/exists")
    public ResponseEntity<Boolean> existsCustomer(@PathVariable UUID id) {
        return ResponseEntity.ok(customerService.existsById(id));
    }

    /**
     * POST /documents
     * Soumet un document pour un client.
     * Publie automatiquement un evenement DocumentSubmitted sur RabbitMQ
     * pour declencher le traitement OCR.
     */
    @PostMapping("/documents")
    public ResponseEntity<DocumentResponse> submitDocument(
            @Valid @RequestBody DocumentRequest request) {
        DocumentResponse response = customerService.submitDocument(request);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /documents
     * Retourne tous les documents (tous clients) — vue admin KYC.
     */
    @GetMapping("/documents")
    public ResponseEntity<List<DocumentResponse>> getAllDocuments() {
        return ResponseEntity.ok(customerService.getAllDocuments());
    }

    /**
     * PATCH /documents/{id}/verify
     * Valide manuellement un document (admin) et passe le KYC du client a VERIFIED.
     */
    @PatchMapping("/documents/{id}/verify")
    public ResponseEntity<Void> verifyDocument(@PathVariable UUID id) {
        customerService.verifyDocument(id);
        return ResponseEntity.ok().build();
    }

    /**
     * POST /documents/{id}/process
     * Applique directement le resultat OCR sur un document (appele par le frontend
     * apres upload direct vers le service OCR, sans passer par RabbitMQ).
     */
    @PostMapping("/documents/{id}/process")
    public ResponseEntity<Void> processOcrResult(
            @PathVariable UUID id,
            @RequestBody OcrResultRequest request) {
        customerService.applyOcrResult(id, request.getConfidence());
        return ResponseEntity.ok().build();
    }

    /**
     * GET /customers/notifications?customerId=...
     * Liste les notifications d'un client (plus recentes en premier).
     */
    @GetMapping("/customers/notifications")
    public ResponseEntity<List<NotificationResponse>> getNotifications(@RequestParam UUID customerId) {
        return ResponseEntity.ok(customerService.getNotifications(customerId));
    }

    /**
     * PUT /customers/notifications/{id}/read
     * Marque une notification comme lue.
     */
    @PutMapping("/customers/notifications/{id}/read")
    public ResponseEntity<Void> markNotificationRead(@PathVariable UUID id) {
        customerService.markNotificationRead(id);
        return ResponseEntity.ok().build();
    }
}
