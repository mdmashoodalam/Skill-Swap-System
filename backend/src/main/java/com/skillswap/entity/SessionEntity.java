package com.skillswap.entity;

import com.skillswap.enums.SessionMode;
import com.skillswap.enums.SessionStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "sessions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SessionEntity extends BaseEntity {
    @ManyToOne(optional = false) private MatchEntity match;
    @ManyToOne(optional = false) private User hostUser;
    @ManyToOne(optional = false) private User learnerUser;
    private String topic;
    @Enumerated(EnumType.STRING) private SessionMode sessionMode;
    private LocalDateTime scheduledAt;
    private Integer durationMinutes;
    private String meetingLink;
    private String location;
    @Enumerated(EnumType.STRING) private SessionStatus status;
    @Column(length = 1000) private String notes;
}
