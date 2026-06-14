package com.banking_platform.customer_service.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        String message,
        boolean read,
        LocalDateTime createdAt
) {}
