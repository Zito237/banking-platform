package com.banking_platform.account_service.exception;

public class InsufficientBalanceException extends RuntimeException {
    public InsufficientBalanceException(String message) { super(message); }
}
