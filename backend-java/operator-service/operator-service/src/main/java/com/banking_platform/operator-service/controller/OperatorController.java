package com.banking_platform.operator_service.controller;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  OperatorController.java — Controller REST pour les operateurs                 ║
 * ║                                                                              ║
 * ║  Expose les endpoints :                                                      ║
 * ║  • POST /operators              → creer un operateur (admin)                ║
 * ║  • GET  /operators/{id}         → details d'un operateur                      ║
 * ║  • GET  /operators              → liste tous les operateurs                 ║
 * ║  • GET  /operators/{id}/commission → taux de commission (appel par transaction-service)
 * ║                                                                              ║
 * ║  La documentation Swagger est accessible sur /swagger-ui.html               ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import com.banking_platform.operator_service.dto.*;
import com.banking_platform.operator_service.service.OperatorService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/operators")
public class OperatorController {

    private final OperatorService operatorService;

    public OperatorController(OperatorService operatorService) {
        this.operatorService = operatorService;
    }

    /**
     * POST /operators
     * Cree un nouvel operateur avec ses regles metier.
     * Accessible uniquement aux administrateurs (verifie par la Gateway).
     */
    @PostMapping
    public ResponseEntity<OperatorResponse> createOperator(
            @Valid @RequestBody OperatorRequest request) {
        OperatorResponse response = operatorService.createOperator(request);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /operators/{id}
     * Recupere les details d'un operateur (nom, code, pays, regles).
     */
    @GetMapping("/{id}")
    public ResponseEntity<OperatorResponse> getOperator(@PathVariable UUID id) {
        OperatorResponse response = operatorService.getOperator(id);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /operators
     * Liste tous les operateurs enregistres.
     */
    @GetMapping
    public ResponseEntity<List<OperatorResponse>> getAllOperators() {
        List<OperatorResponse> response = operatorService.getAllOperators();
        return ResponseEntity.ok(response);
    }

    /**
     * PUT /operators/{id}
     * Met a jour les informations d'un operateur (nom, pays, regles).
     */
    @PutMapping("/{id}")
    public ResponseEntity<OperatorResponse> updateOperator(
            @PathVariable UUID id,
            @RequestBody com.banking_platform.operator_service.dto.OperatorUpdateRequest request) {
        return ResponseEntity.ok(operatorService.updateOperator(id, request));
    }

    /**
     * PATCH /operators/{id}/status
     * Suspend ou reactive un operateur.
     * Body: { "status": "SUSPENDED" } ou { "status": "ACTIVE" }
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<OperatorResponse> updateStatus(
            @PathVariable UUID id,
            @RequestBody java.util.Map<String, String> body) {
        com.banking_platform.operator_service.entity.OperatorStatus status =
                com.banking_platform.operator_service.entity.OperatorStatus.valueOf(body.get("status"));
        return ResponseEntity.ok(operatorService.updateStatus(id, status));
    }

    /**
     * GET /operators/{id}/commission
     * Renvoie le taux de commission de l'operateur.
     * APPELE PAR transaction-service via OpenFeign lors d'un transfert inter-operateurs.
     * Ex de reponse : { "commissionRate": 1.5, "commissionValue": "1.5%" }
     */
    @GetMapping("/{id}/commission")
    public ResponseEntity<CommissionResponse> getCommission(@PathVariable UUID id) {
        CommissionResponse response = operatorService.getCommission(id);
        return ResponseEntity.ok(response);
    }
}
