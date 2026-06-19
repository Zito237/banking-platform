package com.banking_platform.customer_service.messaging;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  DocumentSubmittedEvent.java — Evenement publie quand un document est soumis  ║
 * ║                                                                              ║
 * ║  Cet evenement est envoye sur RabbitMQ (exchange "banking.events",            ║
 * ║  routing key "document.submitted").                                         ║
 * ║                                                                              ║
 * ║  Le service OCR (Python/FastAPI) le consomme, fait l'OCR, puis publie       ║
 * ║  DocumentProcessed avec les champs extraits.                                  ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import java.util.UUID;

public class DocumentSubmittedEvent {

    private UUID documentId;
    private UUID customerId;
    private String documentType;
    private String fileUrl;

    public DocumentSubmittedEvent() {}

    public DocumentSubmittedEvent(UUID documentId, UUID customerId, String documentType, String fileUrl) {
        this.documentId = documentId;
        this.customerId = customerId;
        this.documentType = documentType;
        this.fileUrl = fileUrl;
    }

    // Getters et Setters
    public UUID getDocumentId() { return documentId; }
    public void setDocumentId(UUID documentId) { this.documentId = documentId; }

    public UUID getCustomerId() { return customerId; }
    public void setCustomerId(UUID customerId) { this.customerId = customerId; }

    public String getDocumentType() { return documentType; }
    public void setDocumentType(String documentType) { this.documentType = documentType; }

    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }
}
