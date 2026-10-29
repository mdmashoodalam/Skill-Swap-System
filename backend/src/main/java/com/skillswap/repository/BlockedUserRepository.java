package com.skillswap.repository;
import com.skillswap.entity.BlockedUser;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface BlockedUserRepository extends JpaRepository<BlockedUser, Long> {
    List<BlockedUser> findByBlockerIdOrderByCreatedAtDesc(Long blockerId);
    Optional<BlockedUser> findByBlockerIdAndBlockedUserId(Long blockerId, Long blockedUserId);
    boolean existsByBlockerIdAndBlockedUserId(Long blockerId, Long blockedUserId);
}
