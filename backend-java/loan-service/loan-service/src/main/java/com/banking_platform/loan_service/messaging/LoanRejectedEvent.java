package com.banking_platform.loan_service.messaging;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  LoanRejectedEvent.java — Événement publié quand un prêt est rejeté        ║
 * ║                                                                              ║
 * ║  Consommé par : notification-service, audit-service                         ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import java.util.UUID;

public class LoanRejectedEvent {

    private UUID applicationId;
    private UUID customerId;
    private String reason;

    public LoanRejectedEvent() {}

    public LoanRejectedEvent(UUID applicationId, UUID customerId, String reason) {
        this.applicationId = applicationId;
        this.customerId = customerId;
        this.reason = reason;
    }

    public UUID getApplicationId() { return applicationId; }
    public void setApplicationId(UUID applicationId) { this.applicationId = applicationId; }

    public UUID getCustomerId() { return customerId; }
    public void setCustomerId(UUID customerId) { this.customerId = customerId; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
