package com.banking_platform.transaction_service.messaging;

import java.util.UUID;

public record TransactionFailedEvent(
    UUID transactionId,
    String reference,
    String reason
) {}
