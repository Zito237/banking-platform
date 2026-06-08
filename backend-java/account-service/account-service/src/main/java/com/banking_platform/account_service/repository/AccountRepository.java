package com.banking_platform.account_service.repository;

import com.banking_platform.account_service.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface AccountRepository extends JpaRepository<Account, UUID> {
    List<Account> findByCustomerId(UUID customerId);
    boolean existsByAccountNumber(String accountNumber);
}
