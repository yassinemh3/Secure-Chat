package com.securechat.exception;

/**
 * Thrown when input validation fails outside of Bean Validation context
 * (e.g., business-rule validation in service layer).
 *
 * Maps to HTTP 422 Unprocessable Entity via {@link GlobalExceptionHandler}.
 */
public class ValidationException extends RuntimeException {

    public ValidationException(String message) {
        super(message);
    }

    public ValidationException(String field, String message) {
        super(field + ": " + message);
    }
}
