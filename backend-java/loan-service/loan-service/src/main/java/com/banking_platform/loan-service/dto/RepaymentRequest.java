package com.banking_platform.loan_service.dto;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  RepaymentRequest.java — DTO pour rembourser une mensualité                   ║
 * ║                                                                              ║
 * ║  Le client précise quelle mensualité il veut payer.                          ║
 * ║  L'ID du compte est utilisé pour le débit via transaction-service.           ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public class RepaymentRequest {

    @NotNull(message = "L'identifiant de la mensualité est obligatoire")
    private UUID installmentId;

    @NotNull(message = "L'identifiant du compte est obligatoire")
    private UUID accountId;  // Compte à débiter pour le remboursement

    // Getters et Setters
    public UUID getInstallmentId() { return installmentId; }
    public void setInstallmentId(UUID installmentId) { this.installmentId = installmentId; }

    public UUID getAccountId() { return accountId; }
    public void setAccountId(UUID accountId) { this.accountId = accountId; }
}
