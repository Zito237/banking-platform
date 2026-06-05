package com.banking_platform.auth_service.config;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  SecurityConfig.java — Configuration de la securite Spring Security          ║
 * ║                                                                              ║
 * ║  Ce service est un service d'authentification, donc il a BESOIN de          ║
 * ║  Spring Security pour hasher les mots de passe avec BCrypt.                 ║
 * ║                                                                              ║
 * ║  On desactive la securite par defaut sur les endpoints car :                ║
 * ║  • La Gateway verifie deja le JWT                                           ║
 * ║  • Ce service gere lui-meme l'authentification (login/register)             ║
 * ║                                                                              ║
 * ║  On garde juste le PasswordEncoder pour hasher les mots de passe.           ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    /**
     * Bean PasswordEncoder : utilise BCrypt pour hasher les mots de passe.
     * BCrypt est un algorithme de hachage securise (salt + cout adaptatif).
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Configure la chaine de filtres de securite.
     * On desactive CSRF et on autorise toutes les requetes car la Gateway
     * gere deja l'authentification JWT en amont.
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)  // Desactive CSRF (API REST stateless)
            .authorizeHttpRequests(auth -> auth
                .anyRequest().permitAll()           // Toutes les requetes sont autorisees
            );
        return http.build();
    }
}
