package com.skillswap.repository;
import com.skillswap.entity.LearningGoal;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface LearningGoalRepository extends JpaRepository<LearningGoal, Long> {
    List<LearningGoal> findByUserIdOrderByCreatedAtDesc(Long userId);
}
