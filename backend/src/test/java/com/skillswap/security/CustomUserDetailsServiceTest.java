package com.skillswap.security;

import com.skillswap.entity.User;
import com.skillswap.enums.Role;
import com.skillswap.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class CustomUserDetailsServiceTest {

    @Test
    void grantsVerificationAuthorityOnlyAfterEmailIsVerified() {
        UserRepository users = mock(UserRepository.class);
        CustomUserDetailsService service = new CustomUserDetailsService(users);
        User unverified = User.builder().email("new@test.local").passwordHash("hash").role(Role.USER)
                .emailVerified(false).build();
        User verified = User.builder().email("known@test.local").passwordHash("hash").role(Role.USER)
                .emailVerified(true).build();
        when(users.findByEmail("new@test.local")).thenReturn(Optional.of(unverified));
        when(users.findByEmail("known@test.local")).thenReturn(Optional.of(verified));

        UserDetails unverifiedDetails = service.loadUserByUsername("new@test.local");
        UserDetails verifiedDetails = service.loadUserByUsername("known@test.local");

        assertThat(unverifiedDetails.getAuthorities()).extracting("authority")
                .containsExactly("ROLE_USER").doesNotContain("EMAIL_VERIFIED");
        assertThat(verifiedDetails.getAuthorities()).extracting("authority")
                .contains("ROLE_USER", "EMAIL_VERIFIED");
    }
}
