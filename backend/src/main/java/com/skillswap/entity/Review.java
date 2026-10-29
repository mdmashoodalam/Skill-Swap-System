package com.skillswap.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "reviews")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Review extends BaseEntity {
    @ManyToOne(optional = false) private SessionEntity session;
    @ManyToOne(optional = false) private User reviewer;
    @ManyToOne(optional = false) private User reviewee;
    private Integer rating;
    @Column(length = 1000) private String comment;
}
