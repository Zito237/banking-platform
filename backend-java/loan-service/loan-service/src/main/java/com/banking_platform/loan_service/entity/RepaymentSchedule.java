package com.banking_platform.loan_service.entity;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  RepaymentSchedule.java — Échéancier de remboursement                        ║
 * ║                                                                              ║
 * ║  Contient les mensualités (Installments) d'un prêt.                          ║
 * ║  Généré automatiquement à l'approbation du prêt.                             ║
 * ║                                                                              ║
 * ║  Relation : RepaymentSchedule 1 --- 1..* Installment (composition)           ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "repayment_schedules")
public class RepaymentSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Référence au prêt (OneToOne bidirectionnel)
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loan_id", nullable = false)
    private Loan loan;

    // Composition : un échéancier contient plusieurs mensualités
    @OneToMany(mappedBy = "repaymentSchedule", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("dueDate ASC")
    private List<Installment> installments = new ArrayList<>();

    // Constructeur vide requis par JPA
    public RepaymentSchedule() {}

    // Getters et Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Loan getLoan() { return loan; }
    public void setLoan(Loan loan) { this.loan = loan; }

    public List<Installment> getInstallments() { return installments; }
    public void setInstallments(List<Installment> installments) { this.installments = installments; }

    /**
     * Ajoute une mensualité à l'échéancier.
     */
    public void addInstallment(Installment installment) {
        installments.add(installment);
        installment.setRepaymentSchedule(this);
    }
}
