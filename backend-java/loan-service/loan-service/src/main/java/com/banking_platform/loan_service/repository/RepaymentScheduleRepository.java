package com.banking_platform.loan_service.repository;

import com.banking_platform.loan_service.entity.RepaymentSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RepaymentScheduleRepository extends JpaRepository<RepaymentSchedule, UUID> {

    /**
     * Cherche l'échéancier d'un prêt.
     */
    Optional<RepaymentSchedule> findByLoanId(UUID loanId);
}
