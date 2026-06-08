package com.banking_platform.customer_service.entity;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  KycStatus.java — Enumeration des statuts KYC (Know Your Customer)           ║
 * ║                                                                              ║
 * ║  PENDING  : le client est inscrit mais ses documents ne sont pas verifies  ║
 * ║  VERIFIED : les documents ont ete verifies par l'OCR et valides               ║
 * ║  REJECTED : les documents sont invalides ou suspects                         ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

public enum KycStatus {
    PENDING,
    VERIFIED,
    REJECTED
}
