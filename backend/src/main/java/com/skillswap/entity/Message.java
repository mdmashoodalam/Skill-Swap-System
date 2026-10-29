package com.skillswap.entity;

import com.skillswap.enums.MessageType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "chat_id", nullable = false)
    private Chat chat;

    @ManyToOne(optional = false)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @Column(length = 2000)
    private String content;

    @Enumerated(EnumType.STRING)
    private MessageType messageType;

    private Boolean isRead;

    @ManyToOne
    @JoinColumn(name = "reply_to_id")
    private Message replyTo;

    private LocalDateTime editedAt;

    private Boolean deleted;

    private String attachmentUrl;
    private String attachmentName;
    private String attachmentContentType;
}
