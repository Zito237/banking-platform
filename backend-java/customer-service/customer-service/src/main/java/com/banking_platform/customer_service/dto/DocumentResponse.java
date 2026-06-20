package com.banking_platform.customer_service.dto;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  DocumentResponse.java — DTO de reponse pour un document                     ║
 * ║                                                                              ║
 * ║  Renvoye dans CustomerResponse.                                             ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import java.util.UUID;

public class DocumentResponse {

    private UUID id;
    private String documentType;
    private String fileUrl;
    private boolean verified;
    private UUID customerId;
    private String customerName;

    // Getters et Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getDocumentType() { return documentType; }
    public void setDocumentType(String documentType) { this.documentType = documentType; }

    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }

    public boolean isVerified() { return verified; }
    public void setVerified(boolean verified) { this.verified = verified; }

    public UUID getCustomerId() { return customerId; }
    public void setCustomerId(UUID customerId) { this.customerId = customerId; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
}
