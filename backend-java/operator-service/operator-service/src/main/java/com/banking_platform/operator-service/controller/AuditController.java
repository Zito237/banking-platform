package com.banking_platform.operator_service.controller;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  AuditController.java — Controller REST pour le journal d'audit              ║
 * ║                                                                              ║
 * ║  • GET /operators/audit → liste des evenements d'audit (plus recent au plus ║
 * ║    ancien), alimentee par les evenements RabbitMQ de toute la plateforme.    ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import com.banking_platform.operator_service.dto.AuditLogResponse;
import com.banking_platform.operator_service.entity.AuditLog;
import com.banking_platform.operator_service.repository.AuditLogRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/operators/audit")
public class AuditController {

    private final AuditLogRepository auditLogRepository;

    public AuditController(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @GetMapping
    public ResponseEntity<List<AuditLogResponse>> getAuditLog() {
        List<AuditLogResponse> response = auditLogRepository.findAllByOrderByTimestampDesc().stream()
                .map(a -> new AuditLogResponse(a.getId(), a.getAction(), a.getUserId(), a.getTimestamp(), a.getDetails()))
                .toList();
        return ResponseEntity.ok(response);
    }
}
