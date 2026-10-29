package com.skillswap.entity;

import com.skillswap.enums.ProficiencyLevel;
import com.skillswap.enums.UrgencyLevel;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_wanted_skills")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserWantedSkill extends BaseEntity {
    @ManyToOne(optional = false) private User user;
    @ManyToOne(optional = false) private Skill skill;
    @Enumerated(EnumType.STRING)
    private ProficiencyLevel targetLevel;
    private String purpose;
    @Enumerated(EnumType.STRING)
    private UrgencyLevel urgencyLevel;
}
