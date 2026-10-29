package com.skillswap.service;

import com.skillswap.dto.CommonDtos;
import com.skillswap.entity.Skill;
import com.skillswap.entity.User;
import com.skillswap.entity.UserOfferedSkill;
import com.skillswap.entity.UserWantedSkill;
import com.skillswap.repository.SkillRepository;
import com.skillswap.repository.UserOfferedSkillRepository;
import com.skillswap.repository.UserRepository;
import com.skillswap.repository.UserWantedSkillRepository;
import com.skillswap.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class SkillService {

    private final SkillRepository skillRepository;
    private final UserRepository userRepository;
    private final UserOfferedSkillRepository offeredSkillRepository;
    private final UserWantedSkillRepository wantedSkillRepository;

    public List<Skill> getAllSkills() {
        return skillRepository.findAll();
    }

    @Transactional
    public Skill saveSkill(Skill skill) {
        normalizeAndValidateSkill(skill);
        if (skillRepository.findByNameIgnoreCase(skill.getName()).isPresent()) {
            throw new IllegalArgumentException("A skill with this name already exists");
        }
        if (skill.getIsActive() == null) skill.setIsActive(true);
        return skillRepository.save(skill);
    }

    @Transactional
    public Skill updateSkill(Long id, Skill changes) {
        Skill skill = skillRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Skill not found with id: " + id));
        if (changes.getName() != null) {
            String newName = changes.getName().trim();
            if (newName.isEmpty()) throw new IllegalArgumentException("Skill name is required");
            skillRepository.findByNameIgnoreCase(newName)
                    .filter(existing -> !existing.getId().equals(id))
                    .ifPresent(existing -> {
                        throw new IllegalArgumentException("A skill with this name already exists");
                    });
            skill.setName(newName);
        }
        if (changes.getCategory() != null) skill.setCategory(normalizeOptionalText(changes.getCategory()));
        if (changes.getDescription() != null) skill.setDescription(normalizeOptionalText(changes.getDescription()));
        if (changes.getIsActive() != null) skill.setIsActive(changes.getIsActive());
        return skillRepository.save(skill);
    }

    @Transactional
    public void deleteSkillById(Long id) {
        Skill skill = skillRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Skill not found with id: " + id));
        boolean inUse = offeredSkillRepository.countBySkillId(id) > 0
                || wantedSkillRepository.countBySkillId(id) > 0;
        if (inUse) {
            skill.setIsActive(false);
            skillRepository.save(skill);
        } else {
            skillRepository.delete(skill);
        }
    }

    public List<UserOfferedSkill> getOfferedSkills(Long userId) {
        return offeredSkillRepository.findByUserId(userId);
    }

    public List<UserWantedSkill> getWantedSkills(Long userId) {
        return wantedSkillRepository.findByUserId(userId);
    }

    @Transactional
    public UserOfferedSkill addOfferedSkill(Long userId, CommonDtos.OfferedSkillRequest request) {
        User user = userRepository.findById(userId).orElseThrow();
        Skill skill = skillRepository.findById(request.getSkillId()).orElseThrow();
        verifySkillIsActive(skill);
        if (offeredSkillRepository.findByUserIdAndSkillId(userId, skill.getId()).isPresent()) {
            throw new IllegalArgumentException("You already offer this skill");
        }
        return offeredSkillRepository.save(UserOfferedSkill.builder()
                .user(user).skill(skill)
                .proficiencyLevel(request.getProficiencyLevel())
                .yearsExperience(request.getYearsExperience())
                .description(request.getDescription())
                .build());
    }

    @Transactional
    public UserWantedSkill addWantedSkill(Long userId, CommonDtos.WantedSkillRequest request) {
        User user = userRepository.findById(userId).orElseThrow();
        Skill skill = skillRepository.findById(request.getSkillId()).orElseThrow();
        verifySkillIsActive(skill);
        if (wantedSkillRepository.findByUserIdAndSkillId(userId, skill.getId()).isPresent()) {
            throw new IllegalArgumentException("You already want to learn this skill");
        }
        return wantedSkillRepository.save(UserWantedSkill.builder()
                .user(user).skill(skill)
                .targetLevel(request.getTargetLevel())
                .purpose(request.getPurpose())
                .urgencyLevel(request.getUrgencyLevel())
                .build());
    }

    // ✅ Ownership-verified deletes: the acting user must own the row (admins bypass).
    public void deleteOfferedSkill(Long id, Long actingUserId) {
        UserOfferedSkill skill = offeredSkillRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Offered skill not found with id: " + id));
        verifyOwner(skill.getUser() != null ? skill.getUser().getId() : null, actingUserId);
        offeredSkillRepository.delete(skill);
    }

    public void deleteWantedSkill(Long id, Long actingUserId) {
        UserWantedSkill skill = wantedSkillRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Wanted skill not found with id: " + id));
        verifyOwner(skill.getUser() != null ? skill.getUser().getId() : null, actingUserId);
        wantedSkillRepository.delete(skill);
    }

    private void verifyOwner(Long ownerId, Long actingUserId) {
        boolean isOwner = ownerId != null && ownerId.equals(actingUserId);
        if (!isOwner && !SecurityUtils.isAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only modify your own skills");
        }
    }

    private void verifySkillIsActive(Skill skill) {
        if (!Boolean.TRUE.equals(skill.getIsActive())) {
            throw new IllegalArgumentException("This skill is no longer active");
        }
    }

    private void normalizeAndValidateSkill(Skill skill) {
        if (skill.getName() == null || skill.getName().isBlank()) {
            throw new IllegalArgumentException("Skill name is required");
        }
        skill.setName(skill.getName().trim());
        skill.setCategory(normalizeOptionalText(skill.getCategory()));
        skill.setDescription(normalizeOptionalText(skill.getDescription()));
    }

    private String normalizeOptionalText(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
