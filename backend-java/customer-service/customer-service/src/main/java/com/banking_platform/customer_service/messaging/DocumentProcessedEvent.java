package com.banking_platform.customer_service.messaging;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  DocumentProcessedEvent.java — Evenement consomme apres traitement OCR        ║
 * ║                                                                              ║
 * ║  Publie par le service OCR (Python) apres extraction des champs.           ║
 * ║  Ce service le consomme pour mettre a jour le KYC du client.                ║
 * ║                                                                              ║
 * ║  Contient les champs extraits par l'OCR et le score de confiance.          ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import java.util.Map;
import java.util.UUID;

public class DocumentProcessedEvent {

    private UUID documentId;
    private Map<String, String> fields;  // Champs extraits (ex: {nom: "Dupont", prenom: "Jean"})
    private float confidence;  // Score de confiance OCR (0.0 - 1.0)

    public DocumentProcessedEvent() {}

    // Getters et Setters
    public UUID getDocumentId() { return documentId; }
    public void setDocumentId(UUID documentId) { this.documentId = documentId; }

    public Map<String, String> getFields() { return fields; }
    public void setFields(Map<String, String> fields) { this.fields = fields; }

    public float getConfidence() { return confidence; }
    public void setConfidence(float confidence) { this.confidence = confidence; }
}
