package com.skillswap.service;

import com.skillswap.entity.MatchEntity;
import com.skillswap.entity.Skill;
import com.skillswap.entity.User;
import com.skillswap.entity.UserOfferedSkill;
import com.skillswap.entity.UserWantedSkill;
import com.skillswap.enums.MatchStatus;
import com.skillswap.repository.MatchEntityRepository;
import com.skillswap.repository.SwapRequestRepository;
import com.skillswap.repository.UserOfferedSkillRepository;
import com.skillswap.repository.UserRepository;
import com.skillswap.repository.UserWantedSkillRepository;
import com.skillswap.repository.BlockedUserRepository;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class MatchServiceTest {

    @Test
    void recommendsOnlyNewUsersWithComplementarySkills() {
        UserRepository userRepository = mock(UserRepository.class);
        UserOfferedSkillRepository offeredRepository = mock(UserOfferedSkillRepository.class);
        UserWantedSkillRepository wantedRepository = mock(UserWantedSkillRepository.class);
        MatchEntityRepository matchRepository = mock(MatchEntityRepository.class);
        SwapRequestRepository requestRepository = mock(SwapRequestRepository.class);
        BlockedUserRepository blockedRepository = mock(BlockedUserRepository.class);
        MatchService service = new MatchService(userRepository, offeredRepository, wantedRepository,
                matchRepository, requestRepository, blockedRepository);

        User current = user(1L, "Current", 0.0);
        User candidate = user(2L, "Candidate", 4.7);
        User existingPartner = user(3L, "Existing", 5.0);
        Skill java = skill(10L, "Java");
        Skill design = skill(11L, "Design");

        List<UserOfferedSkill> offered = List.of(
                offered(101L, current, java),
                offered(102L, candidate, design),
                offered(103L, existingPartner, design));
        List<UserWantedSkill> wanted = List.of(
                wanted(201L, current, design),
                wanted(202L, candidate, java),
                wanted(203L, existingPartner, java));

        MatchEntity existingMatch = MatchEntity.builder()
                .user1(current).user2(existingPartner).status(MatchStatus.ACTIVE).matchScore(100).build();
        existingMatch.setId(50L);

        when(userRepository.findById(1L)).thenReturn(Optional.of(current));
        when(userRepository.findAll()).thenReturn(List.of(current, candidate, existingPartner));
        when(offeredRepository.findAll()).thenReturn(offered);
        when(wantedRepository.findAll()).thenReturn(wanted);
        when(matchRepository.findByUserIdEither(1L)).thenReturn(List.of(existingMatch));
        when(requestRepository.findBySenderId(1L)).thenReturn(List.of());
        when(requestRepository.findByReceiverId(1L)).thenReturn(List.of());

        List<MatchEntity> recommendations = service.getRecommendedMatches(1L);

        assertThat(recommendations).hasSize(1);
        assertThat(recommendations.getFirst().getUser2().getId()).isEqualTo(2L);
        assertThat(recommendations.getFirst().getId()).isEqualTo(-2L);
        assertThat(recommendations.getFirst().getMatchScore()).isEqualTo(70);
    }

    private User user(Long id, String name, Double rating) {
        User user = User.builder().fullName(name).email(name.toLowerCase() + "@test.local")
                .ratingAvg(rating).build();
        user.setId(id);
        return user;
    }

    private Skill skill(Long id, String name) {
        Skill skill = Skill.builder().name(name).isActive(true).build();
        skill.setId(id);
        return skill;
    }

    private UserOfferedSkill offered(Long id, User user, Skill skill) {
        UserOfferedSkill item = UserOfferedSkill.builder().user(user).skill(skill).build();
        item.setId(id);
        return item;
    }

    private UserWantedSkill wanted(Long id, User user, Skill skill) {
        UserWantedSkill item = UserWantedSkill.builder().user(user).skill(skill).build();
        item.setId(id);
        return item;
    }
}
