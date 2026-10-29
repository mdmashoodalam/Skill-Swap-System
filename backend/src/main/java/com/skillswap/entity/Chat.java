package com.skillswap.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "chats")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Chat extends BaseEntity {

    @OneToOne(optional = false)
    @JoinColumn(name = "match_id", unique = true, nullable = false)
    private MatchEntity match;
}