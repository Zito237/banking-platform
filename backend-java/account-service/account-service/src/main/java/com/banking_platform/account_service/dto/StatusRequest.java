package com.banking_platform.account_service.dto;

import com.banking_platform.account_service.entity.AccountStatus;
import jakarta.validation.constraints.NotNull;

public record StatusRequest(@NotNull AccountStatus status) {}
