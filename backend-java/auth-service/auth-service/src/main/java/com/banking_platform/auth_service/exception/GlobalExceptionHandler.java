package com.banking_platform.auth_service.exception;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  GlobalExceptionHandler.java — Gestionnaire d'erreurs global                 ║
 * ║                                                                              ║
 * ║  Intercepte TOUTES les exceptions lancees par les controllers               ║
 * ║  et renvoie une reponse JSON normalisee avec :                               ║
 * ║  { timestamp, status, error, message, path }                                 ║
 * ║                                                                              ║
 * ║  Cela garantit que le client recoit toujours un JSON comprehensible,        ║
 * ║  meme en cas d'erreur, et pas une stack trace brute.                        ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Gere les exceptions de validation (@Valid).
     * Ex: @NotBlank, @Email, @Size non respectes.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationErrors(
            MethodArgumentNotValidException ex,
            HttpServletRequest request) {

        // Recupere tous les messages d'erreur de validation
        Map<String, String> errors = new HashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            errors.put(error.getField(), error.getDefaultMessage());
        }

        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("error", "Validation Error");
        body.put("message", errors);
        body.put("path", request.getRequestURI());

        return ResponseEntity.badRequest().body(body);
    }

    /**
     * Gere les RuntimeException (ex: "Utilisateur non trouve", "Mot de passe incorrect").
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(
            RuntimeException ex,
            HttpServletRequest request) {

        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("error", "Business Error");
        body.put("message", ex.getMessage());
        body.put("path", request.getRequestURI());

        return ResponseEntity.badRequest().body(body);
    }

    /**
     * Gere toutes les autres exceptions non prevues.
     * Renvoie une erreur 500 INTERNAL SERVER ERROR.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(
            Exception ex,
            HttpServletRequest request) {

        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        body.put("error", "Internal Server Error");
        body.put("message", "Une erreur interne s'est produite");
        body.put("path", request.getRequestURI());

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}
