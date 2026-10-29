package com.skillswap.repository;

import com.skillswap.entity.SessionEntity;
import com.skillswap.enums.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SessionEntityRepository extends JpaRepository<SessionEntity, Long> {
    List<SessionEntity> findByHostUserIdOrLearnerUserId(Long hostUserId, Long learnerUserId);
    List<SessionEntity> findByMatchId(Long matchId);
    List<SessionEntity> findByHostUserIdAndStatus(Long hostUserId, SessionStatus status);
    List<SessionEntity> findByLearnerUserIdAndStatus(Long learnerUserId, SessionStatus status);
}
