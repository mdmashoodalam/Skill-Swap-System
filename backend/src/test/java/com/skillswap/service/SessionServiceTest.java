package com.skillswap.service;

import com.skillswap.dto.CommonDtos;
import com.skillswap.entity.MatchEntity;
import com.skillswap.entity.User;
import com.skillswap.enums.MatchStatus;
import com.skillswap.enums.SessionMode;
import com.skillswap.repository.MatchEntityRepository;
import com.skillswap.repository.SessionEntityRepository;
import com.skillswap.repository.UserRepository;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class SessionServiceTest {

    @Test
    void rejectsParticipantsWhoAreNotTheUsersInTheMatch() {
        SessionEntityRepository sessionRepository = mock(SessionEntityRepository.class);
        MatchEntityRepository matchRepository = mock(MatchEntityRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        NotificationService notificationService = mock(NotificationService.class);
        SessionService service = new SessionService(sessionRepository, matchRepository, userRepository,
                notificationService);

        User user1 = user(1L);
        User user2 = user(2L);
        MatchEntity match = MatchEntity.builder()
                .user1(user1).user2(user2).status(MatchStatus.ACTIVE).build();
        match.setId(20L);

        CommonDtos.SessionCreateRequest request = new CommonDtos.SessionCreateRequest();
        request.setMatchId(match.getId());
        request.setHostUserId(user1.getId());
        request.setLearnerUserId(3L);
        request.setTopic("Java basics");
        request.setSessionMode(SessionMode.ONLINE);
        request.setScheduledAt(LocalDateTime.now().plusDays(1));

        when(matchRepository.findById(match.getId())).thenReturn(Optional.of(match));

        assertThatThrownBy(() -> service.create(request, user1.getId()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("participants");
    }

    private User user(Long id) {
        User user = User.builder().fullName("User " + id).email("user" + id + "@test.local").build();
        user.setId(id);
        return user;
    }
}
