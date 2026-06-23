package com.banking_platform.account_service.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@FeignClient(name = "operator-service")
public interface OperatorClient {

    @GetMapping("/operators/{id}/ceiling")
    Map<String, BigDecimal> getCeiling(@PathVariable UUID id);
}
