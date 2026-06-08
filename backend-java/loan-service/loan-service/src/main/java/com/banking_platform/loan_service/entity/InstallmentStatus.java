package com.banking_platform.loan_service.entity;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  InstallmentStatus.java — Statuts d'une mensualité                           ║
 * ║                                                                              ║
 * ║  PENDING : mensualité en attente de paiement                                  ║
 * ║  PAID    : mensualité payée                                                  ║
 * ║  LATE    : mensualité en retard (date d'échéance dépassée)                  ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

public enum InstallmentStatus {
    PENDING,
    PAID,
    LATE
}
