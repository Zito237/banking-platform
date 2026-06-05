package com.banking_platform.operator_service.repository;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  OperatorRepository.java — Acces aux donnees des operateurs                    ║
 * ║                                                                              ║
 * ║  Spring Data JPA genere automatiquement les requetes SQL.                   ║
 * ║  On ajoute une methode de recherche par code unique.                         ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import com.banking_platform.operator_service.entity.Operator;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface OperatorRepository extends JpaRepository<Operator, UUID> {

    /**
     * Cherche un operateur par son code unique.
     * Utilise pour verifier l'unicite lors de la creation.
     */
    Optional<Operator> findByCode(String code);

    /**
     * Verifie si un code existe deja.
     */
    boolean existsByCode(String code);
}
