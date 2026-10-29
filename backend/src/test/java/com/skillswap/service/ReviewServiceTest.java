package com.skillswap.service;

import com.skillswap.dto.CommonDtos;
import com.skillswap.entity.SessionEntity;
import com.skillswap.entity.User;
import com.skillswap.enums.SessionStatus;
import com.skillswap.repository.ReviewRepository;
import com.skillswap.repository.SessionEntityRepository;
import com.skillswap.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ReviewServiceTest {

    @Test
    void rejectsReviewBeforeSessionIsCompleted() {
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
        SessionEntityRepository sessionRepository = mock(SessionEntityRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        NotificationService notificationService = mock(NotificationService.class);
        ReviewService service = new ReviewService(reviewRepository, sessionRepository,
                userRepository, notificationService);

        User host = user(1L);
        User learner = user(2L);
        SessionEntity session = SessionEntity.builder()
                .hostUser(host).learnerUser(learner).status(SessionStatus.SCHEDULED).build();
        session.setId(10L);

        CommonDtos.ReviewRequest request = new CommonDtos.ReviewRequest();
        request.setSessionId(session.getId());
        request.setRevieweeId(learner.getId());
        request.setRating(5);
        when(sessionRepository.findById(session.getId())).thenReturn(Optional.of(session));

        assertThatThrownBy(() -> service.create(request, host.getId()))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("completed");
    }

    private User user(Long id) {
        User user = User.builder().fullName("User " + id).email("user" + id + "@test.local").build();
        user.setId(id);
        return user;
    }
}
