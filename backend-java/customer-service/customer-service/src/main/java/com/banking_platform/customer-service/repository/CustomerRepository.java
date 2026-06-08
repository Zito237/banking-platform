package com.banking_platform.customer_service.repository;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  CustomerRepository.java — Acces aux donnees des clients                       ║
 * ║                                                                              ║
 * ║  Spring Data JPA genere automatiquement les requetes SQL.                   ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import com.banking_platform.customer_service.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, UUID> {

    /**
     * Cherche un client par son email.
     */
    Optional<Customer> findByEmail(String email);

    /**
     * Cherche un client par son numero d'identite.
     */
    Optional<Customer> findByNationalIdNumber(String nationalIdNumber);

    /**
     * Verifie si un email existe deja.
     */
    boolean existsByEmail(String email);

    /**
     * Verifie si un numero d'identite existe deja.
     */
    boolean existsByNationalIdNumber(String nationalIdNumber);
}
