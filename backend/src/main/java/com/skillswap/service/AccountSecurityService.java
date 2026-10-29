package com.skillswap.service;

import com.skillswap.entity.AccountToken;
import com.skillswap.entity.User;
import com.skillswap.enums.AccountTokenType;
import com.skillswap.exception.BadRequestException;
import com.skillswap.repository.AccountTokenRepository;
import com.skillswap.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class AccountSecurityService {
    private final AccountTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${app.mail.log-links:true}")
    private boolean logLinks;

    @Value("${app.mail.from:}")
    private String mailFrom;

    @Value("${spring.mail.host:}")
    private String mailHost;

    @Transactional
    public void sendVerification(User user) {
        if (Boolean.TRUE.equals(user.getEmailVerified())) return;
        String raw = issue(user, AccountTokenType.VERIFY_EMAIL, 24);
        deliver(user.getEmail(), "Verify your email", frontendUrl + "/verify-email?token=" + raw);
    }

    @Transactional
    public void requestPasswordReset(String email) {
        userRepository.findByEmail(email.trim().toLowerCase(Locale.ROOT)).ifPresent(user -> {
            String raw = issue(user, AccountTokenType.PASSWORD_RESET, 1);
            deliver(user.getEmail(), "Reset your password", frontendUrl + "/reset-password?token=" + raw);
        });
    }

    @Transactional
    public void verifyEmail(String rawToken) {
        AccountToken token = requireValid(rawToken, AccountTokenType.VERIFY_EMAIL);
        User user = token.getUser();
        user.setEmailVerified(true);
        userRepository.save(user);
        tokenRepository.deleteByUserAndType(user, AccountTokenType.VERIFY_EMAIL);
    }

    @Transactional
    public void resetPassword(String rawToken, String password) {
        AccountToken token = requireValid(rawToken, AccountTokenType.PASSWORD_RESET);
        User user = token.getUser();
        user.setPasswordHash(passwordEncoder.encode(password));
        userRepository.save(user);
        tokenRepository.deleteByUserAndType(user, AccountTokenType.PASSWORD_RESET);
    }

    private String issue(User user, AccountTokenType type, int validHours) {
        tokenRepository.deleteByUserAndType(user, type);
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        tokenRepository.save(AccountToken.builder()
                .user(user)
                .type(type)
                .tokenHash(hash(raw))
                .expiresAt(LocalDateTime.now().plusHours(validHours))
                .build());
        return raw;
    }

    private AccountToken requireValid(String rawToken, AccountTokenType type) {
        if (rawToken == null || rawToken.isBlank()) throw new BadRequestException("Invalid or expired token");
        AccountToken token = tokenRepository.findByTokenHashAndType(hash(rawToken), type)
                .orElseThrow(() -> new BadRequestException("Invalid or expired token"));
        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            tokenRepository.delete(token);
            throw new BadRequestException("Invalid or expired token");
        }
        return token;
    }

    private String hash(String raw) {
        try {
            return java.util.HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is unavailable", e);
        }
    }

    private void deliver(String email, String subject, String link) {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender != null && !mailFrom.isBlank() && !mailHost.isBlank()) {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailFrom);
            message.setTo(email);
            message.setSubject(subject);
            message.setText("Use this secure link to continue (valid for 24 hours):\n\n" + link);
            mailSender.send(message);
            log.info("Sent '{}' email to {}", subject, email);
        } else if (logLinks) {
            log.info("Local mail delivery to {} - {}: {}", email, subject, link);
        } else {
            throw new IllegalStateException("Email delivery is not configured. Set SMTP settings and MAIL_FROM.");
        }
    }
}
