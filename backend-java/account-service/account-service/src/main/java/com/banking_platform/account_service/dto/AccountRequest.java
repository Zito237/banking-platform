package com.banking_platform.account_service.dto;

import com.banking_platform.account_service.entity.AccountType;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

public record AccountRequest(
    @NotNull UUID customerId,
    @NotNull UUID operatorId,
    @NotNull AccountType accountType,
    BigDecimal ceiling,
    String currency
) {}
