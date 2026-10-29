package com.skillswap.security;

import com.skillswap.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;
import com.skillswap.enums.AccountStatus;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {
    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        var user = userRepository.findByEmail(username).orElseThrow(() -> new UsernameNotFoundException("User not found"));
        boolean enabled = user.getAccountStatus() == null || user.getAccountStatus() == AccountStatus.ACTIVE;
        var authorities = new java.util.ArrayList<SimpleGrantedAuthority>();
        authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            authorities.add(new SimpleGrantedAuthority("EMAIL_VERIFIED"));
        }
        return new org.springframework.security.core.userdetails.User(
                user.getEmail(), user.getPasswordHash(), enabled, true, true, enabled,
                authorities
        );
    }
}
