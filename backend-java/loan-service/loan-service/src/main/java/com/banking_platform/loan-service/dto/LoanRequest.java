package com.banking_platform.loan_service.dto;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  LoanRequest.java — DTO pour créer une demande de prêt                       ║
 * ║                                                                              ║
 * ║  Le client envoie le montant demandé et l'objet du prêt.                    ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.util.UUID;

public class LoanRequest {

    @NotNull(message = "L'identifiant du client est obligatoire")
    private UUID customerId;

    @NotNull(message = "L'identifiant de l'opérateur est obligatoire")
    private UUID operatorId;

    @NotNull(message = "Le montant demandé est obligatoire")
    @Positive(message = "Le montant doit être positif")
    private BigDecimal requestedAmount;

    @NotBlank(message = "L'objet du prêt est obligatoire")
    private String purpose;

    // Getters et Setters
    public UUID getCustomerId() { return customerId; }
    public void setCustomerId(UUID customerId) { this.customerId = customerId; }

    public UUID getOperatorId() { return operatorId; }
    public void setOperatorId(UUID operatorId) { this.operatorId = operatorId; }

    public BigDecimal getRequestedAmount() { return requestedAmount; }
    public void setRequestedAmount(BigDecimal requestedAmount) { this.requestedAmount = requestedAmount; }

    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }
}
