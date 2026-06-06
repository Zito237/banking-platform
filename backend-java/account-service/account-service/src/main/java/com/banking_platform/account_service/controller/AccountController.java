package com.banking_platform.account_service.controller;

import com.banking_platform.account_service.dto.*;
import com.banking_platform.account_service.service.AccountService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/accounts")
@Tag(name = "Accounts")
public class AccountController {

    private final AccountService service;

    public AccountController(AccountService service) { this.service = service; }

    @Operation(summary = "Open account")
    @PostMapping
    public ResponseEntity<AccountResponse> open(@Valid @RequestBody AccountRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.openAccount(req));
    }

    @Operation(summary = "Get account by id")
    @GetMapping("/{id}")
    public AccountResponse getById(@PathVariable UUID id) {
        return service.getById(id);
    }

    @Operation(summary = "Get accounts by customer")
    @GetMapping
    public List<AccountResponse> getByCustomer(@RequestParam UUID customerId) {
        return service.getByCustomerId(customerId);
    }

    @Operation(summary = "Credit account")
    @PostMapping("/{id}/credit")
    public AccountResponse credit(@PathVariable UUID id, @Valid @RequestBody AmountRequest req) {
        return service.credit(id, req.amount());
    }

    @Operation(summary = "Debit account")
    @PostMapping("/{id}/debit")
    public AccountResponse debit(@PathVariable UUID id, @Valid @RequestBody AmountRequest req) {
        return service.debit(id, req.amount());
    }
}
