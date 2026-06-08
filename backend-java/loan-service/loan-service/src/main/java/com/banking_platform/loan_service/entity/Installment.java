package com.banking_platform.loan_service.entity;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  Installment.java — Mensualité de remboursement                              ║
 * ║                                                                              ║
 * ║  Représente une mensualité de l'échéancier.                                  ║
 * ║  Chaque mensualité a :                                                       ║
 * ║  • une date d'échéance (dueDate)                                             ║
 * ║  • un montant total (amount = principalPart + interestPart)                  ║
 * ║  • une part capital (principalPart) et une part intérêts (interestPart)     ║
 * ║  • un statut (PENDING, PAID, LATE)                                           ║
 * ║                                                                              ║
 * ║  Calcul : amortissement linéaire (mensualités fixes)                           ║
 * ║  principalPart = principal / termMonths                                       ║
 * ║  interestPart = (principal * interestRate / 12)                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "installments")
public class Installment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_id", nullable = false)
    private RepaymentSchedule repaymentSchedule;

    @Column(nullable = false)
    private LocalDate dueDate;  // Date d'échéance

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;  // Montant total de la mensualité

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal principalPart;  // Part capital

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal interestPart;  // Part intérêts

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InstallmentStatus status = InstallmentStatus.PENDING;

    @Column
    private LocalDateTime paidAt;  // Date de paiement (null si non payée)

    // Constructeur vide requis par JPA
    public Installment() {}

    // Getters et Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public RepaymentSchedule getRepaymentSchedule() { return repaymentSchedule; }
    public void setRepaymentSchedule(RepaymentSchedule repaymentSchedule) { this.repaymentSchedule = repaymentSchedule; }

    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public BigDecimal getPrincipalPart() { return principalPart; }
    public void setPrincipalPart(BigDecimal principalPart) { this.principalPart = principalPart; }

    public BigDecimal getInterestPart() { return interestPart; }
    public void setInterestPart(BigDecimal interestPart) { this.interestPart = interestPart; }

    public InstallmentStatus getStatus() { return status; }
    public void setStatus(InstallmentStatus status) { this.status = status; }

    public LocalDateTime getPaidAt() { return paidAt; }
    public void setPaidAt(LocalDateTime paidAt) { this.paidAt = paidAt; }
}
