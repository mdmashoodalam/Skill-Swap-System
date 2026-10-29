package com.skillswap.service;

import com.skillswap.entity.AccountToken;
import com.skillswap.entity.User;
import com.skillswap.enums.AccountTokenType;
import com.skillswap.exception.BadRequestException;
import com.skillswap.repository.AccountTokenRepository;
import com.skillswap.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

class AccountSecurityServiceTest {

    @Test
    void verificationUsesHashedTokenAndMarksEmailVerified() throws Exception {
        AccountTokenRepository tokenRepository = mock(AccountTokenRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        AccountSecurityService service = service(tokenRepository, userRepository, encoder);
        User user = User.builder().email("person@test.local").emailVerified(false).build();
        AccountToken token = AccountToken.builder().user(user).type(AccountTokenType.VERIFY_EMAIL)
                .tokenHash(hash("raw-secret")).expiresAt(LocalDateTime.now().plusMinutes(5)).build();
        when(tokenRepository.findByTokenHashAndType(hash("raw-secret"), AccountTokenType.VERIFY_EMAIL))
                .thenReturn(Optional.of(token));

        service.verifyEmail("raw-secret");

        assertThat(user.getEmailVerified()).isTrue();
        verify(userRepository).save(user);
        verify(tokenRepository).deleteByUserAndType(user, AccountTokenType.VERIFY_EMAIL);
    }

    @Test
    void expiredPasswordResetTokenCannotBeUsed() throws Exception {
        AccountTokenRepository tokenRepository = mock(AccountTokenRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        AccountSecurityService service = service(tokenRepository, userRepository, encoder);
        AccountToken token = AccountToken.builder().user(User.builder().email("person@test.local").build())
                .type(AccountTokenType.PASSWORD_RESET).tokenHash(hash("expired"))
                .expiresAt(LocalDateTime.now().minusSeconds(1)).build();
        when(tokenRepository.findByTokenHashAndType(hash("expired"), AccountTokenType.PASSWORD_RESET))
                .thenReturn(Optional.of(token));

        assertThatThrownBy(() -> service.resetPassword("expired", "new-password"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("expired");
        verify(tokenRepository).delete(token);
        verifyNoInteractions(encoder);
    }

    @Test
    void sendVerificationEmailsLinkAndStoresOnlyItsHash() throws Exception {
        AccountTokenRepository tokenRepository = mock(AccountTokenRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        JavaMailSender mailSender = mock(JavaMailSender.class);
        @SuppressWarnings("unchecked")
        ObjectProvider<JavaMailSender> senderProvider = mock(ObjectProvider.class);
        when(senderProvider.getIfAvailable()).thenReturn(mailSender);

        AccountSecurityService service = new AccountSecurityService(tokenRepository, userRepository, encoder,
                senderProvider);
        ReflectionTestUtils.setField(service, "frontendUrl", "https://skillswap.test");
        ReflectionTestUtils.setField(service, "mailFrom", "no-reply@skillswap.test");
        ReflectionTestUtils.setField(service, "mailHost", "smtp.skillswap.test");
        User user = User.builder().email("person@test.local").emailVerified(false).build();

        service.sendVerification(user);

        ArgumentCaptor<SimpleMailMessage> messageCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        ArgumentCaptor<AccountToken> tokenCaptor = ArgumentCaptor.forClass(AccountToken.class);
        verify(mailSender).send(messageCaptor.capture());
        verify(tokenRepository).save(tokenCaptor.capture());
        SimpleMailMessage message = messageCaptor.getValue();
        AccountToken storedToken = tokenCaptor.getValue();
        assertThat(message.getFrom()).isEqualTo("no-reply@skillswap.test");
        assertThat(message.getTo()).containsExactly("person@test.local");
        assertThat(message.getSubject()).isEqualTo("Verify your email");
        Matcher tokenMatcher = Pattern.compile("token=([A-Za-z0-9_-]+)").matcher(message.getText());
        assertThat(tokenMatcher.find()).isTrue();
        String rawToken = tokenMatcher.group(1);
        assertThat(storedToken.getTokenHash()).isEqualTo(hash(rawToken));
        assertThat(storedToken.getTokenHash()).isNotEqualTo(rawToken);
        assertThat(storedToken.getType()).isEqualTo(AccountTokenType.VERIFY_EMAIL);
    }

    @Test
    void doesNotIssueAnotherVerificationForAnAlreadyVerifiedUser() {
        AccountTokenRepository tokenRepository = mock(AccountTokenRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        AccountSecurityService service = service(tokenRepository, userRepository, encoder);

        service.sendVerification(User.builder().email("person@test.local").emailVerified(true).build());

        verifyNoInteractions(tokenRepository);
    }

    private static AccountSecurityService service(AccountTokenRepository tokenRepository,
                                                  UserRepository userRepository,
                                                  PasswordEncoder encoder) {
        @SuppressWarnings("unchecked")
        ObjectProvider<JavaMailSender> senderProvider = mock(ObjectProvider.class);
        return new AccountSecurityService(tokenRepository, userRepository, encoder, senderProvider);
    }

    private static String hash(String value) throws Exception {
        return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                .digest(value.getBytes(StandardCharsets.UTF_8)));
    }
}
