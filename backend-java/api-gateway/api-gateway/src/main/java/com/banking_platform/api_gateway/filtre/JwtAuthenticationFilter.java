package com.banking_platform.api_gateway.filtre;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  JwtAuthenticationFilter.java — Filtre global d'authentification JWT        ║
 * ║                                                                              ║
 * ║  À quoi ça sert ?                                                            ║
 * ║  Ce filtre intercepte CHAQUE requête entrante dans la Gateway.              ║
 * ║  Il vérifie si la requête contient un JWT valide dans le header              ║
 * ║  Authorization: Bearer <token>.                                              ║
 * ║                                                                              ║
 * ║  RÈGLES :                                                                    ║
 * ║  • /auth/login et /auth/register → PAS BESOIN de JWT (publics)            ║
 * ║  • Toutes les autres routes → JWT OBLIGATOIRE, sinon 401 UNAUTHORIZED    ║
 * ║                                                                              ║
 * ║  La clé secrète JWT vient de la configuration (config-repo/api-gateway.yml)   ║
 * ║  pour ne JAMAIS être en dur dans le code.                                  ║
 * ╚════════════════════════════════════════════════════════════════════════════════╝
 */

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Component
public class JwtAuthenticationFilter implements GlobalFilter, Ordered {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    // Liste des chemins publics (pas besoin de JWT)
    private static final List<String> PUBLIC_PATHS = List.of(
            "/auth/login",
            "/auth/register",
            "/actuator/health",
            "/actuator/info"
    );

    // La clé secrète vient du fichier de configuration (config-repo/api-gateway.yml)
    // @Value l'injecte automatiquement au démarrage
    @Value("${jwt.secret}")
    private String jwtSecret;

    /**
     * Cette méthode est appelée pour CHAQUE requête qui passe par la Gateway.
     * C'est ici qu'on vérifie le JWT.
     */
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();

        // ── ÉTAPE 1 : Vérifier si le chemin est public ──────────────────────────
        // Si la requête va vers /auth/login ou /auth/register, on laisse passer
        boolean isPublic = PUBLIC_PATHS.stream().anyMatch(path::startsWith);
        if (isPublic) {
            logger.debug("Chemin public autorisé sans JWT : {}", path);
            return chain.filter(exchange);  // Passe au filtre/route suivant
        }

        // ── ÉTAPE 2 : Récupérer le header Authorization ───────────────────────
        String authHeader = request.getHeaders().getFirst("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            logger.warn("JWT manquant ou mal formaté pour : {}", path);
            return unauthorized(exchange.getResponse(), "JWT manquant ou mal formaté");
        }

        // ── ÉTAPE 3 : Extraire et valider le token ────────────────────────────
        String token = authHeader.substring(7);  // Retire "Bearer "

        try {
            // Crée la clé de signature à partir du secret
            SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));

            // Parse et valide le JWT (signature + expiration automatiques)
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            // ── ÉTAPE 4 : Extraire les infos du token et les ajouter aux headers ──
            // On transmet username et rôles aux services en aval pour qu'ils
            // n'aient pas à re-parser le JWT eux-mêmes.
            String username = claims.getSubject();
            String roles = claims.get("roles", String.class);

            logger.debug("JWT valide pour l'utilisateur : {}, rôles : {}", username, roles);

            // Ajoute les infos utilisateur dans les headers de la requête forwardée
            ServerHttpRequest mutatedRequest = exchange.getRequest().mutate()
                    .header("X-User-Name", username)
                    .header("X-User-Roles", roles != null ? roles : "")
                    .build();

            // Continue le routage vers le microservice cible
            return chain.filter(exchange.mutate().request(mutatedRequest).build());

        } catch (JwtException | IllegalArgumentException e) {
            logger.warn("JWT invalide pour {} : {}", path, e.getMessage());
            return unauthorized(exchange.getResponse(), "JWT invalide ou expiré");
        }
    }

    /**
     * Retourne une réponse 401 UNAUTHORIZED.
     */
    private Mono<Void> unauthorized(ServerHttpResponse response, String message) {
        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        response.getHeaders().add("Content-Type", "application/json");
        String body = String.format("{\"error\":\"Unauthorized\",\"message\":\"%s\"}", message);
        return response.writeWith(Mono.just(response.bufferFactory().wrap(body.getBytes())));
    }


    /**
     * Ordre d'exécution du filtre (plus le nombre est petit, plus il passe tôt).
     * -100 garantit que ce filtre s'exécute AVANT le routage.
     */
    @Override
    public int getOrder() {
        return -100;
    }
}
