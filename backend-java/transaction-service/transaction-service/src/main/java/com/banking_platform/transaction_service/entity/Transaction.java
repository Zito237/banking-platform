package com.banking_platform.transaction_service.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "transactions")
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false)
    private String reference;

    @Enumerated(EnumType.STRING)
    private TransactionType type;

    @Column(precision = 19, scale = 4, nullable = false)
    private BigDecimal amount;

    private String currency = "XAF";

    @Column(precision = 19, scale = 4)
    private BigDecimal fees = BigDecimal.ZERO;

    private UUID sourceAccountId;
    private UUID destinationAccountId;

    @Enumerated(EnumType.STRING)
    private TransactionStatus status = TransactionStatus.PENDING;

    private UUID sagaId;

    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() { createdAt = LocalDateTime.now(); }

    public UUID getId() { return id; }
    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }
    public TransactionType getType() { return type; }
    public void setType(TransactionType type) { this.type = type; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public BigDecimal getFees() { return fees; }
    public void setFees(BigDecimal fees) { this.fees = fees; }
    public UUID getSourceAccountId() { return sourceAccountId; }
    public void setSourceAccountId(UUID sourceAccountId) { this.sourceAccountId = sourceAccountId; }
    public UUID getDestinationAccountId() { return destinationAccountId; }
    public void setDestinationAccountId(UUID destinationAccountId) { this.destinationAccountId = destinationAccountId; }
    public TransactionStatus getStatus() { return status; }
    public void setStatus(TransactionStatus status) { this.status = status; }
    public UUID getSagaId() { return sagaId; }
    public void setSagaId(UUID sagaId) { this.sagaId = sagaId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
