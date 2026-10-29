package com.skillswap.service;

import com.skillswap.dto.CommonDtos;
import com.skillswap.entity.MatchEntity;
import com.skillswap.entity.SessionEntity;
import com.skillswap.enums.MatchStatus;
import com.skillswap.enums.NotificationType;
import com.skillswap.enums.SessionStatus;
import com.skillswap.exception.ResourceNotFoundException;
import com.skillswap.repository.MatchEntityRepository;
import com.skillswap.repository.SessionEntityRepository;
import com.skillswap.repository.UserRepository;
import com.skillswap.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.net.URISyntaxException;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SessionService {
    private final SessionEntityRepository repository;
    private final MatchEntityRepository matchRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public SessionEntity create(CommonDtos.SessionCreateRequest request, Long actingUserId) {
        validateCreateRequest(request);

        if (!actingUserId.equals(request.getHostUserId())
                && !actingUserId.equals(request.getLearnerUserId())
                && !SecurityUtils.isAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You can only create sessions you are part of");
        }

        MatchEntity match = matchRepository.findById(request.getMatchId())
                .orElseThrow(() -> new ResourceNotFoundException("Match not found"));
        if (match.getStatus() != MatchStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Sessions can only be created for an active match");
        }

        Long user1Id = match.getUser1().getId();
        Long user2Id = match.getUser2().getId();
        boolean usersBelongToMatch =
                (user1Id.equals(request.getHostUserId()) && user2Id.equals(request.getLearnerUserId()))
                        || (user2Id.equals(request.getHostUserId()) && user1Id.equals(request.getLearnerUserId()));
        if (!usersBelongToMatch) {
            throw new IllegalArgumentException("Session participants must be the two users in the selected match");
        }

        SessionEntity session = repository.save(SessionEntity.builder()
                .match(match)
                .hostUser(userRepository.findById(request.getHostUserId()).orElseThrow())
                .learnerUser(userRepository.findById(request.getLearnerUserId()).orElseThrow())
                .topic(request.getTopic().trim())
                .sessionMode(request.getSessionMode())
                .scheduledAt(request.getScheduledAt())
                .durationMinutes(request.getDurationMinutes() != null ? request.getDurationMinutes() : 60)
                .meetingLink(normalizeMeetingLink(request.getMeetingLink()))
                .location(normalizeOptionalText(request.getLocation()))
                .status(SessionStatus.SCHEDULED)
                .notes(normalizeOptionalText(request.getNotes()))
                .build());
        notifyParticipants(session, actingUserId,
                "New learning session scheduled",
                session.getTopic() + " is scheduled for " + session.getScheduledAt());
        return session;
    }

    public SessionEntity getSession(Long id, Long actingUserId) {
        SessionEntity session = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
        verifyParticipant(session, actingUserId);
        return session;
    }

    public List<SessionEntity> getUserSessions(Long userId) {
        return repository.findByHostUserIdOrLearnerUserId(userId, userId).stream()
                .sorted(Comparator.comparing(SessionEntity::getScheduledAt,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
    }

    @Transactional
    public SessionEntity updateStatus(Long id, SessionStatus status, Long actingUserId) {
        SessionEntity session = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
        verifyParticipant(session, actingUserId);
        if (status != SessionStatus.COMPLETED && status != SessionStatus.CANCELLED) {
            throw new IllegalArgumentException("Unsupported session status transition: " + status);
        }
        if (session.getStatus() == status) {
            return session;
        }
        if (session.getStatus() != SessionStatus.SCHEDULED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Only scheduled sessions can be completed or cancelled");
        }
        session.setStatus(status);
        SessionEntity saved = repository.save(session);
        notifyParticipants(saved, actingUserId,
                status == SessionStatus.COMPLETED ? "Session completed" : "Session cancelled",
                saved.getTopic());
        return saved;
    }

    @Transactional
    public SessionEntity reschedule(Long id, CommonDtos.SessionCreateRequest request, Long actingUserId) {
        SessionEntity session = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
        verifyParticipant(session, actingUserId);
        if (session.getStatus() != SessionStatus.SCHEDULED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only scheduled sessions can be rescheduled");
        }
        if (request.getScheduledAt() != null) {
            requireFuture(request.getScheduledAt());
            session.setScheduledAt(request.getScheduledAt());
        }
        if (request.getDurationMinutes() != null) session.setDurationMinutes(request.getDurationMinutes());
        if (request.getMeetingLink() != null) session.setMeetingLink(normalizeMeetingLink(request.getMeetingLink()));
        if (request.getLocation() != null) session.setLocation(normalizeOptionalText(request.getLocation()));
        if (request.getNotes() != null) session.setNotes(normalizeOptionalText(request.getNotes()));
        SessionEntity saved = repository.save(session);
        notifyParticipants(saved, actingUserId,
                "Session rescheduled",
                saved.getTopic() + " is now scheduled for " + saved.getScheduledAt());
        return saved;
    }

    private void validateCreateRequest(CommonDtos.SessionCreateRequest request) {
        if (request.getMatchId() == null || request.getHostUserId() == null || request.getLearnerUserId() == null) {
            throw new IllegalArgumentException("matchId, hostUserId, and learnerUserId are required");
        }
        if (request.getHostUserId().equals(request.getLearnerUserId())) {
            throw new IllegalArgumentException("Host and learner must be different users");
        }
        if (request.getTopic() == null || request.getTopic().isBlank()) {
            throw new IllegalArgumentException("topic is required");
        }
        if (request.getSessionMode() == null) {
            throw new IllegalArgumentException("sessionMode is required");
        }
        if (request.getScheduledAt() == null) {
            throw new IllegalArgumentException("scheduledAt is required");
        }
        requireFuture(request.getScheduledAt());
    }

    private void requireFuture(LocalDateTime scheduledAt) {
        if (!scheduledAt.isAfter(LocalDateTime.now())) {
            throw new IllegalArgumentException("scheduledAt must be in the future");
        }
    }

    private String normalizeMeetingLink(String value) {
        String normalized = normalizeOptionalText(value);
        if (normalized == null) {
            return null;
        }
        try {
            URI uri = new URI(normalized);
            if (!"http".equalsIgnoreCase(uri.getScheme()) && !"https".equalsIgnoreCase(uri.getScheme())) {
                throw new IllegalArgumentException("meetingLink must use http or https");
            }
        } catch (URISyntaxException ex) {
            throw new IllegalArgumentException("meetingLink must be a valid URL");
        }
        return normalized;
    }

    private String normalizeOptionalText(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private void notifyParticipants(SessionEntity session, Long actingUserId, String title, String body) {
        if (session.getHostUser() != null && !session.getHostUser().getId().equals(actingUserId)) {
            notificationService.createNotification(session.getHostUser(), title, body, NotificationType.SESSION);
        }
        if (session.getLearnerUser() != null && !session.getLearnerUser().getId().equals(actingUserId)) {
            notificationService.createNotification(session.getLearnerUser(), title, body, NotificationType.SESSION);
        }
    }

    private void verifyParticipant(SessionEntity session, Long actingUserId) {
        boolean participant =
                (session.getHostUser() != null && session.getHostUser().getId().equals(actingUserId))
                        || (session.getLearnerUser() != null && session.getLearnerUser().getId().equals(actingUserId));
        if (!participant && !SecurityUtils.isAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not a participant in this session");
        }
    }
}
