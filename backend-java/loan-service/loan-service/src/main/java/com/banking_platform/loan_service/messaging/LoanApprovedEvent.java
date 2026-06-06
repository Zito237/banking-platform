package com.banking_platform.loan_service.messaging;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  LoanApprovedEvent.java — Événement publié quand un prêt est approuvé       ║
 * ║                                                                              ║
 * ║  Consommé par : notification-service, audit-service, reporting-service      ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import java.math.BigDecimal;
import java.util.UUID;

public class LoanApprovedEvent {

    private UUID loanId;
    private UUID applicationId;
    private UUID customerId;
    private BigDecimal principal;
    private double interestRate;
    private int termMonths;

    public LoanApprovedEvent() {}

    public LoanApprovedEvent(UUID loanId, UUID applicationId, UUID customerId,
                              BigDecimal principal, double interestRate, int termMonths) {
        this.loanId = loanId;
        this.applicationId = applicationId;
        this.customerId = customerId;
        this.principal = principal;
        this.interestRate = interestRate;
        this.termMonths = termMonths;
    }

    public UUID getLoanId() { return loanId; }
    public void setLoanId(UUID loanId) { this.loanId = loanId; }

    public UUID getApplicationId() { return applicationId; }
    public void setApplicationId(UUID applicationId) { this.applicationId = applicationId; }

    public UUID getCustomerId() { return customerId; }
    public void setCustomerId(UUID customerId) { this.customerId = customerId; }

    public BigDecimal getPrincipal() { return principal; }
    public void setPrincipal(BigDecimal principal) { this.principal = principal; }

    public double getInterestRate() { return interestRate; }
    public void setInterestRate(double interestRate) { this.interestRate = interestRate; }

    public int getTermMonths() { return termMonths; }
    public void setTermMonths(int termMonths) { this.termMonths = termMonths; }
}
