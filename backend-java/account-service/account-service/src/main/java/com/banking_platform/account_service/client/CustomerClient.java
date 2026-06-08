package com.banking_platform.account_service.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import java.util.UUID;

@FeignClient(name = "customer-service")
public interface CustomerClient {

    @GetMapping("/customers/{id}/exists")
    boolean existsById(@PathVariable UUID id);
}
