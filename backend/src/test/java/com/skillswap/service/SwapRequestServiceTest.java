package com.skillswap.service;

import com.skillswap.dto.CommonDtos;
import com.skillswap.entity.Skill;
import com.skillswap.entity.User;
import com.skillswap.entity.UserOfferedSkill;
import com.skillswap.repository.ChatRepository;
import com.skillswap.repository.BlockedUserRepository;
import com.skillswap.repository.MatchEntityRepository;
import com.skillswap.repository.SwapRequestRepository;
import com.skillswap.repository.UserOfferedSkillRepository;
import com.skillswap.repository.UserRepository;
import com.skillswap.repository.UserWantedSkillRepository;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class SwapRequestServiceTest {

    @Test
    void rejectsSkillRecordsThatDoNotBelongToTheClaimedUser() {
        SwapRequestRepository requestRepository = mock(SwapRequestRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        UserOfferedSkillRepository offeredRepository = mock(UserOfferedSkillRepository.class);
        UserWantedSkillRepository wantedRepository = mock(UserWantedSkillRepository.class);
        NotificationService notificationService = mock(NotificationService.class);
        MatchEntityRepository matchRepository = mock(MatchEntityRepository.class);
        ChatRepository chatRepository = mock(ChatRepository.class);
        BlockedUserRepository blockedUserRepository = mock(BlockedUserRepository.class);
        SwapRequestService service = new SwapRequestService(requestRepository, userRepository,
                offeredRepository, wantedRepository, notificationService, matchRepository, chatRepository,
                blockedUserRepository);

        User sender = user(1L, "sender@test.local");
        User receiver = user(2L, "receiver@test.local");
        Skill skill = Skill.builder().name("Java").isActive(true).build();
        skill.setId(10L);
        UserOfferedSkill receiversSkill = UserOfferedSkill.builder().user(receiver).skill(skill).build();
        receiversSkill.setId(100L);

        CommonDtos.SwapRequestCreateRequest request = new CommonDtos.SwapRequestCreateRequest();
        request.setReceiverId(receiver.getId());
        request.setSenderOfferedSkillId(receiversSkill.getId());

        when(userRepository.findById(sender.getId())).thenReturn(Optional.of(sender));
        when(userRepository.findById(receiver.getId())).thenReturn(Optional.of(receiver));
        when(requestRepository.findBySenderId(sender.getId())).thenReturn(List.of());
        when(requestRepository.findByReceiverId(sender.getId())).thenReturn(List.of());
        when(offeredRepository.findById(receiversSkill.getId())).thenReturn(Optional.of(receiversSkill));

        assertThatThrownBy(() -> service.create(request, sender.getId()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("senderOfferedSkillId");
    }

    private User user(Long id, String email) {
        User user = User.builder().fullName(email).email(email).build();
        user.setId(id);
        return user;
    }
}
