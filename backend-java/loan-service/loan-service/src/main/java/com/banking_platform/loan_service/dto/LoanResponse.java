package com.banking_platform.loan_service.dto;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  LoanResponse.java — DTO de réponse pour un prêt                             ║
 * ║                                                                              ║
 * ║  Renvoyé par les endpoints GET.                                             ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public class LoanResponse {

    private UUID id;
    private UUID applicationId;
    private UUID customerId;
    private BigDecimal principal;
    private double interestRate;
    private int termMonths;
    private String status;
    private LocalDateTime disbursedAt;
    private RepaymentScheduleResponse schedule;

    // Getters et Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

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

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getDisbursedAt() { return disbursedAt; }
    public void setDisbursedAt(LocalDateTime disbursedAt) { this.disbursedAt = disbursedAt; }

    public RepaymentScheduleResponse getSchedule() { return schedule; }
    public void setSchedule(RepaymentScheduleResponse schedule) { this.schedule = schedule; }
}
