package com.skillswap.controller;

import com.skillswap.dto.CommonDtos;
import com.skillswap.enums.SessionStatus;
import com.skillswap.security.SecurityUtils;
import com.skillswap.service.SessionService;
import com.skillswap.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class SessionController {
    private final SessionService service;
    private final UserService userService;

    @PostMapping
    public Object create(@Valid @RequestBody CommonDtos.SessionCreateRequest request) {
        return service.create(request, getAuthenticatedUserId());
    }

    @GetMapping("/{id}")
    public Object getSession(@PathVariable Long id) {
        return service.getSession(id, getAuthenticatedUserId());
    }

    @GetMapping("/user/{userId}")
    public Object userSessions(@PathVariable Long userId) {
        if (!getAuthenticatedUserId().equals(userId) && !SecurityUtils.isAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only view your own sessions");
        }
        return service.getUserSessions(userId);
    }

    @GetMapping("/me/sessions")
    public Object mySessionsall() {
        return service.getUserSessions(getAuthenticatedUserId());
    }

    @PatchMapping("/{id}/complete")
    public Object complete(@PathVariable Long id) {
        return service.updateStatus(id, SessionStatus.COMPLETED, getAuthenticatedUserId());
    }

    @PatchMapping("/{id}/cancel")
    public Object cancel(@PathVariable Long id) {
        return service.updateStatus(id, SessionStatus.CANCELLED, getAuthenticatedUserId());
    }

    @PatchMapping("/{id}/reschedule")
    public Object reschedule(@PathVariable Long id, @Valid @RequestBody CommonDtos.SessionCreateRequest request) {
        return service.reschedule(id, request, getAuthenticatedUserId());
    }

    private Long getAuthenticatedUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return userService.getUserByEmail(auth.getName()).getId();
    }
}
