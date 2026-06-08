package com.banking_platform.transaction_service.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.util.UUID;

public record WithdrawalRequest(
    @NotNull UUID accountId,
    @NotNull @Positive BigDecimal amount
) {}
