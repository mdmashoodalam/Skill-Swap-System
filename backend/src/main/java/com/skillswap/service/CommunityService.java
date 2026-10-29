package com.skillswap.service;

import com.skillswap.dto.CommonDtos;
import com.skillswap.entity.*;
import com.skillswap.enums.GoalStatus;
import com.skillswap.enums.ReportStatus;
import com.skillswap.exception.ResourceNotFoundException;
import com.skillswap.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CommunityService {
    private final FavoriteUserRepository favoriteRepository;
    private final BlockedUserRepository blockedRepository;
    private final LearningGoalRepository goalRepository;
    private final UserReportRepository reportRepository;
    private final UserRepository userRepository;
    private final SkillRepository skillRepository;
    private final MessageRepository messageRepository;
    private final ReviewRepository reviewRepository;

    public List<FavoriteUser> favorites(Long userId) { return favoriteRepository.findByOwnerIdOrderByCreatedAtDesc(userId); }

    @Transactional
    public FavoriteUser addFavorite(Long userId, Long favoriteUserId) {
        if (userId.equals(favoriteUserId)) throw new IllegalArgumentException("You cannot favorite yourself");
        return favoriteRepository.findByOwnerIdAndFavoriteUserId(userId, favoriteUserId).orElseGet(() ->
                favoriteRepository.save(FavoriteUser.builder().owner(user(userId)).favoriteUser(user(favoriteUserId)).build()));
    }

    @Transactional
    public void removeFavorite(Long userId, Long favoriteUserId) {
        favoriteRepository.findByOwnerIdAndFavoriteUserId(userId, favoriteUserId).ifPresent(favoriteRepository::delete);
    }

    public List<BlockedUser> blocks(Long userId) { return blockedRepository.findByBlockerIdOrderByCreatedAtDesc(userId); }

    @Transactional
    public BlockedUser block(Long userId, Long blockedUserId) {
        if (userId.equals(blockedUserId)) throw new IllegalArgumentException("You cannot block yourself");
        FavoriteUser favorite = favoriteRepository.findByOwnerIdAndFavoriteUserId(userId, blockedUserId).orElse(null);
        if (favorite != null) favoriteRepository.delete(favorite);
        return blockedRepository.findByBlockerIdAndBlockedUserId(userId, blockedUserId).orElseGet(() ->
                blockedRepository.save(BlockedUser.builder().blocker(user(userId)).blockedUser(user(blockedUserId)).build()));
    }

    @Transactional
    public void unblock(Long userId, Long blockedUserId) {
        blockedRepository.findByBlockerIdAndBlockedUserId(userId, blockedUserId).ifPresent(blockedRepository::delete);
    }

    public List<LearningGoal> goals(Long userId) { return goalRepository.findByUserIdOrderByCreatedAtDesc(userId); }

    @Transactional
    public LearningGoal createGoal(Long userId, CommonDtos.GoalRequest request) {
        LearningGoal goal = LearningGoal.builder().user(user(userId))
                .skill(request.getSkillId() == null ? null : skillRepository.findById(request.getSkillId())
                        .orElseThrow(() -> new ResourceNotFoundException("Skill not found")))
                .title(request.getTitle().trim()).description(normalize(request.getDescription()))
                .targetDate(request.getTargetDate()).progress(request.getProgress() == null ? 0 : request.getProgress())
                .status(request.getStatus() == null ? GoalStatus.ACTIVE : request.getStatus()).build();
        return goalRepository.save(goal);
    }

    @Transactional
    public LearningGoal updateGoal(Long userId, Long goalId, CommonDtos.GoalRequest request) {
        LearningGoal goal = ownedGoal(userId, goalId);
        if (request.getTitle() != null) goal.setTitle(request.getTitle().trim());
        if (request.getDescription() != null) goal.setDescription(normalize(request.getDescription()));
        if (request.getTargetDate() != null) goal.setTargetDate(request.getTargetDate());
        if (request.getProgress() != null) goal.setProgress(request.getProgress());
        if (request.getStatus() != null) goal.setStatus(request.getStatus());
        if (request.getSkillId() != null) goal.setSkill(skillRepository.findById(request.getSkillId()).orElseThrow());
        if (goal.getProgress() != null && goal.getProgress() == 100) goal.setStatus(GoalStatus.COMPLETED);
        return goalRepository.save(goal);
    }

    @Transactional
    public void deleteGoal(Long userId, Long goalId) { goalRepository.delete(ownedGoal(userId, goalId)); }

    @Transactional
    public UserReport report(Long reporterId, CommonDtos.ReportRequest request) {
        if (reporterId.equals(request.getReportedUserId())) throw new IllegalArgumentException("You cannot report yourself");
        Message message = request.getMessageId() == null ? null : messageRepository.findById(request.getMessageId()).orElseThrow();
        Review review = request.getReviewId() == null ? null : reviewRepository.findById(request.getReviewId()).orElseThrow();
        if (message != null && !message.getSender().getId().equals(request.getReportedUserId()))
            throw new IllegalArgumentException("The selected message was not sent by the reported user");
        if (review != null && !review.getReviewee().getId().equals(request.getReportedUserId()))
            throw new IllegalArgumentException("The selected review is not about the reported user");
        return reportRepository.save(UserReport.builder().reporter(user(reporterId)).reportedUser(user(request.getReportedUserId()))
                .message(message).review(review).reason(request.getReason().trim()).details(normalize(request.getDetails()))
                .status(ReportStatus.OPEN).build());
    }

    public List<UserReport> reports() { return reportRepository.findAllByOrderByCreatedAtDesc(); }

    @Transactional
    public UserReport moderate(Long reportId, CommonDtos.ModerationRequest request) {
        UserReport report = reportRepository.findById(reportId).orElseThrow(() -> new ResourceNotFoundException("Report not found"));
        report.setStatus(ReportStatus.valueOf(request.getStatus().trim().toUpperCase()));
        report.setResolutionNote(normalize(request.getNote()));
        return reportRepository.save(report);
    }

    private User user(Long id) { return userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found")); }
    private LearningGoal ownedGoal(Long userId, Long goalId) {
        LearningGoal goal = goalRepository.findById(goalId).orElseThrow(() -> new ResourceNotFoundException("Goal not found"));
        if (!goal.getUser().getId().equals(userId)) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only modify your own goals");
        return goal;
    }
    private String normalize(String value) { return value == null || value.isBlank() ? null : value.trim(); }
}
