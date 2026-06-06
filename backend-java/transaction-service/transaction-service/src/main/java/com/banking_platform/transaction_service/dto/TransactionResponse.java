package com.banking_platform.transaction_service.dto;

import com.banking_platform.transaction_service.entity.TransactionStatus;
import com.banking_platform.transaction_service.entity.TransactionType;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record TransactionResponse(
    UUID id,
    String reference,
    TransactionType type,
    BigDecimal amount,
    String currency,
    BigDecimal fees,
    UUID sourceAccountId,
    UUID destinationAccountId,
    TransactionStatus status,
    LocalDateTime createdAt
) {}
