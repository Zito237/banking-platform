package com.banking_platform.transaction_service.client;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import java.math.BigDecimal;

@FeignClient(name = "operator-service")
public interface OperatorClient {

    @CircuitBreaker(name = "operator-service", fallbackMethod = "getCommissionFallback")
    @Retry(name = "operator-service")
    @GetMapping("/operators/commission")
    BigDecimal getCommission(@RequestParam BigDecimal amount);

    default BigDecimal getCommissionFallback(BigDecimal amount, Throwable t) {
        return BigDecimal.ZERO;
    }
}
