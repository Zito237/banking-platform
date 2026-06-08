package com.banking_platform.loan_service.client;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  TransactionClient.java — Client Feign pour appeler transaction-service        ║
 * ║                                                                              ║
 * ║  Utilise pour débiter le compte du client lors d'un remboursement.           ║
 * ║  Le remboursement est une transaction de type REPAYMENT.                     ║
 * ║                                                                              ║
 * ║  Protégé par Circuit Breaker (Resilience4j) dans le service appelant.       ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.math.BigDecimal;
import java.util.UUID;

@FeignClient(name = "transaction-service")
public interface TransactionClient {

    /**
     * Crée une transaction de remboursement (débit du compte client).
     */
    @PostMapping("/transactions/repayment")
    TransactionResponse createRepayment(@RequestBody RepaymentTransactionRequest request);

    // DTO interne pour la requête Feign
    class RepaymentTransactionRequest {
        private UUID accountId;
        private BigDecimal amount;
        private String reference;

        public RepaymentTransactionRequest() {}

        public RepaymentTransactionRequest(UUID accountId, BigDecimal amount, String reference) {
            this.accountId = accountId;
            this.amount = amount;
            this.reference = reference;
        }

        public UUID getAccountId() { return accountId; }
        public void setAccountId(UUID accountId) { this.accountId = accountId; }

        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }

        public String getReference() { return reference; }
        public void setReference(String reference) { this.reference = reference; }
    }

    // DTO interne pour la réponse Feign
    class TransactionResponse {
        private UUID id;
        private String status;

        public UUID getId() { return id; }
        public void setId(UUID id) { this.id = id; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }
}
