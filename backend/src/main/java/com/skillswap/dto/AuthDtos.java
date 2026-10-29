package com.skillswap.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

public class AuthDtos {
    @Data
    public static class RegisterRequest {
        @NotBlank
        @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
        private String fullName;
        @Email @NotBlank private String email;
        @NotBlank
        @Size(min = 8, max = 72, message = "Password must be between 8 and 72 characters")
        private String password;
    }
    @Data
    public static class LoginRequest {
        @Email @NotBlank private String email;
        @NotBlank
        @Size(max = 72, message = "Password must not exceed 72 characters")
        private String password;
    }
    @Data
    public static class AuthResponse {
        private String token;
        private Long userId;
        private String email;
        private String role;
    }
    @Data
    public static class EmailRequest {
        @Email @NotBlank private String email;
    }
    @Data
    public static class TokenRequest {
        @NotBlank private String token;
    }
    @Data
    public static class ResetPasswordRequest {
        @NotBlank private String token;
        @NotBlank
        @Size(min = 8, max = 72, message = "Password must be between 8 and 72 characters")
        private String password;
    }
}
