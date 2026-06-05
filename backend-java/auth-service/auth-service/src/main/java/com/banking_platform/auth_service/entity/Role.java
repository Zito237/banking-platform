package com.banking_platform.auth_service.entity;


/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  Role.java — Entite representant un role utilisateur                         ║
 * ║                                                                              ║
 * ║  Les roles possibles sont : CLIENT, OPERATOR, ADMIN                          ║
 * ║  Un utilisateur peut avoir plusieurs roles (relation many-to-many).          ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import jakarta.persistence.*;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "roles")
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true)
    private RoleName name;

    // Relation many-to-many inverse : un role peut etre attribue a plusieurs users
    @ManyToMany(mappedBy = "roles")
    private Set<User> users = new HashSet<>();

    // Constructeur vide requis par JPA
    public Role() {}

    public Role(RoleName name) {
        this.name = name;
    }

    // Getters et Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public RoleName getName() { return name; }
    public void setName(RoleName name) { this.name = name; }

    public Set<User> getUsers() { return users; }
    public void setUsers(Set<User> users) { this.users = users; }
}
