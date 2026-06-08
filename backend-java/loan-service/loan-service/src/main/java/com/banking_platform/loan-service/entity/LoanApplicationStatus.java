package com.banking_platform.loan_service.entity;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  LoanApplicationStatus.java — Statuts d'une demande de prêt                  ║
 * ║                                                                              ║
 * ║  SUBMITTED   : demande déposée par le client                                 ║
 * ║  UNDER_REVIEW : en cours d'analyse par un opérateur                          ║
 * ║  APPROVED    : prêt approuvé, échéancier généré, fonds débloqués             ║
 * ║  REJECTED    : prêt refusé avec motif                                        ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

public enum LoanApplicationStatus {
    SUBMITTED,
    UNDER_REVIEW,
    APPROVED,
    REJECTED
}
