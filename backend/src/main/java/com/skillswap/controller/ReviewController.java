package com.skillswap.controller;

import com.skillswap.dto.CommonDtos;
import com.skillswap.security.SecurityUtils;
import com.skillswap.service.ReviewService;
import com.skillswap.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {
    private final ReviewService service;
    private final UserService userService;

    @PostMapping("/{reviewerId}")
    public Object create(@PathVariable Long reviewerId, @Valid @RequestBody CommonDtos.ReviewRequest request) {
        // A user can only post a review AS themselves (admins may act on behalf of anyone).
        if (!getAuthenticatedUserId().equals(reviewerId) && !SecurityUtils.isAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only submit reviews as yourself");
        }
        return service.create(request, reviewerId);
    }

    @PostMapping("/me")
    public Object createFromMe(@Valid @RequestBody CommonDtos.ReviewRequest request) {
        return service.create(request, getAuthenticatedUserId());
    }

    @GetMapping("/user/{userId}")
    public Object getUserReviews(@PathVariable Long userId) {
        return service.getUserReviews(userId);
    }

    @GetMapping("/me/reviews")
    public Object getMyReviews() {
        return service.getUserReviews(getAuthenticatedUserId());
    }

    @GetMapping("/me/given")
    public Object getMyGivenReviews() {
        return service.getGivenReviews(getAuthenticatedUserId());
    }

    @GetMapping("/session/{sessionId}")
    public Object getSessionReviews(@PathVariable Long sessionId) {
        return service.getSessionReviews(sessionId);
    }

    private Long getAuthenticatedUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return userService.getUserByEmail(auth.getName()).getId();
    }
}
