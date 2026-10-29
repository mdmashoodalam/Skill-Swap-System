package com.skillswap.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.skillswap.enums.Role;
import com.skillswap.enums.AccountStatus;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User extends BaseEntity {
    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    @JsonIgnore
    @Column(nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    private Role role;

    @Column(length = 1000)
    private String bio;
    private String city;
    private String country;
    private String languages;
    private String profilePhotoUrl;
    private String availabilityText;
    private Double ratingAvg;
    private Integer totalReviews;
    @Enumerated(EnumType.STRING)
    private AccountStatus accountStatus;
    private Boolean emailVerified;
}
