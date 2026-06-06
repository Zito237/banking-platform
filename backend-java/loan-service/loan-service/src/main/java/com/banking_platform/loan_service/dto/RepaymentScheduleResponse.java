package com.banking_platform.loan_service.dto;

import java.util.List;
import java.util.UUID;

public class RepaymentScheduleResponse {

    private UUID id;
    private List<InstallmentResponse> installments;

    // Getters et Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public List<InstallmentResponse> getInstallments() { return installments; }
    public void setInstallments(List<InstallmentResponse> installments) { this.installments = installments; }
}
