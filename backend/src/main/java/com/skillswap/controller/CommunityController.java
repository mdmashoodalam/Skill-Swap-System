package com.skillswap.controller;

import com.skillswap.dto.CommonDtos;
import com.skillswap.service.CommunityService;
import com.skillswap.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/community")
@RequiredArgsConstructor
public class CommunityController {
    private final CommunityService service;
    private final UserService userService;

    @GetMapping("/favorites") public Object favorites() { return service.favorites(userId()); }
    @PostMapping("/favorites/{favoriteUserId}") public Object favorite(@PathVariable Long favoriteUserId) { return service.addFavorite(userId(), favoriteUserId); }
    @DeleteMapping("/favorites/{favoriteUserId}") public void unfavorite(@PathVariable Long favoriteUserId) { service.removeFavorite(userId(), favoriteUserId); }
    @GetMapping("/blocks") public Object blocks() { return service.blocks(userId()); }
    @PostMapping("/blocks/{blockedUserId}") public Object block(@PathVariable Long blockedUserId) { return service.block(userId(), blockedUserId); }
    @DeleteMapping("/blocks/{blockedUserId}") public void unblock(@PathVariable Long blockedUserId) { service.unblock(userId(), blockedUserId); }
    @GetMapping("/goals") public Object goals() { return service.goals(userId()); }
    @PostMapping("/goals") public Object createGoal(@Valid @RequestBody CommonDtos.GoalRequest request) { return service.createGoal(userId(), request); }
    @PutMapping("/goals/{goalId}") public Object updateGoal(@PathVariable Long goalId, @Valid @RequestBody CommonDtos.GoalRequest request) { return service.updateGoal(userId(), goalId, request); }
    @DeleteMapping("/goals/{goalId}") public void deleteGoal(@PathVariable Long goalId) { service.deleteGoal(userId(), goalId); }
    @PostMapping("/reports") public Object report(@Valid @RequestBody CommonDtos.ReportRequest request) { return service.report(userId(), request); }
    @GetMapping("/reports") @PreAuthorize("hasRole('ADMIN')") public Object reports() { return service.reports(); }
    @PutMapping("/reports/{reportId}") @PreAuthorize("hasRole('ADMIN')") public Object moderate(@PathVariable Long reportId, @Valid @RequestBody CommonDtos.ModerationRequest request) { return service.moderate(reportId, request); }

    private Long userId() { return userService.getUserByEmail(SecurityContextHolder.getContext().getAuthentication().getName()).getId(); }
}
