package com.banking_platform.auth_service.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public class LinkCustomerRequest {

    @NotNull(message = "L'identifiant du client est obligatoire")
    private UUID customerId;

    public UUID getCustomerId() { return customerId; }
    public void setCustomerId(UUID customerId) { this.customerId = customerId; }
}
