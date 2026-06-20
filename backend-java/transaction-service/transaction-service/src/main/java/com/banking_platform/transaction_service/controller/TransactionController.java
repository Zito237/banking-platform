package com.banking_platform.transaction_service.controller;

import com.banking_platform.transaction_service.dto.*;
import com.banking_platform.transaction_service.service.TransactionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@Tag(name = "Transactions")
public class TransactionController {

    private final TransactionService service;

    public TransactionController(TransactionService service) { this.service = service; }

    @Operation(summary = "Deposit")
    @PostMapping("/deposits")
    public ResponseEntity<TransactionResponse> deposit(@Valid @RequestBody DepositRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.deposit(req));
    }

    @Operation(summary = "Withdrawal")
    @PostMapping("/withdrawals")
    public ResponseEntity<TransactionResponse> withdrawal(@Valid @RequestBody WithdrawalRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.withdrawal(req));
    }

    @Operation(summary = "Transfer")
    @PostMapping("/transfers")
    public ResponseEntity<TransactionResponse> transfer(@Valid @RequestBody TransferRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.transfer(req));
    }

    @Operation(summary = "Loan repayment")
    @PostMapping("/transactions/repayment")
    public ResponseEntity<TransactionResponse> repayment(@Valid @RequestBody RepaymentRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.repayment(req));
    }

    @Operation(summary = "All transactions (admin/reporting)")
    @GetMapping("/transactions/all")
    public List<TransactionResponse> allTransactions() {
        return service.getAllTransactions();
    }

    @Operation(summary = "Transaction history")
    @GetMapping("/transactions")
    public List<TransactionResponse> history(@RequestParam UUID accountId) {
        return service.getHistory(accountId);
    }
}
