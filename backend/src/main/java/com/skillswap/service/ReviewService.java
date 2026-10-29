package com.skillswap.service;

import com.skillswap.dto.CommonDtos;
import com.skillswap.entity.Review;
import com.skillswap.entity.SessionEntity;
import com.skillswap.entity.User;
import com.skillswap.enums.NotificationType;
import com.skillswap.enums.SessionStatus;
import com.skillswap.repository.ReviewRepository;
import com.skillswap.repository.SessionEntityRepository;
import com.skillswap.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class ReviewService {
    private final ReviewRepository reviewRepository;
    private final SessionEntityRepository sessionRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public Review create(CommonDtos.ReviewRequest request, Long reviewerId) {
        SessionEntity session = sessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new NoSuchElementException("Session not found"));

        if (session.getStatus() != SessionStatus.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Reviews can only be submitted after a session is completed");
        }

        Long hostId = session.getHostUser() != null ? session.getHostUser().getId() : null;
        Long learnerId = session.getLearnerUser() != null ? session.getLearnerUser().getId() : null;

        // The reviewer must be a participant of the session.
        if (!reviewerId.equals(hostId) && !reviewerId.equals(learnerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You can only review sessions you participated in");
        }

        // The reviewee must be the OTHER participant of the same session.
        Long expectedReviewee = reviewerId.equals(hostId) ? learnerId : hostId;
        if (request.getRevieweeId() == null || !request.getRevieweeId().equals(expectedReviewee)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "The reviewee must be the other participant of this session");
        }

        // No self-reviews.
        if (reviewerId.equals(request.getRevieweeId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot review yourself");
        }

        // One review per reviewer per session.
        if (reviewRepository.findBySessionIdAndReviewerId(request.getSessionId(), reviewerId).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You have already reviewed this session");
        }

        User reviewer = userRepository.findById(reviewerId)
                .orElseThrow(() -> new NoSuchElementException("Reviewer not found"));
        User reviewee = userRepository.findById(request.getRevieweeId())
                .orElseThrow(() -> new NoSuchElementException("Reviewee not found"));

        Review review = reviewRepository.save(Review.builder()
                .session(session)
                .reviewer(reviewer)
                .reviewee(reviewee)
                .rating(request.getRating())
                .comment(normalizeOptionalText(request.getComment()))
                .build());
        updateAggregate(request.getRevieweeId());

        // Create notification
        String title = reviewer.getFullName() + " left a " + request.getRating() + " star review";
        String body = normalizeOptionalText(request.getComment());
        notificationService.createNotification(reviewee, title, body, NotificationType.SYSTEM);

        return review;
    }

    public List<Review> getUserReviews(Long userId) {
        return reviewRepository.findByRevieweeId(userId);
    }

    public List<Review> getGivenReviews(Long userId) {
        return reviewRepository.findByReviewerId(userId);
    }

    public List<Review> getSessionReviews(Long sessionId) {
        return reviewRepository.findBySessionId(sessionId);
    }

    private void updateAggregate(Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        List<Review> reviews = reviewRepository.findByRevieweeId(userId);
        double avg = reviews.stream()
                .mapToInt(r -> r.getRating() != null ? r.getRating() : 0)
                .average()
                .orElse(0.0);
        user.setRatingAvg(avg);
        user.setTotalReviews(reviews.size());
        userRepository.save(user);
    }

    private String normalizeOptionalText(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
