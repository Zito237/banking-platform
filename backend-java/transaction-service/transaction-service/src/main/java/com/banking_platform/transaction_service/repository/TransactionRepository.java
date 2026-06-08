package com.banking_platform.transaction_service.repository;

import com.banking_platform.transaction_service.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TransactionRepository extends JpaRepository<Transaction, UUID> {
    Optional<Transaction> findByReference(String reference);
    @Query("SELECT t FROM Transaction t WHERE t.sourceAccountId = :accountId OR t.destinationAccountId = :accountId")
    List<Transaction> findByAccountId(UUID accountId);
}
