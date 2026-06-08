package com.banking_platform.operator_service.repository;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  BusinessRuleRepository.java — Acces aux donnees des regles metier           ║
 * ║                                                                              ║
 * ║  Permet de chercher les regles par operateur et par type.                   ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import com.banking_platform.operator_service.entity.BusinessRule;
import com.banking_platform.operator_service.entity.RuleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BusinessRuleRepository extends JpaRepository<BusinessRule, UUID> {

    /**
     * Cherche les regles d'un operateur par son ID.
     */
    List<BusinessRule> findByOperatorId(UUID operatorId);

    /**
     * Cherche une regle specifique par operateur et type.
     * Utilise pour trouver la regle COMMISSION d'un operateur.
     */
    Optional<BusinessRule> findByOperatorIdAndRuleType(UUID operatorId, RuleType ruleType);
}
