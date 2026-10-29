package com.skillswap.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "blocked_users", uniqueConstraints = @UniqueConstraint(columnNames = {"blocker_id", "blocked_user_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BlockedUser extends BaseEntity {
    @ManyToOne(optional = false) @JoinColumn(name = "blocker_id") private User blocker;
    @ManyToOne(optional = false) @JoinColumn(name = "blocked_user_id") private User blockedUser;
}
