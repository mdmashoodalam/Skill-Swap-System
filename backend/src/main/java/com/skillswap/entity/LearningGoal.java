package com.skillswap.entity;

import com.skillswap.enums.GoalStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "learning_goals")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LearningGoal extends BaseEntity {
    @ManyToOne(optional = false) private User user;
    @ManyToOne private Skill skill;
    @Column(nullable = false) private String title;
    @Column(length = 1000) private String description;
    private LocalDate targetDate;
    private Integer progress;
    @Enumerated(EnumType.STRING) private GoalStatus status;
}
