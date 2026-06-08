package com.banking_platform.transaction_service.service;

import com.banking_platform.transaction_service.client.AccountClient;
import com.banking_platform.transaction_service.client.OperatorClient;
import com.banking_platform.transaction_service.config.RabbitMQConfig;
import com.banking_platform.transaction_service.dto.*;
import com.banking_platform.transaction_service.entity.*;
import com.banking_platform.transaction_service.messaging.TransactionCompletedEvent;
import com.banking_platform.transaction_service.messaging.TransactionFailedEvent;
import com.banking_platform.transaction_service.repository.TransactionRepository;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class TransactionService {

    private final TransactionRepository repo;
    private final AccountClient accountClient;
    private final OperatorClient operatorClient;
    private final RabbitTemplate rabbit;

    public TransactionService(TransactionRepository repo, AccountClient accountClient,
                               OperatorClient operatorClient, RabbitTemplate rabbit) {
        this.repo = repo;
        this.accountClient = accountClient;
        this.operatorClient = operatorClient;
        this.rabbit = rabbit;
    }

    public TransactionResponse deposit(DepositRequest req) {
        Transaction tx = newTx(TransactionType.DEPOSIT, req.amount(), null, req.accountId());
        try {
            accountClient.credit(req.accountId(), Map.of("amount", req.amount()));
            tx.setStatus(TransactionStatus.COMPLETED);
            repo.save(tx);
            publishCompleted(tx);
        } catch (Exception e) {
            tx.setStatus(TransactionStatus.FAILED);
            repo.save(tx);
            publishFailed(tx, e.getMessage());
            throw e;
        }
        return toResponse(tx);
    }

    public TransactionResponse withdrawal(WithdrawalRequest req) {
        Transaction tx = newTx(TransactionType.WITHDRAWAL, req.amount(), req.accountId(), null);
        try {
            accountClient.debit(req.accountId(), Map.of("amount", req.amount()));
            tx.setStatus(TransactionStatus.COMPLETED);
            repo.save(tx);
            publishCompleted(tx);
        } catch (Exception e) {
            tx.setStatus(TransactionStatus.FAILED);
            repo.save(tx);
            publishFailed(tx, e.getMessage());
            throw e;
        }
        return toResponse(tx);
    }

    public TransactionResponse transfer(TransferRequest req) {
        TransactionType type = req.sameOperator() ? TransactionType.TRANSFER_INTRA : TransactionType.TRANSFER_INTER;
        Transaction tx = newTx(type, req.amount(), req.sourceAccountId(), req.destinationAccountId());

        if (req.sameOperator()) {
            try {
                accountClient.debit(req.sourceAccountId(), Map.of("amount", req.amount()));
                accountClient.credit(req.destinationAccountId(), Map.of("amount", req.amount()));
                tx.setStatus(TransactionStatus.COMPLETED);
                repo.save(tx);
                publishCompleted(tx);
            } catch (Exception e) {
                tx.setStatus(TransactionStatus.FAILED);
                repo.save(tx);
                publishFailed(tx, e.getMessage());
                throw e;
            }
        } else {
            tx.setSagaId(UUID.randomUUID());
            boolean debited = false;
            try {
                accountClient.debit(req.sourceAccountId(), Map.of("amount", req.amount()));
                debited = true;
                BigDecimal fees = operatorClient.getCommission(req.amount());
                tx.setFees(fees);
                accountClient.credit(req.destinationAccountId(), Map.of("amount", req.amount().subtract(fees)));
                tx.setStatus(TransactionStatus.COMPLETED);
                repo.save(tx);
                publishCompleted(tx);
            } catch (Exception e) {
                if (debited) {
                    try {
                        accountClient.credit(req.sourceAccountId(), Map.of("amount", req.amount()));
                        tx.setStatus(TransactionStatus.COMPENSATED);
                    } catch (Exception ce) {
                        tx.setStatus(TransactionStatus.FAILED);
                    }
                } else {
                    tx.setStatus(TransactionStatus.FAILED);
                }
                repo.save(tx);
                publishFailed(tx, e.getMessage());
                throw new RuntimeException("Transfer failed: " + e.getMessage());
            }
        }
        return toResponse(tx);
    }

    public List<TransactionResponse> getHistory(UUID accountId) {
        return repo.findByAccountId(accountId).stream().map(this::toResponse).toList();
    }

    private Transaction newTx(TransactionType type, BigDecimal amount, UUID source, UUID dest) {
        Transaction tx = new Transaction();
        tx.setReference("TXN-" + UUID.randomUUID());
        tx.setType(type);
        tx.setAmount(amount);
        tx.setSourceAccountId(source);
        tx.setDestinationAccountId(dest);
        return repo.save(tx);
    }

    private void publishCompleted(Transaction tx) {
        rabbit.convertAndSend(RabbitMQConfig.EXCHANGE, RabbitMQConfig.RK_COMPLETED,
            new TransactionCompletedEvent(tx.getId(), tx.getReference(), tx.getType().name(),
                tx.getAmount(), tx.getSourceAccountId(), tx.getDestinationAccountId()));
    }

    private void publishFailed(Transaction tx, String reason) {
        rabbit.convertAndSend(RabbitMQConfig.EXCHANGE, RabbitMQConfig.RK_FAILED,
            new TransactionFailedEvent(tx.getId(), tx.getReference(), reason));
    }

    private TransactionResponse toResponse(Transaction t) {
        return new TransactionResponse(t.getId(), t.getReference(), t.getType(), t.getAmount(),
            t.getCurrency(), t.getFees(), t.getSourceAccountId(), t.getDestinationAccountId(),
            t.getStatus(), t.getCreatedAt());
    }
}
