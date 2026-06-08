package com.banking_platform.loan_service.service;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  LoanService.java — Service métier des prêts                                 ║
 * ║                                                                              ║
 * ║  Contient la logique métier pour :                                          ║
 * ║  • Créer une demande de prêt (status = SUBMITTED)                            ║
 * ║  • Approuver/rejeter une demande (génération échéancier si approuvé)         ║
 * ║  • Consulter l'échéancier                                                    ║
 * ║  • Rembourser une mensualité (appel Feign vers transaction-service)         ║
 * ║                                                                              ║
 * ║  Calcul de l'échéancier (amortissement linéaire) :                           ║
 * ║  • Mensualité fixe = capital/termMonths + (capital * tauxMensuel)           ║
 * ║  • partCapital = capital / termMonths                                         ║
 * ║  • partInterets = capital * (tauxAnnuel / 12)                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import com.banking_platform.loan_service.client.TransactionClient;
import com.banking_platform.loan_service.dto.*;
import com.banking_platform.loan_service.entity.*;
import com.banking_platform.loan_service.messaging.*;
import com.banking_platform.loan_service.repository.*;
import com.banking_platform.loan_service.config.RabbitMQConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class LoanService {

    private static final Logger logger = LoggerFactory.getLogger(LoanService.class);

    private final LoanApplicationRepository loanApplicationRepository;
    private final LoanRepository loanRepository;
    private final RepaymentScheduleRepository scheduleRepository;
    private final InstallmentRepository installmentRepository;
    private final TransactionClient transactionClient;
    private final RabbitTemplate rabbitTemplate;

    public LoanService(LoanApplicationRepository loanApplicationRepository,
                       LoanRepository loanRepository,
                       RepaymentScheduleRepository scheduleRepository,
                       InstallmentRepository installmentRepository,
                       TransactionClient transactionClient,
                       RabbitTemplate rabbitTemplate) {
        this.loanApplicationRepository = loanApplicationRepository;
        this.loanRepository = loanRepository;
        this.scheduleRepository = scheduleRepository;
        this.installmentRepository = installmentRepository;
        this.transactionClient = transactionClient;
        this.rabbitTemplate = rabbitTemplate;
    }

    /**
     * Crée une demande de prêt.
     * Status initial = SUBMITTED.
     */
    @Transactional
    public LoanApplicationResponse createLoanApplication(LoanRequest request) {
        LoanApplication application = new LoanApplication();
        application.setCustomerId(request.getCustomerId());
        application.setRequestedAmount(request.getRequestedAmount());
        application.setPurpose(request.getPurpose());
        // status = SUBMITTED par défaut

        LoanApplication saved = loanApplicationRepository.save(application);
        logger.info("Demande de prêt créée : id={}, montant={}", saved.getId(), saved.getRequestedAmount());

        return mapToApplicationResponse(saved);
    }

    /**
     * Prend une décision sur une demande de prêt.
     * Si APPROVED : crée le prêt + génère l'échéancier + publie LoanApproved.
     * Si REJECTED : publie LoanRejected.
     */
    @Transactional
    public LoanResponse decideLoanApplication(UUID applicationId, LoanDecisionRequest request) {
        LoanApplication application = loanApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Demande de prêt non trouvée"));

        if (application.getStatus() != LoanApplicationStatus.SUBMITTED) {
            throw new RuntimeException("La demande a déjà été traitée");
        }

        if (request.getApproved()) {
            // --- APPROBATION ---
            application.setStatus(LoanApplicationStatus.APPROVED);
            application.setDecisionReason(request.getReason());
            loanApplicationRepository.save(application);

            // Crée le prêt
            Loan loan = new Loan();
            loan.setApplicationId(applicationId);
            loan.setPrincipal(application.getRequestedAmount());
            loan.setInterestRate(request.getInterestRate() != null ? request.getInterestRate() : 0.12);
            loan.setTermMonths(request.getTermMonths() != null ? request.getTermMonths() : 12);
            Loan savedLoan = loanRepository.save(loan);

            // Génère l'échéancier
            RepaymentSchedule schedule = generateSchedule(savedLoan);
            savedLoan.setRepaymentSchedule(schedule);
            loanRepository.save(savedLoan);

            logger.info("Prêt approuvé : loanId={}, montant={}, taux={}, durée={} mois",
                    savedLoan.getId(), savedLoan.getPrincipal(),
                    savedLoan.getInterestRate(), savedLoan.getTermMonths());

            // Publie l'événement LoanApproved
            LoanApprovedEvent event = new LoanApprovedEvent(
                    savedLoan.getId(),
                    applicationId,
                    application.getCustomerId(),
                    savedLoan.getPrincipal(),
                    savedLoan.getInterestRate(),
                    savedLoan.getTermMonths()
            );
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.EXCHANGE_NAME,
                    RabbitMQConfig.ROUTING_KEY_LOAN_APPROVED,
                    event
            );

            return mapToLoanResponse(savedLoan);

        } else {
            // --- REJET ---
            application.setStatus(LoanApplicationStatus.REJECTED);
            application.setDecisionReason(request.getReason());
            loanApplicationRepository.save(application);

            logger.info("Prêt rejeté : applicationId={}, motif={}", applicationId, request.getReason());

            // Publie l'événement LoanRejected
            LoanRejectedEvent event = new LoanRejectedEvent(
                    applicationId,
                    application.getCustomerId(),
                    request.getReason()
            );
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.EXCHANGE_NAME,
                    RabbitMQConfig.ROUTING_KEY_LOAN_REJECTED,
                    event
            );

            return null;  // Ou un DTO spécifique pour le rejet
        }
    }

    /**
     * Génère l'échéancier de remboursement (amortissement linéaire).
     * Calcul :
     *   partCapital = principal / termMonths
     *   partInterets = principal * (tauxAnnuel / 12)
     *   mensualite = partCapital + partInterets
     */
    private RepaymentSchedule generateSchedule(Loan loan) {
        RepaymentSchedule schedule = new RepaymentSchedule();
        schedule.setLoan(loan);

        BigDecimal principal = loan.getPrincipal();
        int termMonths = loan.getTermMonths();
        double annualRate = loan.getInterestRate();
        double monthlyRate = annualRate / 12.0;

        BigDecimal partCapital = principal.divide(BigDecimal.valueOf(termMonths), 2, RoundingMode.HALF_UP);
        BigDecimal partInterets = principal.multiply(BigDecimal.valueOf(monthlyRate))
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal monthlyAmount = partCapital.add(partInterets);

        LocalDate startDate = LocalDate.now().plusMonths(1);

        for (int i = 1; i <= termMonths; i++) {
            Installment installment = new Installment();
            installment.setDueDate(startDate.plusMonths(i - 1));
            installment.setAmount(monthlyAmount);
            installment.setPrincipalPart(partCapital);
            installment.setInterestPart(partInterets);
            schedule.addInstallment(installment);
        }

        return scheduleRepository.save(schedule);
    }

    /**
     * Récupère l'échéancier d'un prêt.
     */
    public RepaymentScheduleResponse getSchedule(UUID loanId) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Prêt non trouvé"));

        RepaymentSchedule schedule = scheduleRepository.findByLoanId(loanId)
                .orElseThrow(() -> new RuntimeException("Échéancier non trouvé"));

        return mapToScheduleResponse(schedule);
    }

    /**
     * Rembourse une mensualité.
     * 1. Appelle transaction-service pour débiter le compte client
     * 2. Marque la mensualité comme PAID
     * 3. Si toutes les mensualités sont payées, le prêt passe à PAID_OFF
     */
    @Transactional
    public InstallmentResponse repayInstallment(UUID loanId, RepaymentRequest request) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Prêt non trouvé"));

        Installment installment = installmentRepository.findById(request.getInstallmentId())
                .orElseThrow(() -> new RuntimeException("Mensualité non trouvée"));

        if (installment.getStatus() == InstallmentStatus.PAID) {
            throw new RuntimeException("Cette mensualité est déjà payée");
        }

        // Appelle transaction-service pour créer une transaction de remboursement
        TransactionClient.RepaymentTransactionRequest txnRequest =
                new TransactionClient.RepaymentTransactionRequest(
                        request.getAccountId(),
                        installment.getAmount(),
                        "REMBOURSEMENT_" + installment.getId()
                );

        TransactionClient.TransactionResponse txnResponse = transactionClient.createRepayment(txnRequest);

        if (!"COMPLETED".equals(txnResponse.getStatus())) {
            throw new RuntimeException("Le paiement a échoué : " + txnResponse.getStatus());
        }

        // Marque la mensualité comme payée
        installment.setStatus(InstallmentStatus.PAID);
        installment.setPaidAt(LocalDateTime.now());
        installmentRepository.save(installment);

        logger.info("Mensualité payée : installmentId={}, montant={}, transactionId={}",
                installment.getId(), installment.getAmount(), txnResponse.getId());

        // Vérifie si toutes les mensualités sont payées
        long pendingCount = installmentRepository.countByRepaymentScheduleIdAndStatus(
                installment.getRepaymentSchedule().getId(), InstallmentStatus.PENDING);

        if (pendingCount == 0) {
            loan.setStatus(LoanStatus.PAID_OFF);
            loanRepository.save(loan);
            logger.info("Prêt entièrement remboursé : loanId={}", loanId);
        }

        return mapToInstallmentResponse(installment);
    }

    // --- Méthodes de mapping ---

    private LoanApplicationResponse mapToApplicationResponse(LoanApplication app) {
        LoanApplicationResponse response = new LoanApplicationResponse();
        response.setId(app.getId());
        response.setCustomerId(app.getCustomerId());
        response.setRequestedAmount(app.getRequestedAmount());
        response.setPurpose(app.getPurpose());
        response.setStatus(app.getStatus().name());
        response.setSubmittedAt(app.getSubmittedAt());
        response.setDecisionReason(app.getDecisionReason());
        return response;
    }

    private LoanResponse mapToLoanResponse(Loan loan) {
        LoanResponse response = new LoanResponse();
        response.setId(loan.getId());
        response.setApplicationId(loan.getApplicationId());
        response.setPrincipal(loan.getPrincipal());
        response.setInterestRate(loan.getInterestRate());
        response.setTermMonths(loan.getTermMonths());
        response.setStatus(loan.getStatus().name());
        response.setDisbursedAt(loan.getDisbursedAt());
        if (loan.getRepaymentSchedule() != null) {
            response.setSchedule(mapToScheduleResponse(loan.getRepaymentSchedule()));
        }
        return response;
    }

    private RepaymentScheduleResponse mapToScheduleResponse(RepaymentSchedule schedule) {
        RepaymentScheduleResponse response = new RepaymentScheduleResponse();
        response.setId(schedule.getId());
        response.setInstallments(schedule.getInstallments().stream()
                .map(this::mapToInstallmentResponse)
                .collect(Collectors.toList()));
        return response;
    }

    private InstallmentResponse mapToInstallmentResponse(Installment inst) {
        InstallmentResponse response = new InstallmentResponse();
        response.setId(inst.getId());
        response.setDueDate(inst.getDueDate());
        response.setAmount(inst.getAmount());
        response.setPrincipalPart(inst.getPrincipalPart());
        response.setInterestPart(inst.getInterestPart());
        response.setStatus(inst.getStatus().name());
        response.setPaidAt(inst.getPaidAt());
        return response;
    }
}
