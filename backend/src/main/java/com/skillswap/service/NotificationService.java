package com.skillswap.service;

import com.skillswap.entity.NotificationEntity;
import com.skillswap.entity.User;
import com.skillswap.enums.NotificationType;
import com.skillswap.repository.NotificationEntityRepository;
import com.skillswap.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationEntityRepository repository;
    private final SimpMessagingTemplate messagingTemplate;

    public List<NotificationEntity> getUserNotifications(Long userId) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<NotificationEntity> getUnreadNotifications(Long userId) {
        return repository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
    }

    public Integer getUnreadCount(Long userId) {
        return repository.countByUserIdAndIsReadFalse(userId);
    }

    public void deleteNotification(Long id, Long actingUserId) {
        NotificationEntity notification = repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Notification not found with id: " + id));
        verifyOwner(notification, actingUserId);
        repository.delete(notification);
    }

    public NotificationEntity markAsRead(Long id, Long actingUserId) {
        NotificationEntity notification = repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Notification not found with id: " + id));
        verifyOwner(notification, actingUserId);
        notification.setIsRead(true);
        return repository.save(notification);
    }

    public NotificationEntity createNotification(User user, String title, String body, NotificationType type) {
        NotificationEntity notification = NotificationEntity.builder()
                .user(user)
                .title(title)
                .body(body)
                .type(type)
                .isRead(false)
                .build();
        NotificationEntity saved = repository.save(notification);
        messagingTemplate.convertAndSendToUser(user.getEmail(), "/queue/notifications", saved);
        return saved;
    }

    public void markAllAsRead(Long userId) {
        List<NotificationEntity> unread = getUnreadNotifications(userId);
        unread.forEach(n -> n.setIsRead(true));
        repository.saveAll(unread);
    }

    private void verifyOwner(NotificationEntity notification, Long actingUserId) {
        boolean isOwner = notification.getUser() != null
                && notification.getUser().getId().equals(actingUserId);
        if (!isOwner && !SecurityUtils.isAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only modify your own notifications");
        }
    }
}
