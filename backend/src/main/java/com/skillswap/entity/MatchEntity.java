package com.skillswap.entity;

import com.skillswap.enums.MatchStatus;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "matches")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MatchEntity extends BaseEntity {
    @ManyToOne(optional = false) private User user1;
    @ManyToOne(optional = false) private User user2;
    private Integer matchScore;
    @Enumerated(EnumType.STRING)
    private MatchStatus status;

    @Transient
    private List<String> matchReasons;
}
