package com.banking_platform.customer_service.dto;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  DocumentRequest.java — DTO pour soumettre un document                         ║
 * ║                                                                              ║
 * ║  Contient les donnees pour enregistrer un document et declencher l'OCR.    ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public class DocumentRequest {

    @NotNull(message = "L'identifiant du client est obligatoire")
    private UUID customerId;

    @NotBlank(message = "Le type de document est obligatoire")
    private String documentType;  // ID_CARD, PASSPORT, etc.

    @NotBlank(message = "L'URL du fichier est obligatoire")
    private String fileUrl;  // URL ou chemin du fichier stocke

    // Getters et Setters
    public UUID getCustomerId() { return customerId; }
    public void setCustomerId(UUID customerId) { this.customerId = customerId; }

    public String getDocumentType() { return documentType; }
    public void setDocumentType(String documentType) { this.documentType = documentType; }

    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }
}
