package com.banking_platform.customer_service.repository;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  DocumentRepository.java — Acces aux donnees des documents                     ║
 * ║                                                                              ║
 * ║  Permet de chercher les documents par client.                               ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import com.banking_platform.customer_service.entity.DocumentReference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DocumentRepository extends JpaRepository<DocumentReference, UUID> {

    /**
     * Liste les documents d'un client.
     */
    List<DocumentReference> findByCustomerId(UUID customerId);
}
