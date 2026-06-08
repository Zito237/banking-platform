package com.banking_platform.operator_service.entity;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  Operator.java — Entite Operateur (racine d'agregat)                           ║
 * ║                                                                              ║
 * ║  Represente un operateur financier (banque, microfinance, operateur mobile)  ║
 * ║  Chaque operateur a un code unique et un pays.                              ║
 * ║  Un operateur peut etre ACTIVE ou SUSPENDED.                                  ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "operators")
public class Operator {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;  // Nom de l'operateur (ex: "MTN Mobile Money")

    @Column(nullable = false, unique = true)
    private String code;  // Code unique (ex: "MTN", "ECOBANK")

    @Column(nullable = false)
    private String country;  // Pays (ex: "Cameroun", "Cote d'Ivoire")

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OperatorStatus status = OperatorStatus.ACTIVE;

    // Composition : un operateur possede plusieurs regles metier
    // Cascade ALL = si on supprime l'operateur, on supprime ses regles
    // OrphanRemoval = si on retire une regle de la liste, elle est supprimee en base
    @OneToMany(mappedBy = "operator", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<BusinessRule> rules = new ArrayList<>();

    // Constructeur vide requis par JPA
    public Operator() {}

    public Operator(String name, String code, String country) {
        this.name = name;
        this.code = code;
        this.country = country;
    }

    // Getters et Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public OperatorStatus getStatus() { return status; }
    public void setStatus(OperatorStatus status) { this.status = status; }

    public List<BusinessRule> getRules() { return rules; }
    public void setRules(List<BusinessRule> rules) { this.rules = rules; }

    /**
     * Ajoute une regle metier a l'operateur.
     * Met a jour la relation bidirectionnelle.
     */
    public void addRule(BusinessRule rule) {
        rules.add(rule);
        rule.setOperator(this);
    }

    /**
     * Supprime une regle metier.
     */
    public void removeRule(BusinessRule rule) {
        rules.remove(rule);
        rule.setOperator(null);
    }
}
