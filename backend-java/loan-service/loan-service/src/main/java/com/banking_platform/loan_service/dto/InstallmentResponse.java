package com.banking_platform.loan_service.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public class InstallmentResponse {

    private UUID id;
    private LocalDate dueDate;
    private BigDecimal amount;
    private BigDecimal principalPart;
    private BigDecimal interestPart;
    private String status;
    private LocalDateTime paidAt;

    // Getters et Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public BigDecimal getPrincipalPart() { return principalPart; }
    public void setPrincipalPart(BigDecimal principalPart) { this.principalPart = principalPart; }

    public BigDecimal getInterestPart() { return interestPart; }
    public void setInterestPart(BigDecimal interestPart) { this.interestPart = interestPart; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getPaidAt() { return paidAt; }
    public void setPaidAt(LocalDateTime paidAt) { this.paidAt = paidAt; }
}
