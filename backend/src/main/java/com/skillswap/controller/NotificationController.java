package com.skillswap.controller;

import com.skillswap.security.SecurityUtils;
import com.skillswap.service.NotificationService;
import com.skillswap.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService service;
    private final UserService userService;

    @GetMapping("/{userId}")
    public Object getNotifications(@PathVariable Long userId) {
        // ✅ Users may only read their own notifications (admins may read anyone's)
        Long currentUserId = getAuthenticatedUserId();
        if (!currentUserId.equals(userId) && !SecurityUtils.isAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only view your own notifications");
        }
        return service.getUserNotifications(userId);
    }

    @GetMapping("/me")
    public Object getMyNotifications() {
        return service.getUserNotifications(getAuthenticatedUserId());
    }

    @GetMapping("/me/unread")
    public Object getMyUnreadNotifications() {
        return service.getUnreadNotifications(getAuthenticatedUserId());
    }

    @GetMapping("/me/unread-count")
    public Object getUnreadCount() {
        return service.getUnreadCount(getAuthenticatedUserId());
    }

    @DeleteMapping("/{id}")
    public void deleteNotification(@PathVariable Long id) {
        service.deleteNotification(id, getAuthenticatedUserId());
    }

    @PatchMapping("/{id}/read")
    public Object read(@PathVariable Long id) {
        return service.markAsRead(id, getAuthenticatedUserId());
    }

    @PatchMapping("/me/read-all")
    public void readAll() {
        service.markAllAsRead(getAuthenticatedUserId());
    }

    private Long getAuthenticatedUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return userService.getUserByEmail(auth.getName()).getId();
    }
}