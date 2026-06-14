package com.banking_platform.operator_service.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record AuditLogResponse(
        UUID id,
        String action,
        String userId,
        LocalDateTime timestamp,
        String details
) {}
