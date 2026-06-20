package com.banking_platform.loan_service.repository;

import com.banking_platform.loan_service.entity.Loan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LoanRepository extends JpaRepository<Loan, UUID> {

    /**
     * Liste les prêts d'un client (via l'application).
     */
    List<Loan> findByApplicationIdIn(List<UUID> applicationIds);

    Optional<Loan> findByApplicationId(UUID applicationId);
}
