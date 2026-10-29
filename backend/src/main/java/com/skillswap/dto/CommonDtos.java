package com.skillswap.dto;

import com.skillswap.enums.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.LocalDate;

public class CommonDtos {

    @Data
    public static class ProfileUpdateRequest {
        @Size(min = 2, max = 100)
        private String fullName;
        @Size(max = 1000)
        private String bio;
        @Size(max = 100)
        private String city;
        @Size(max = 100)
        private String country;
        @Size(max = 255)
        private String languages;
        private String profilePhotoUrl;
        @Size(max = 500)
        private String availabilityText;
    }

    @Data
    public static class OfferedSkillRequest {
        @NotNull(message = "skillId is required")
        private Long skillId;
        private ProficiencyLevel proficiencyLevel;
        @Min(value = 0, message = "yearsExperience cannot be negative")
        @Max(value = 80, message = "yearsExperience must not exceed 80")
        private Integer yearsExperience;
        @Size(max = 1000)
        private String description;
    }

    @Data
    public static class WantedSkillRequest {
        @NotNull(message = "skillId is required")
        private Long skillId;
        private ProficiencyLevel targetLevel;
        @Size(max = 500)
        private String purpose;
        private UrgencyLevel urgencyLevel;
    }

    @Data
    public static class SwapRequestCreateRequest {
        @NotNull(message = "receiverId is required")
        private Long receiverId;
        private Long senderOfferedSkillId;
        private Long senderWantedSkillId;
        private Long receiverOfferedSkillId;
        private Long receiverWantedSkillId;
        private SessionMode preferredMode;
        private LocalDateTime proposedAt;
        @Size(max = 1000, message = "message must not exceed 1000 characters")
        private String message;
    }

    @Data
    public static class SessionCreateRequest {
        private Long matchId;
        private Long hostUserId;
        private Long learnerUserId;
        @Size(max = 200)
        private String topic;
        private SessionMode sessionMode;
        private LocalDateTime scheduledAt;
        @Min(value = 15, message = "durationMinutes must be at least 15")
        @Max(value = 480, message = "durationMinutes must not exceed 480")
        private Integer durationMinutes;
        @Size(max = 1000)
        private String meetingLink;
        @Size(max = 500)
        private String location;
        @Size(max = 1000)
        private String notes;
    }

    @Data
    public static class ReviewRequest {
        @NotNull(message = "sessionId is required")
        private Long sessionId;
        @NotNull(message = "revieweeId is required")
        private Long revieweeId;
        @NotNull(message = "rating is required")
        @Min(value = 1, message = "rating must be at least 1")
        @Max(value = 5, message = "rating must be at most 5")
        private Integer rating;
        @Size(max = 1000, message = "comment must not exceed 1000 characters")
        private String comment;
    }

    @Data
    public static class ChatMessageRequest {
        private Long matchId;
        private Long senderId;
        private Long replyToId;
        @NotBlank(message = "Message content must not be empty")
        @Size(max = 2000, message = "Message content must not exceed 2000 characters")
        private String content;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class UserSummary {
        private Long id;
        private String fullName;
        private String profilePhotoUrl;
        private Double ratingAvg;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ChatMessageResponse {
        private Long id;
        private UserSummary sender;
        private String content;
        private LocalDateTime createdAt;
        private Boolean isRead;
        private String messageType;
        private ReplyPreview replyTo;
        private LocalDateTime editedAt;
        private Boolean deleted;
        private String attachmentUrl;
        private String attachmentName;
        private String attachmentContentType;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ReplyPreview {
        private Long id;
        private String senderName;
        private String content;
    }

    @Data
    public static class StatusUpdateRequest {
        @NotBlank(message = "status is required")
        private String status;
    }

    @Data
    public static class GoalRequest {
        private Long skillId;
        @NotBlank @Size(max = 255) private String title;
        @Size(max = 1000) private String description;
        private LocalDate targetDate;
        @Min(0) @Max(100) private Integer progress;
        private GoalStatus status;
    }

    @Data
    public static class ReportRequest {
        @NotNull private Long reportedUserId;
        private Long messageId;
        private Long reviewId;
        @NotBlank @Size(max = 255) private String reason;
        @Size(max = 2000) private String details;
    }

    @Data
    public static class ModerationRequest {
        @NotBlank private String status;
        @Size(max = 1000) private String note;
    }
}
