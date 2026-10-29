package com.skillswap.repository;

import com.skillswap.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByChatIdOrderByCreatedAtAsc(Long chatId);
    List<Message> findByChatIdAndIsReadFalseAndSenderIdNot(Long chatId, Long senderId);
}
