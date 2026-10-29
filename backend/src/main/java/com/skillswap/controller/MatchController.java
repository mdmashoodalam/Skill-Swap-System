package com.skillswap.controller;

import com.skillswap.dto.CommonDtos;
import com.skillswap.entity.MatchEntity;
import com.skillswap.enums.MatchStatus;
import com.skillswap.security.SecurityUtils;
import com.skillswap.service.MatchService;
import com.skillswap.service.UserService;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/matches")
@RequiredArgsConstructor
public class MatchController {

    private final MatchService matchService;
    private final UserService userService;

    // ──────────────────────────────────────────────────────────────────
    // GET RECOMMENDED MATCHES for a specific user (by userId path param)
    // ──────────────────────────────────────────────────────────────────
    @GetMapping("/recommended/{userId}")
    public ResponseEntity<List<MatchEntity>> recommended(@PathVariable Long userId) {
        // ✅ Users may only fetch their own recommendations (admins may fetch anyone's)
        if (!getAuthenticatedUserId().equals(userId) && !SecurityUtils.isAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only view your own recommendations");
        }
        return ResponseEntity.ok(matchService.getRecommendedMatches(userId));
    }

    // ──────────────────────────────────────────────────────────────────
    // GET RECOMMENDED MATCHES for the currently logged-in user
    // ──────────────────────────────────────────────────────────────────
    @GetMapping("/recommended/me")
    public ResponseEntity<List<MatchEntity>> recommendedForMe() {
        Long userId = getAuthenticatedUserId();
        return ResponseEntity.ok(matchService.getRecommendedMatches(userId));
    }

    // ──────────────────────────────────────────────────────────────────
    // ✅ NEW: GET ALL EXISTING MATCHES for the current user
    // Needed by ChatListPage / Dashboard to show existing chat rooms
    // ──────────────────────────────────────────────────────────────────
    @GetMapping("/me")
    public ResponseEntity<List<MatchEntity>> myMatches() {
        Long userId = getAuthenticatedUserId();
        return ResponseEntity.ok(matchService.getMatchesForUser(userId));
    }

    // ──────────────────────────────────────────────────────────────────
    // GET A SINGLE MATCH by ID
    // ──────────────────────────────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<MatchEntity> getMatch(@PathVariable Long id) {
        MatchEntity match = matchService.getMatch(id);
        // ✅ Only participants (or an admin) may view a match
        Long userId = getAuthenticatedUserId();
        boolean participant = match.getUser1().getId().equals(userId) || match.getUser2().getId().equals(userId);
        if (!participant && !SecurityUtils.isAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not a participant in this match");
        }
        return ResponseEntity.ok(match);
    }

    // ──────────────────────────────────────────────────────────────────
    // GET ALL MATCHES (Admin only)
    // ──────────────────────────────────────────────────────────────────
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<MatchEntity>> getAllMatches() {
        return ResponseEntity.ok(matchService.getAllMatches());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MatchEntity> updateStatus(@PathVariable Long id,
                                                     @Valid @RequestBody CommonDtos.StatusUpdateRequest request) {
        MatchStatus status = MatchStatus.valueOf(request.getStatus().trim().toUpperCase());
        return ResponseEntity.ok(matchService.updateStatus(id, status));
    }

    // ──────────────────────────────────────────────────────────────────
    // HELPER
    // ──────────────────────────────────────────────────────────────────
    private Long getAuthenticatedUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return userService.getUserByEmail(auth.getName()).getId();
    }
}
