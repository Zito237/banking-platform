package com.banking_platform.transaction_service.messaging;

import java.math.BigDecimal;
import java.util.UUID;

public record TransactionCompletedEvent(
    UUID transactionId,
    String reference,
    String type,
    BigDecimal amount,
    UUID sourceAccountId,
    UUID destinationAccountId
) {}
