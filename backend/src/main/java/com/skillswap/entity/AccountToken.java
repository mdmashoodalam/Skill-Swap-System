package com.skillswap.entity;

import com.skillswap.enums.AccountTokenType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "account_tokens", indexes = @Index(name = "idx_account_token_hash", columnList = "tokenHash", unique = true))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AccountToken extends BaseEntity {
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    private User user;

    @Column(nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AccountTokenType type;

    @Column(nullable = false)
    private LocalDateTime expiresAt;
}
