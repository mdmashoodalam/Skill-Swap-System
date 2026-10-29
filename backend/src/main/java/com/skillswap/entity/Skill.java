package com.skillswap.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "skills")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Skill extends BaseEntity {
    @Column(nullable = false, unique = true)
    private String name;
    private String category;
    @Column(length = 1000)
    private String description;
    private Boolean isActive;
}
