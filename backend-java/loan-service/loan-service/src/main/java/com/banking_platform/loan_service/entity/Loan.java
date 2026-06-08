package com.banking_platform.loan_service.entity;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  Loan.java — Prêt actif (racine d'agrégat)                                   ║
 * ║                                                                              ║
 * ║  Créé quand une demande est APPROVED.                                        ║
 * ║  Contient le montant principal, le taux d'intérêt, la durée.               ║
 * ║  Un prêt a un échéancier (RepaymentSchedule) avec des mensualités.          ║
 * ║                                                                              ║
 * ║  Relation : Loan 1 --- 1 RepaymentSchedule (composition)                     ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "loans")
public class Loan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID applicationId;  // Référence à la demande approuvée

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal principal;  // Montant du prêt (capital)

    @Column(nullable = false)
    private double interestRate;  // Taux d'intérêt annuel (ex: 0.12 = 12%)

    @Column(nullable = false)
    private int termMonths;  // Durée en mois

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LoanStatus status = LoanStatus.ACTIVE;

    @Column
    private LocalDateTime disbursedAt;  // Date de déblocage des fonds

    // Composition : un prêt a exactement un échéancier
    @OneToOne(mappedBy = "loan", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private RepaymentSchedule repaymentSchedule;

    @PrePersist
    public void prePersist() {
        this.disbursedAt = LocalDateTime.now();
    }

    // Constructeur vide requis par JPA
    public Loan() {}

    // Getters et Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getApplicationId() { return applicationId; }
    public void setApplicationId(UUID applicationId) { this.applicationId = applicationId; }

    public BigDecimal getPrincipal() { return principal; }
    public void setPrincipal(BigDecimal principal) { this.principal = principal; }

    public double getInterestRate() { return interestRate; }
    public void setInterestRate(double interestRate) { this.interestRate = interestRate; }

    public int getTermMonths() { return termMonths; }
    public void setTermMonths(int termMonths) { this.termMonths = termMonths; }

    public LoanStatus getStatus() { return status; }
    public void setStatus(LoanStatus status) { this.status = status; }

    public LocalDateTime getDisbursedAt() { return disbursedAt; }
    public void setDisbursedAt(LocalDateTime disbursedAt) { this.disbursedAt = disbursedAt; }

    public RepaymentSchedule getRepaymentSchedule() { return repaymentSchedule; }
    public void setRepaymentSchedule(RepaymentSchedule repaymentSchedule) {
        this.repaymentSchedule = repaymentSchedule;
        if (repaymentSchedule != null) {
            repaymentSchedule.setLoan(this);
        }
    }
}
