package com.banking_platform.loan_service.dto;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  LoanDecisionRequest.java — DTO pour la décision d'un opérateur               ║
 * ║                                                                              ║
 * ║  L'opérateur approuve ou rejette une demande avec un motif.                ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class LoanDecisionRequest {

    @NotNull(message = "La décision est obligatoire")
    private Boolean approved;  // true = approuvé, false = rejeté

    @NotBlank(message = "Le motif est obligatoire")
    private String reason;  // Motif de la décision

    // Paramètres du prêt si approuvé
    private Double interestRate;  // Taux d'intérêt (ex: 0.12 = 12%)
    private Integer termMonths;   // Durée en mois

    // Getters et Setters
    public Boolean getApproved() { return approved; }
    public void setApproved(Boolean approved) { this.approved = approved; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public Double getInterestRate() { return interestRate; }
    public void setInterestRate(Double interestRate) { this.interestRate = interestRate; }

    public Integer getTermMonths() { return termMonths; }
    public void setTermMonths(Integer termMonths) { this.termMonths = termMonths; }
}
