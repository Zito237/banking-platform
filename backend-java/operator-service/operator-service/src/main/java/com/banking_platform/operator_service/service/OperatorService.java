package com.banking_platform.operator_service.service;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  OperatorService.java — Service metier des operateurs                          ║
 * ║                                                                              ║
 * ║  Contient la logique metier pour :                                           ║
 * ║  • Creer un operateur avec ses regles                                        ║
 * ║  • Consulter un operateur et ses regles                                      ║
 * ║  • Lister tous les operateurs                                                ║
 * ║  • Recuperer le taux de commission d'un operateur                           ║
 * ║                                                                              ║
 * ║  Le taux de commission est extrait de la regle COMMISSION (ex: "1.5%")     ║
 * ║  et converti en double pour les calculs (1.5).                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import com.banking_platform.operator_service.dto.*;
import com.banking_platform.operator_service.entity.*;
import com.banking_platform.operator_service.repository.BusinessRuleRepository;
import com.banking_platform.operator_service.repository.OperatorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class OperatorService {

    private final OperatorRepository operatorRepository;
    private final BusinessRuleRepository businessRuleRepository;

    public OperatorService(OperatorRepository operatorRepository,
                           BusinessRuleRepository businessRuleRepository) {
        this.operatorRepository = operatorRepository;
        this.businessRuleRepository = businessRuleRepository;
    }

    /**
     * Cree un nouvel operateur avec ses regles metier.
     * Verifie l'unicite du code avant creation.
     */
    @Transactional
    public OperatorResponse createOperator(OperatorRequest request) {
        // Verification de l'unicite du code
        if (operatorRepository.existsByCode(request.getCode())) {
            throw new RuntimeException("Un operateur avec ce code existe deja");
        }

        // Creation de l'operateur
        Operator operator = new Operator(
                request.getName(),
                request.getCode(),
                request.getCountry()
        );

        // Ajout des regles metier
        for (BusinessRuleRequest ruleRequest : request.getRules()) {
            String raw = ruleRequest.getRuleType();
            if (raw == null) {
                throw new RuntimeException("Le type de regle est obligatoire");
            }

            String normalized = raw.trim().toUpperCase();

            RuleType ruleType;
            try {
                ruleType = RuleType.valueOf(normalized);
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Type de regle invalide: '" + raw + "'. Valeurs autorisees: COMMISSION, CEILING, VALIDATION");
            }

            BusinessRule rule = new BusinessRule(ruleType, ruleRequest.getValue());
            operator.addRule(rule);
        }


        // Sauvegarde
        Operator saved = operatorRepository.save(operator);
        return mapToResponse(saved);
    }

    /**
     * Recupere un operateur par son ID.
     */
    public OperatorResponse getOperator(UUID id) {
        Operator operator = operatorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Operateur non trouve"));
        return mapToResponse(operator);
    }

    /**
     * Liste tous les operateurs.
     */
    public List<OperatorResponse> getAllOperators() {
        return operatorRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Recupere le taux de commission d'un operateur.
     * Cherche la regle de type COMMISSION et extrait le taux.
     * Ex: "1.5%" -> 1.5
     */
    public CommissionResponse getCommission(UUID operatorId) {
        Operator operator = operatorRepository.findById(operatorId)
                .orElseThrow(() -> new RuntimeException("Operateur non trouve"));

        BusinessRule commissionRule = businessRuleRepository
                .findByOperatorIdAndRuleType(operatorId, RuleType.COMMISSION)
                .orElseThrow(() -> new RuntimeException("Aucune regle de commission definie pour cet operateur"));

        // Extraction du taux numerique (ex: "1.5%" -> 1.5)
        String value = commissionRule.getValue().replace("%", "").trim();
        double rate = Double.parseDouble(value);

        CommissionResponse response = new CommissionResponse();
        response.setOperatorId(operator.getId());
        response.setOperatorName(operator.getName());
        response.setOperatorCode(operator.getCode());
        response.setCommissionRate(rate);
        response.setCommissionValue(commissionRule.getValue());

        return response;
    }

    /**
     * Convertit une entite Operator en DTO OperatorResponse.
     */
    private OperatorResponse mapToResponse(Operator operator) {
        OperatorResponse response = new OperatorResponse();
        response.setId(operator.getId());
        response.setName(operator.getName());
        response.setCode(operator.getCode());
        response.setCountry(operator.getCountry());
        response.setStatus(operator.getStatus().name());

        // Conversion des regles
        List<BusinessRuleResponse> ruleResponses = operator.getRules().stream()
                .map(rule -> {
                    BusinessRuleResponse r = new BusinessRuleResponse();
                    r.setId(rule.getId());
                    r.setRuleType(rule.getRuleType().name());
                    r.setValue(rule.getValue());
                    return r;
                })
                .collect(Collectors.toList());

        response.setRules(ruleResponses);
        return response;
    }
}
