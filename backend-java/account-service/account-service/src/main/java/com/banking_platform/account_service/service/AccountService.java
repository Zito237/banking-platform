package com.banking_platform.account_service.service;

import com.banking_platform.account_service.client.CustomerClient;
import com.banking_platform.account_service.dto.*;
import com.banking_platform.account_service.entity.Account;
import com.banking_platform.account_service.exception.InsufficientBalanceException;
import com.banking_platform.account_service.exception.ResourceNotFoundException;
import com.banking_platform.account_service.repository.AccountRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
public class AccountService {

    private final AccountRepository repo;
    private final CustomerClient customerClient;

    public AccountService(AccountRepository repo, CustomerClient customerClient) {
        this.repo = repo;
        this.customerClient = customerClient;
    }

    public AccountResponse openAccount(AccountRequest req) {
        if (!customerClient.existsById(req.customerId())) {
            throw new ResourceNotFoundException("Customer not found: " + req.customerId());
        }
        Account account = new Account();
        account.setAccountNumber(generateAccountNumber());
        account.setCustomerId(req.customerId());
        account.setOperatorId(req.operatorId());
        account.setAccountType(req.accountType());
        account.setCeiling(req.ceiling());
        if (req.currency() != null) account.setCurrency(req.currency());
        return toResponse(repo.save(account));
    }

    public AccountResponse getById(UUID id) {
        return toResponse(findOrThrow(id));
    }

    public List<AccountResponse> getByCustomerId(UUID customerId) {
        return repo.findByCustomerId(customerId).stream().map(this::toResponse).toList();
    }

    @Transactional
    public AccountResponse credit(UUID id, BigDecimal amount) {
        Account account = findOrThrow(id);
        account.setBalance(account.getBalance().add(amount));
        return toResponse(repo.save(account));
    }

    @Transactional
    public AccountResponse debit(UUID id, BigDecimal amount) {
        Account account = findOrThrow(id);
        if (account.getBalance().compareTo(amount) < 0) {
            throw new InsufficientBalanceException("Solde insuffisant");
        }
        account.setBalance(account.getBalance().subtract(amount));
        return toResponse(repo.save(account));
    }

    private Account findOrThrow(UUID id) {
        return repo.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + id));
    }

    private String generateAccountNumber() {
        String num;
        do { num = "ACC" + System.currentTimeMillis(); } while (repo.existsByAccountNumber(num));
        return num;
    }

    private AccountResponse toResponse(Account a) {
        return new AccountResponse(a.getId(), a.getAccountNumber(), a.getCustomerId(),
            a.getOperatorId(), a.getAccountType(), a.getBalance(), a.getCurrency(),
            a.getCeiling(), a.getStatus(), a.getOpenedAt());
    }
}
