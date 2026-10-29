package com.skillswap.repository;

import com.skillswap.entity.UserWantedSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserWantedSkillRepository extends JpaRepository<UserWantedSkill, Long> {
    List<UserWantedSkill> findByUserId(Long userId);
    Optional<UserWantedSkill> findByUserIdAndSkillId(Long userId, Long skillId);
    List<UserWantedSkill> findBySkillId(Long skillId);
    long countBySkillId(Long skillId);
}
