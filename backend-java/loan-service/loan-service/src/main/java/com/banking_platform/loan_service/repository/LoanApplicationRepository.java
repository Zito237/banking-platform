package com.banking_platform.loan_service.repository;

import com.banking_platform.loan_service.entity.LoanApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LoanApplicationRepository extends JpaRepository<LoanApplication, UUID> {

    /**
     * Liste les demandes d'un client.
     */
    List<LoanApplication> findByCustomerId(UUID customerId);
}
