package com.banking_platform.transaction_service.client;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@FeignClient(name = "account-service")
public interface AccountClient {

    @CircuitBreaker(name = "account-service", fallbackMethod = "creditFallback")
    @Retry(name = "account-service")
    @PostMapping("/accounts/{id}/credit")
    Object credit(@PathVariable UUID id, @RequestBody Map<String, BigDecimal> body);

    @CircuitBreaker(name = "account-service", fallbackMethod = "debitFallback")
    @Retry(name = "account-service")
    @PostMapping("/accounts/{id}/debit")
    Object debit(@PathVariable UUID id, @RequestBody Map<String, BigDecimal> body);

    default Object creditFallback(UUID id, Map<String, BigDecimal> body, Throwable t) {
        throw new RuntimeException("account-service credit unavailable: " + t.getMessage());
    }

    default Object debitFallback(UUID id, Map<String, BigDecimal> body, Throwable t) {
        throw new RuntimeException("account-service debit unavailable: " + t.getMessage());
    }
}
