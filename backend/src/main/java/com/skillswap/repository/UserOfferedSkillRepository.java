package com.skillswap.repository;

import com.skillswap.entity.UserOfferedSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserOfferedSkillRepository extends JpaRepository<UserOfferedSkill, Long> {
    List<UserOfferedSkill> findByUserId(Long userId);
    Optional<UserOfferedSkill> findByUserIdAndSkillId(Long userId, Long skillId);
    long countBySkillId(Long skillId);
}
