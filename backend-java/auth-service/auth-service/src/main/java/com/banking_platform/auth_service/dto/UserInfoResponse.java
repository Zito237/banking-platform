package com.banking_platform.auth_service.dto;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  UserInfoResponse.java — DTO pour les infos de l'utilisateur connecte        ║
 * ║                                                                              ║
 * ║  Renvoye par GET /auth/me. Ne contient PAS le mot de passe.                 ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import java.util.Set;
import java.util.UUID;

public class UserInfoResponse {

    private UUID id;
    private String username;
    private String email;
    private boolean enabled;
    private Set<String> roles;  // Noms des roles uniquement
    private UUID operatorId;
    private UUID linkedCustomerId;

    // Getters et Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public Set<String> getRoles() { return roles; }
    public void setRoles(Set<String> roles) { this.roles = roles; }

    public UUID getOperatorId() { return operatorId; }
    public void setOperatorId(UUID operatorId) { this.operatorId = operatorId; }

    public UUID getLinkedCustomerId() { return linkedCustomerId; }
    public void setLinkedCustomerId(UUID linkedCustomerId) { this.linkedCustomerId = linkedCustomerId; }
}
