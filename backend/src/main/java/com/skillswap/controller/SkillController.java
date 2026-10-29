package com.skillswap.controller;

import com.skillswap.dto.CommonDtos;
import com.skillswap.entity.Skill;
import com.skillswap.security.SecurityUtils;
import com.skillswap.service.SkillService;
import com.skillswap.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class SkillController {

    private final SkillService skillService;
    private final UserService userService;

    // ─── Global Skill CRUD ─────────────────────────────────────────────────

    @GetMapping("/skills")
    public Object getSkills() {
        return skillService.getAllSkills();
    }

    // ✅ FIX: AdminSkills.jsx calls POST /skills
    @PostMapping("/skills")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Skill> addSkill(@RequestBody Skill skill) {
        skill.setIsActive(true);
        return ResponseEntity.ok(skillService.saveSkill(skill));
    }

    // ✅ FIX: AdminSkills.jsx calls PUT /skills/{id} to edit / toggle active
    @PutMapping("/skills/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Skill> updateSkill(@PathVariable Long id, @RequestBody Skill skill) {
        return ResponseEntity.ok(skillService.updateSkill(id, skill));
    }

    // ✅ FIX: AdminSkills.jsx calls DELETE /skills/{id}
    @DeleteMapping("/skills/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> deleteSkill(@PathVariable Long id) {
        skillService.deleteSkillById(id);
        return ResponseEntity.ok("Skill deleted");
    }

    // ─── Offered Skills ────────────────────────────────────────────────────

    @GetMapping("/users/{userId}/offered-skills")
    public Object getOffered(@PathVariable Long userId) {
        return skillService.getOfferedSkills(userId);
    }

    @GetMapping("/users/me/offered-skills")
    public Object getMyOfferedSkills() {
        return skillService.getOfferedSkills(getAuthenticatedUserId());
    }

    @PostMapping("/users/{userId}/offered-skills")
    public Object addOffered(@PathVariable Long userId,
                             @Valid @RequestBody CommonDtos.OfferedSkillRequest request) {
        authorizeSelfOrAdmin(userId);
        return skillService.addOfferedSkill(userId, request);
    }

    @PostMapping("/users/me/offered-skills")
    public Object addMyOfferedSkill(@Valid @RequestBody CommonDtos.OfferedSkillRequest request) {
        return skillService.addOfferedSkill(getAuthenticatedUserId(), request);
    }

    @DeleteMapping("/users/{userId}/offered-skills/{id}")
    public void deleteOffered(@PathVariable Long userId, @PathVariable Long id) {
        authorizeSelfOrAdmin(userId);
        skillService.deleteOfferedSkill(id, userId);
    }

    @DeleteMapping("/users/me/offered-skills/{id}")
    public void deleteMyOfferedSkill(@PathVariable Long id) {
        skillService.deleteOfferedSkill(id, getAuthenticatedUserId());
    }

    // ─── Wanted Skills ─────────────────────────────────────────────────────

    @GetMapping("/users/{userId}/wanted-skills")
    public Object getWanted(@PathVariable Long userId) {
        return skillService.getWantedSkills(userId);
    }

    @GetMapping("/users/me/wanted-skills")
    public Object getMyWantedSkills() {
        return skillService.getWantedSkills(getAuthenticatedUserId());
    }

    @PostMapping("/users/{userId}/wanted-skills")
    public Object addWanted(@PathVariable Long userId,
                            @Valid @RequestBody CommonDtos.WantedSkillRequest request) {
        authorizeSelfOrAdmin(userId);
        return skillService.addWantedSkill(userId, request);
    }

    @PostMapping("/users/me/wanted-skills")
    public Object addMyWantedSkill(@Valid @RequestBody CommonDtos.WantedSkillRequest request) {
        return skillService.addWantedSkill(getAuthenticatedUserId(), request);
    }

    @DeleteMapping("/users/{userId}/wanted-skills/{id}")
    public void deleteWanted(@PathVariable Long userId, @PathVariable Long id) {
        authorizeSelfOrAdmin(userId);
        skillService.deleteWantedSkill(id, userId);
    }

    @DeleteMapping("/users/me/wanted-skills/{id}")
    public void deleteMyWantedSkill(@PathVariable Long id) {
        skillService.deleteWantedSkill(id, getAuthenticatedUserId());
    }

    // ─── Helper ────────────────────────────────────────────────────────────

    private Long getAuthenticatedUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return userService.getUserByEmail(auth.getName()).getId();
    }

    private void authorizeSelfOrAdmin(Long userId) {
        if (!getAuthenticatedUserId().equals(userId) && !SecurityUtils.isAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only modify your own skills");
        }
    }
}