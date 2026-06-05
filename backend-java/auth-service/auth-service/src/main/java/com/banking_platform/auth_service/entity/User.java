package com.banking_platform.auth_service.entity;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  User.java — Entite utilisateur (racine d'agregat IAM)                       ║
 * ║                                                                              ║
 * ║  Represente un compte utilisateur dans le systeme.                           ║
 * ║  Le mot de passe est STOCKE HASHE avec BCrypt (jamais en clair !).           ║
 * ║  operatorId et linkedCustomerId sont nullable car :                          ║
 * ║  • un ADMIN n'a pas d'operateur ni de client lie                             ║
 * ║  • un OPERATOR a un operatorId mais pas forcement de customerId              ║
 * ║  • un CLIENT a un linkedCustomerId (son profil client)                       ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import jakarta.persistence.*;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String passwordHash;  // Hash BCrypt, JAMAIS le mot de passe en clair

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private boolean enabled = true;  // Compte actif par defaut

    @Column
    private UUID operatorId;  // Nullable : ID de l'operateur pour un OPERATOR

    @Column
    private UUID linkedCustomerId;  // Nullable : ID du client pour un CLIENT

    // Relation many-to-many avec Role
    // Un user peut avoir plusieurs roles, un role peut appartenir a plusieurs users
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "user_roles",  // Nom de la table de jointure
        joinColumns = @JoinColumn(name = "user_id"),      // Colonne cote User
        inverseJoinColumns = @JoinColumn(name = "role_id") // Colonne cote Role
    )
    private Set<Role> roles = new HashSet<>();

    // Constructeur vide requis par JPA
    public User() {}

    // Getters et Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public UUID getOperatorId() { return operatorId; }
    public void setOperatorId(UUID operatorId) { this.operatorId = operatorId; }

    public UUID getLinkedCustomerId() { return linkedCustomerId; }
    public void setLinkedCustomerId(UUID linkedCustomerId) { this.linkedCustomerId = linkedCustomerId; }

    public Set<Role> getRoles() { return roles; }
    public void setRoles(Set<Role> roles) { this.roles = roles; }

    /**
     * Ajoute un role a l'utilisateur.
     */
    public void addRole(Role role) {
        this.roles.add(role);
    }
}
