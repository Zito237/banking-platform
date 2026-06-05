package com.banking_platform.auth_service.entity;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  RoleName.java — Enumeration des roles possibles                             ║
 * ║                                                                              ║
 * ║  CLIENT   : utilisateur final (acces a ses comptes, transactions, prets)     ║
 * ║  OPERATOR : employe d'un operateur financier (validation des prets)          ║
 * ║  ADMIN    : administrateur systeme (gestion des operateurs, audit)           ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

public enum RoleName {
    CLIENT,
    OPERATOR,
    ADMIN
}
