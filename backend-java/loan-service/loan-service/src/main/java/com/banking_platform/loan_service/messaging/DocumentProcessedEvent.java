package com.banking_platform.loan_service.messaging;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  DocumentProcessedEvent.java — Événement consommé depuis le service OCR       ║
 * ║                                                                              ║
 * ║  Utilisé pour enrichir l'analyse du dossier de prêt (KYC du client).        ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import java.util.Map;
import java.util.UUID;

public class DocumentProcessedEvent {

    private UUID documentId;
    private UUID customerId;
    private Map<String, String> fields;
    private float confidence;

    public DocumentProcessedEvent() {}

    public UUID getDocumentId() { return documentId; }
    public void setDocumentId(UUID documentId) { this.documentId = documentId; }

    public UUID getCustomerId() { return customerId; }
    public void setCustomerId(UUID customerId) { this.customerId = customerId; }

    public Map<String, String> getFields() { return fields; }
    public void setFields(Map<String, String> fields) { this.fields = fields; }

    public float getConfidence() { return confidence; }
    public void setConfidence(float confidence) { this.confidence = confidence; }
}
