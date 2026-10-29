package com.skillswap.security;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    @Test
    void rejectsJwtSecretsShorterThanThirtyTwoBytesAtStartup() {
        JwtService service = new JwtService();
        ReflectionTestUtils.setField(service, "secret", "too-short");

        assertThatThrownBy(service::initializeSigningKey)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("at least 32 bytes");
    }

    @Test
    void generatedTokenValidatesWithConfiguredSecret() {
        JwtService service = new JwtService();
        ReflectionTestUtils.setField(service, "secret", "01234567890123456789012345678901");
        ReflectionTestUtils.setField(service, "expiration", 60_000L);
        service.initializeSigningKey();

        String token = service.generateToken("member@example.com");

        assertThat(service.isTokenValid(token)).isTrue();
        assertThat(service.extractUsername(token)).isEqualTo("member@example.com");
    }
}
