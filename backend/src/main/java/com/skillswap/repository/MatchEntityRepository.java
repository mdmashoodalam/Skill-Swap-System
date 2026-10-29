package com.skillswap.repository;

import com.skillswap.entity.MatchEntity;
import com.skillswap.enums.MatchStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MatchEntityRepository extends JpaRepository<MatchEntity, Long> {

    @Query("""
        SELECT m
        FROM MatchEntity m
        WHERE m.user1.id = :userId OR m.user2.id = :userId
    """)
    List<MatchEntity> findByUserIdEither(@Param("userId") Long userId);

    @Query("""
        SELECT m
        FROM MatchEntity m
        WHERE (m.user1.id = :user1Id AND m.user2.id = :user2Id)
           OR (m.user1.id = :user2Id AND m.user2.id = :user1Id)
    """)
    Optional<MatchEntity> findMatchBetweenUsers(@Param("user1Id") Long user1Id,
                                                @Param("user2Id") Long user2Id);

    @Query("""
        SELECT m
        FROM MatchEntity m
        WHERE (m.user1.id = :userId OR m.user2.id = :userId)
          AND m.status = :status
    """)
    List<MatchEntity> findByUserIdAndStatus(@Param("userId") Long userId,
                                            @Param("status") MatchStatus status);
}