package com.skillswap.repository;

import com.skillswap.entity.AccountToken;
import com.skillswap.entity.User;
import com.skillswap.enums.AccountTokenType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AccountTokenRepository extends JpaRepository<AccountToken, Long> {
    Optional<AccountToken> findByTokenHashAndType(String tokenHash, AccountTokenType type);
    void deleteByUserAndType(User user, AccountTokenType type);
}
