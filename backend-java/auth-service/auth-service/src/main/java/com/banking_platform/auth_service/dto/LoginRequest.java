package com.banking_platform.auth_service.dto;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  LoginRequest.java — DTO pour la connexion                                   ║
 * ║                                                                              ║
 * ║  Contient les identifiants envoyes par le client pour se connecter.         ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import jakarta.validation.constraints.NotBlank;

public class LoginRequest {

    @NotBlank(message = "Le nom d'utilisateur est obligatoire")
    private String username;

    @NotBlank(message = "Le mot de passe est obligatoire")
    private String password;

    // Getters et Setters
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
