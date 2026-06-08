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

import com.banking_platform.customer_service.dto.*;
//import com.banking_platform.customer_service.service;
import com.banking_platform.customer_service.service.CustomerService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
}
