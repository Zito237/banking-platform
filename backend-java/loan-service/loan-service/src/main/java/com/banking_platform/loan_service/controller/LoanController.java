package com.banking_platform.loan_service.controller;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  LoanController.java — Controller REST pour les prêts                         ║
 * ║                                                                              ║
 * ║  Expose les endpoints :                                                      ║
 * ║  • POST /loans              → créer une demande (status = SUBMITTED)        ║
 * ║  • POST /loans/{id}/decision → approuver/rejeter (opérateur)                 ║
 * ║  • GET  /loans/{id}/schedule → voir l'échéancier                             ║
 * ║  • POST /loans/{id}/repay   → rembourser une mensualité                      ║
 * ║                                                                              ║
 * ║  Swagger : /swagger-ui.html                                                  ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import com.banking_platform.loan_service.dto.*;
import com.banking_platform.loan_service.service.LoanService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/loans")
public class LoanController {

    private final LoanService loanService;

    public LoanController(LoanService loanService) {
        this.loanService = loanService;
    }

    /**
     * POST /loans
     * Crée une demande de prêt (status = SUBMITTED).
     */
    @PostMapping
    public ResponseEntity<LoanApplicationResponse> createLoanApplication(
            @Valid @RequestBody LoanRequest request) {
        LoanApplicationResponse response = loanService.createLoanApplication(request);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /loans/{id}/decision
     * Approuve ou rejette une demande de prêt.
     * Si approuvé : crée le prêt + génère l'échéancier + publie LoanApproved.
     * Si rejeté : publie LoanRejected.
     */
    @PostMapping("/{id}/decision")
    public ResponseEntity<LoanResponse> decideLoanApplication(
            @PathVariable UUID id,
            @Valid @RequestBody LoanDecisionRequest request) {
        LoanResponse response = loanService.decideLoanApplication(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /loans/{id}/schedule
     * Renvoie l'échéancier de remboursement d'un prêt.
     */
    @GetMapping("/{id}/schedule")
    public ResponseEntity<RepaymentScheduleResponse> getSchedule(@PathVariable UUID id) {
        RepaymentScheduleResponse response = loanService.getSchedule(id);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /loans/{id}/repay
     * Rembourse une mensualité.
     * Appelle transaction-service pour débiter le compte client.
     * Si toutes les mensualités sont payées, le prêt passe à PAID_OFF.
     */
    @PostMapping("/{id}/repay")
    public ResponseEntity<InstallmentResponse> repayInstallment(
            @PathVariable UUID id,
            @Valid @RequestBody RepaymentRequest request) {
        InstallmentResponse response = loanService.repayInstallment(id, request);
        return ResponseEntity.ok(response);
    }
}
