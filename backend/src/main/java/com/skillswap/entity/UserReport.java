package com.skillswap.entity;

import com.skillswap.enums.ReportStatus;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_reports")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserReport extends BaseEntity {
    @ManyToOne(optional = false) private User reporter;
    @ManyToOne(optional = false) private User reportedUser;
    @ManyToOne private Message message;
    @ManyToOne private Review review;
    @Column(nullable = false) private String reason;
    @Column(length = 2000) private String details;
    @Enumerated(EnumType.STRING) private ReportStatus status;
    @Column(length = 1000) private String resolutionNote;
}
