package com.banking_platform.account_service.service;

import com.banking_platform.account_service.client.CustomerClient;
import com.banking_platform.account_service.client.OperatorClient;
import com.banking_platform.account_service.dto.*;
import com.banking_platform.account_service.entity.Account;
import com.banking_platform.account_service.entity.AccountStatus;
import com.banking_platform.account_service.exception.InsufficientBalanceException;
import com.banking_platform.account_service.exception.ResourceNotFoundException;
import com.banking_platform.account_service.repository.AccountRepository;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class AccountService {

    private static final Logger log = LoggerFactory.getLogger(AccountService.class);

    private final AccountRepository repo;
    private final CustomerClient customerClient;
    private final OperatorClient operatorClient;

    public AccountService(AccountRepository repo, CustomerClient customerClient, OperatorClient operatorClient) {
        this.repo = repo;
        this.customerClient = customerClient;
        this.operatorClient = operatorClient;
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
        if (req.currency() != null) account.setCurrency(req.currency());

        BigDecimal ceiling = req.ceiling();
        if (ceiling == null && req.operatorId() != null) {
            try {
                Map<String, BigDecimal> resp = operatorClient.getCeiling(req.operatorId());
                ceiling = resp.get("ceiling");
            } catch (Exception e) {
                log.warn("Impossible de récupérer le plafond de l'opérateur: {}", e.getMessage());
            }
        }
        account.setCeiling(ceiling);

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
        checkCeiling(account, amount);
        account.setBalance(account.getBalance().add(amount));
        return toResponse(repo.save(account));
    }

    @Transactional
    public AccountResponse debit(UUID id, BigDecimal amount) {
        Account account = findOrThrow(id);
        checkCeiling(account, amount);
        if (account.getBalance().compareTo(amount) < 0) {
            throw new InsufficientBalanceException("Solde insuffisant");
        }
        account.setBalance(account.getBalance().subtract(amount));
        return toResponse(repo.save(account));
    }

    private void checkCeiling(Account account, BigDecimal amount) {
        BigDecimal ceiling = account.getCeiling();
        if (ceiling != null && ceiling.compareTo(BigDecimal.ZERO) > 0 && amount.compareTo(ceiling) > 0) {
            throw new IllegalArgumentException(
                "Le montant (" + amount.toPlainString() + ") dépasse le plafond autorisé (" + ceiling.toPlainString() + ") pour ce compte.");
        }
    }

    public AccountResponse getByAccountNumber(String accountNumber) {
        Account account = repo.findByAccountNumber(accountNumber)
            .orElseThrow(() -> new ResourceNotFoundException("Compte introuvable : " + accountNumber));
        return toResponse(account);
    }

    public List<AccountResponse> getAll() {
        return repo.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional
    public AccountResponse updateStatus(UUID id, AccountStatus status) {
        Account account = findOrThrow(id);
        account.setStatus(status);
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
