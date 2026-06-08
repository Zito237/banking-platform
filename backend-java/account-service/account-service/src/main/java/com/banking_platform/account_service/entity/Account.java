package com.banking_platform.account_service.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "accounts")
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false)
    private String accountNumber;

    @Column(nullable = false)
    private UUID customerId;

    private UUID operatorId;

    @Enumerated(EnumType.STRING)
    private AccountType accountType;

    @Column(precision = 19, scale = 4)
    private BigDecimal balance = BigDecimal.ZERO;

    private String currency = "XAF";

    @Column(precision = 19, scale = 4)
    private BigDecimal ceiling;

    @Enumerated(EnumType.STRING)
    private AccountStatus status = AccountStatus.ACTIVE;

    private LocalDateTime openedAt;

    @Version
    private Long version;

    @PrePersist
    void prePersist() { openedAt = LocalDateTime.now(); }

    public UUID getId() { return id; }
    public String getAccountNumber() { return accountNumber; }
    public void setAccountNumber(String accountNumber) { this.accountNumber = accountNumber; }
    public UUID getCustomerId() { return customerId; }
    public void setCustomerId(UUID customerId) { this.customerId = customerId; }
    public UUID getOperatorId() { return operatorId; }
    public void setOperatorId(UUID operatorId) { this.operatorId = operatorId; }
    public AccountType getAccountType() { return accountType; }
    public void setAccountType(AccountType accountType) { this.accountType = accountType; }
    public BigDecimal getBalance() { return balance; }
    public void setBalance(BigDecimal balance) { this.balance = balance; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public BigDecimal getCeiling() { return ceiling; }
    public void setCeiling(BigDecimal ceiling) { this.ceiling = ceiling; }
    public AccountStatus getStatus() { return status; }
    public void setStatus(AccountStatus status) { this.status = status; }
    public LocalDateTime getOpenedAt() { return openedAt; }
    public Long getVersion() { return version; }
}
