package com.banking_platform.loan_service.repository;

import com.banking_platform.loan_service.entity.Installment;
import com.banking_platform.loan_service.entity.InstallmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InstallmentRepository extends JpaRepository<Installment, UUID> {

    /**
     * Liste les mensualités d'un échéancier.
     */
    List<Installment> findByRepaymentScheduleId(UUID scheduleId);

    /**
     * Compte les mensualités payées d'un échéancier.
     */
    long countByRepaymentScheduleIdAndStatus(UUID scheduleId, InstallmentStatus status);
}
