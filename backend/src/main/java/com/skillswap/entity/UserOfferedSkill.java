package com.skillswap.entity;

import com.skillswap.enums.ProficiencyLevel;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_offered_skills")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserOfferedSkill extends BaseEntity {
    @ManyToOne(optional = false) private User user;
    @ManyToOne(optional = false) private Skill skill;
    @Enumerated(EnumType.STRING)
    private ProficiencyLevel proficiencyLevel;
    private Integer yearsExperience;
    @Column(length = 1000)
    private String description;
}
