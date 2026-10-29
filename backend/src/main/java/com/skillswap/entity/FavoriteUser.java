package com.skillswap.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "favorite_users", uniqueConstraints = @UniqueConstraint(columnNames = {"owner_id", "favorite_user_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FavoriteUser extends BaseEntity {
    @ManyToOne(optional = false) @JoinColumn(name = "owner_id") private User owner;
    @ManyToOne(optional = false) @JoinColumn(name = "favorite_user_id") private User favoriteUser;
}
