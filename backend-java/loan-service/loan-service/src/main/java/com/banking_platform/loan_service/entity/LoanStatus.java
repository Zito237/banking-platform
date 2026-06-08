package com.banking_platform.loan_service.entity;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  LoanStatus.java — Statuts d'un prêt actif                                   ║
 * ║                                                                              ║
 * ║  ACTIVE   : prêt en cours de remboursement                                   ║
 * ║  PAID_OFF : toutes les mensualités sont payées                               ║
 * ║  DEFAULTED : le client ne rembourse plus (défaut de paiement)               ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

public enum LoanStatus {
    ACTIVE,
    PAID_OFF,
    DEFAULTED
}
