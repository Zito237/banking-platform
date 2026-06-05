package com.banking_platform.auth_service.dto;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  AuthResponse.java — DTO de reponse d'authentification                       ║
 * ║                                                                              ║
 * ║  Contient le jeton JWT renvoye apres une connexion reussie.                 ║
 * ║  Le client doit stocker ce token et l'envoyer dans chaque requete           ║
 * ║  via le header : Authorization: Bearer <token>                               ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

public class AuthResponse {

    private String token;
    private String type = "Bearer";  // Toujours "Bearer" pour JWT
    private String username;
    private String message;

    public AuthResponse(String token, String username, String message) {
        this.token = token;
        this.username = username;
        this.message = message;
    }

    // Getters et Setters
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
