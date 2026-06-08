package com.banking_platform.account_service.dto;

import com.banking_platform.account_service.entity.AccountStatus;
import com.banking_platform.account_service.entity.AccountType;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record AccountResponse(
    UUID id,
    String accountNumber,
    UUID customerId,
    UUID operatorId,
    AccountType accountType,
    BigDecimal balance,
    String currency,
    BigDecimal ceiling,
    AccountStatus status,
    LocalDateTime openedAt
) {}
