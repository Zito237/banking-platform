package com.banking_platform.auth_service.repository;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  UserRepository.java — Acces aux donnees des utilisateurs                    ║
 * ║                                                                              ║
 * ║  Spring Data JPA genere automatiquement les requetes SQL.                   ║
 * ║  On ajoute des methodes de recherche personnalisees par nom d'utilisateur   ║
 * ║  et par email (utilisees pour l'authentification).                           ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import com.banking_platform.auth_service.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    /**
     * Cherche un utilisateur par son nom d'utilisateur.
     * Utilise pour la connexion (login).
     */
    Optional<User> findByUsername(String username);

    /**
     * Verifie si un nom d'utilisateur existe deja.
     * Utilise pour empecher les doublons lors de l'inscription.
     */
    boolean existsByUsername(String username);

    /**
     * Verifie si un email existe deja.
     * Utilise pour empecher les doublons lors de l'inscription.
     */
    boolean existsByEmail(String email);
}
