package com.banking_platform.customer_service.entity;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  DocumentType.java — Enumeration des types de documents acceptes               ║
 * ║                                                                              ║
 * ║  ID_CARD           : carte nationale d'identite                              ║
 * ║  PASSPORT          : passeport                                               ║
 * ║  PROOF_OF_RESIDENCE : justificatif de domicile                              ║
 * ║  PAYSLIP           : bulletin de paie                                        ║
 * ║  BANK_STATEMENT    : releve bancaire                                         ║
 * ║  WORK_CONTRACT     : contrat de travail                                    ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

public enum DocumentType {
    ID_CARD,
    PASSPORT,
    PROOF_OF_RESIDENCE,
    PAYSLIP,
    BANK_STATEMENT,
    WORK_CONTRACT
}
