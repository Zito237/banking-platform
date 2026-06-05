package com.banking_platform.auth_service.security;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  JwtUtil.java — Utilitaire pour gerer les jetons JWT                         ║
 * ║                                                                              ║
 * ║  Ce service :                                                                ║
 * ║  • Genere un JWT signe contenant username, roles et date d'expiration       ║
 * ║  • Extrait les claims (donnees) d'un JWT pour les valider                   ║
 * ║  • Verifie si un token est expire                                            ║
 * ║                                                                              ║
 * ║  La cle secrete vient de la configuration (config-repo/auth-service.yml)     ║
 * ║  pour ne JAMAIS etre en dur dans le code.                                   ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class JwtUtil {

    // Injection de la cle secrete depuis la configuration
    @Value("${jwt.secret}")
    private String jwtSecret;

    // Injection de la duree de validite du token (en millisecondes)
    @Value("${jwt.expiration}")
    private long jwtExpiration;

    /**
     * Genere un jeton JWT pour un utilisateur.
     *
     * @param username le nom d'utilisateur
     * @param roles    les roles de l'utilisateur
     * @return le token JWT signe
     */
    public String generateToken(String username, Set<String> roles) {
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));

        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpiration);

        return Jwts.builder()
                .subject(username)                          // Sujet = username
                .claim("roles", String.join(",", roles))    // Roles dans le payload
                .issuedAt(now)                              // Date de creation
                .expiration(expiryDate)                     // Date d'expiration
                .signWith(key)                              // Signature avec la cle secrete
                .compact();                                 // Compacte en String
    }

    /**
     * Extrait les claims (donnees) d'un token JWT.
     */
    public Claims extractClaims(String token) {
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));

        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Extrait le username du token.
     */
    public String extractUsername(String token) {
        return extractClaims(token).getSubject();
    }

    /**
     * Extrait les roles du token.
     */
    public Set<String> extractRoles(String token) {
        String rolesString = extractClaims(token).get("roles", String.class);
        if (rolesString == null || rolesString.isEmpty()) {
            return Set.of();
        }
        return Set.of(rolesString.split(","));
    }

    /**
     * Verifie si le token est valide (non expire).
     */
    public boolean isTokenValid(String token) {
        try {
            Date expiration = extractClaims(token).getExpiration();
            return expiration.after(new Date());
        } catch (Exception e) {
            return false;
        }
    }
}
