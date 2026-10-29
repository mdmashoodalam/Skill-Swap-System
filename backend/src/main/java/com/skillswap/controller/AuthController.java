package com.skillswap.controller;

import com.skillswap.dto.AuthDtos;
import com.skillswap.entity.User;
import com.skillswap.service.AuthService;
import com.skillswap.service.AccountSecurityService;
import com.skillswap.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    private final UserService userService;
    private final AccountSecurityService accountSecurityService;

    @PostMapping("/register")
    public AuthDtos.AuthResponse register(@Valid @RequestBody AuthDtos.RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthDtos.AuthResponse login(@Valid @RequestBody AuthDtos.LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/forgot-password")
    public Map<String, String> forgotPassword(@Valid @RequestBody AuthDtos.EmailRequest request) {
        accountSecurityService.requestPasswordReset(request.getEmail());
        return Map.of("message", "If an account exists, a password reset link has been sent.");
    }

    @PostMapping("/reset-password")
    public Map<String, String> resetPassword(@Valid @RequestBody AuthDtos.ResetPasswordRequest request) {
        accountSecurityService.resetPassword(request.getToken(), request.getPassword());
        return Map.of("message", "Password updated successfully.");
    }

    @PostMapping("/verify-email")
    public Map<String, String> verifyEmail(@Valid @RequestBody AuthDtos.TokenRequest request) {
        accountSecurityService.verifyEmail(request.getToken());
        return Map.of("message", "Email verified successfully.");
    }

    @PostMapping("/resend-verification")
    public Map<String, String> resendVerification(@Valid @RequestBody AuthDtos.EmailRequest request) {
        try {
            accountSecurityService.sendVerification(userService.getUserByEmail(request.getEmail().trim().toLowerCase()));
        } catch (Exception ignored) {
            // Keep the response identical to prevent account enumeration.
        }
        return Map.of("message", "If the account needs verification, a new link has been sent.");
    }

    @GetMapping("/me")
    public User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userService.getUserByEmail(email);
        return user;
    }
}
