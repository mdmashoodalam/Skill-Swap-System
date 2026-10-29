package com.skillswap.service;

import com.skillswap.dto.AuthDtos;
import com.skillswap.entity.User;
import com.skillswap.enums.Role;
import com.skillswap.enums.AccountStatus;
import com.skillswap.exception.BadRequestException;
import com.skillswap.repository.UserRepository;
import com.skillswap.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final AccountSecurityService accountSecurityService;

    public AuthDtos.AuthResponse register(AuthDtos.RegisterRequest request) {
        String email = normalizeEmail(request.getEmail());
        if (userRepository.existsByEmail(email)) throw new BadRequestException("Email already exists");
        User user = User.builder()
                .fullName(request.getFullName().trim())
                .email(email)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(Role.USER)
                .accountStatus(AccountStatus.ACTIVE)
                .emailVerified(false)
                .ratingAvg(0.0)
                .totalReviews(0)
                .build();
        userRepository.save(user);
        accountSecurityService.sendVerification(user);
        return buildResponse(user);
    }

    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest request) {
        String email = normalizeEmail(request.getEmail());
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, request.getPassword()));
        User user = userRepository.findByEmail(email).orElseThrow();
        return buildResponse(user);
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private AuthDtos.AuthResponse buildResponse(User user) {
        AuthDtos.AuthResponse res = new AuthDtos.AuthResponse();
        res.setToken(jwtService.generateToken(user.getEmail()));
        res.setUserId(user.getId());
        res.setEmail(user.getEmail());
        res.setRole(user.getRole().name());
        return res;
    }
}
