package com.skillswap.service;

import com.skillswap.dto.AuthDtos;
import com.skillswap.entity.User;
import com.skillswap.enums.Role;
import com.skillswap.exception.BadRequestException;
import com.skillswap.repository.UserRepository;
import com.skillswap.security.JwtService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AuthServiceTest {

    @Test
    void registrationNormalizesEmailCreatesUnverifiedUserAndSendsVerification() {
        UserRepository users = mock(UserRepository.class);
        PasswordEncoder passwords = mock(PasswordEncoder.class);
        AuthenticationManager authentication = mock(AuthenticationManager.class);
        JwtService jwt = mock(JwtService.class);
        AccountSecurityService accountSecurity = mock(AccountSecurityService.class);
        AuthService service = new AuthService(users, passwords, authentication, jwt, accountSecurity);
        AuthDtos.RegisterRequest request = new AuthDtos.RegisterRequest();
        request.setFullName("  Ada Lovelace  ");
        request.setEmail(" ADA@EXAMPLE.COM ");
        request.setPassword("password123");
        when(users.existsByEmail("ada@example.com")).thenReturn(false);
        when(passwords.encode("password123")).thenReturn("encoded-password");
        when(users.save(any(User.class))).thenAnswer(invocation -> {
            User saved = invocation.getArgument(0);
            saved.setId(42L);
            return saved;
        });
        when(jwt.generateToken("ada@example.com")).thenReturn("jwt-token");

        AuthDtos.AuthResponse response = service.register(request);

        assertThat(response.getEmail()).isEqualTo("ada@example.com");
        assertThat(response.getUserId()).isEqualTo(42L);
        assertThat(response.getToken()).isEqualTo("jwt-token");
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(users).save(userCaptor.capture());
        User saved = userCaptor.getValue();
        assertThat(saved.getFullName()).isEqualTo("Ada Lovelace");
        assertThat(saved.getPasswordHash()).isEqualTo("encoded-password");
        assertThat(saved.getEmailVerified()).isFalse();
        verify(accountSecurity).sendVerification(saved);
    }

    @Test
    void registrationRejectsDuplicateEmailWithoutSendingAnotherLink() {
        UserRepository users = mock(UserRepository.class);
        AccountSecurityService accountSecurity = mock(AccountSecurityService.class);
        AuthService service = new AuthService(users, mock(PasswordEncoder.class), mock(AuthenticationManager.class),
                mock(JwtService.class), accountSecurity);
        AuthDtos.RegisterRequest request = new AuthDtos.RegisterRequest();
        request.setFullName("Ada Lovelace");
        request.setEmail("ADA@example.com");
        request.setPassword("password123");
        when(users.existsByEmail("ada@example.com")).thenReturn(true);

        assertThatThrownBy(() -> service.register(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("already exists");
        verify(users, never()).save(any());
        verifyNoInteractions(accountSecurity);
    }

    @Test
    void loginAllowsUnverifiedAccountToReachVerificationPrompt() {
        UserRepository users = mock(UserRepository.class);
        AuthenticationManager authentication = mock(AuthenticationManager.class);
        JwtService jwt = mock(JwtService.class);
        AuthService service = new AuthService(users, mock(PasswordEncoder.class), authentication, jwt,
                mock(AccountSecurityService.class));
        User user = User.builder().email("ada@example.com").role(Role.USER).emailVerified(false).build();
        user.setId(42L);
        AuthDtos.LoginRequest request = new AuthDtos.LoginRequest();
        request.setEmail(" ADA@EXAMPLE.COM ");
        request.setPassword("password123");
        when(users.findByEmail("ada@example.com")).thenReturn(Optional.of(user));
        when(jwt.generateToken("ada@example.com")).thenReturn("jwt-token");

        AuthDtos.AuthResponse response = service.login(request);

        assertThat(response.getToken()).isEqualTo("jwt-token");
        verify(authentication).authenticate(any());
    }
}
