package com.banking_platform.auth_service.repository;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  RoleRepository.java — Acces aux donnees des roles                           ║
 * ║                                                                              ║
 * ║  Permet de chercher un role par son nom (ex: CLIENT, OPERATOR, ADMIN).      ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import com.banking_platform.auth_service.entity.Role;
import com.banking_platform.auth_service.entity.RoleName;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoleRepository extends JpaRepository<Role, UUID> {

    /**
     * Cherche un role par son nom d'enumeration.
     * Utilise pour attribuer le role CLIENT par defaut a l'inscription.
     */
    Optional<Role> findByName(RoleName name);
}
