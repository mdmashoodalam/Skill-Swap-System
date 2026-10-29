package com.skillswap.entity;

import com.skillswap.enums.RequestStatus;
import com.skillswap.enums.SessionMode;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "swap_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SwapRequest extends BaseEntity {

    @ManyToOne(optional = false)
    private User sender;

    @ManyToOne(optional = false)
    private User receiver;

    @ManyToOne(optional = true)
    private UserOfferedSkill senderOfferedSkill;

    @ManyToOne(optional = true)
    private UserWantedSkill senderWantedSkill;

    @ManyToOne(optional = true)
    private UserOfferedSkill receiverOfferedSkill;

    @ManyToOne(optional = true)
    private UserWantedSkill receiverWantedSkill;

    @Column(length = 1000)
    private String message;

    @Enumerated(EnumType.STRING)
    private SessionMode preferredMode;

    private LocalDateTime proposedAt;

    @Enumerated(EnumType.STRING)
    private RequestStatus status;
}

/*
 * package com.skillswap.entity;
 * 
 * import com.skillswap.enums.RequestStatus; import jakarta.persistence.*;
 * import lombok.*;
 * 
 * @Entity
 * 
 * @Table(name = "swap_requests")
 * 
 * @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder public class
 * SwapRequest extends BaseEntity {
 * 
 * @ManyToOne(optional = false) private User sender;
 * 
 * @ManyToOne(optional = false) private User receiver;
 * 
 * @ManyToOne(optional = false) private UserOfferedSkill senderOfferedSkill;
 * 
 * @ManyToOne(optional = false) private UserWantedSkill senderWantedSkill;
 * 
 * @ManyToOne(optional = false) private UserOfferedSkill receiverOfferedSkill;
 * 
 * @ManyToOne(optional = false) private UserWantedSkill receiverWantedSkill;
 * 
 * @Column(length = 1000) private String message;
 * 
 * @Enumerated(EnumType.STRING) private RequestStatus status; }
 */
