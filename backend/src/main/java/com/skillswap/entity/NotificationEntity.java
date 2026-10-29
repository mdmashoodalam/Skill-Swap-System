package com.skillswap.entity;

import com.skillswap.enums.NotificationType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "notifications")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class NotificationEntity extends BaseEntity {
    @ManyToOne(optional = false) private User user;
    private String title;
    @Column(length = 1000) private String body;
    @Enumerated(EnumType.STRING) private NotificationType type;
    private Boolean isRead;
}
