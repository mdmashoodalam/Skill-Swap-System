package com.skillswap.service;

import com.skillswap.entity.MatchEntity;
import com.skillswap.entity.User;
import com.skillswap.entity.UserOfferedSkill;
import com.skillswap.entity.UserWantedSkill;
import com.skillswap.enums.MatchStatus;
import com.skillswap.enums.RequestStatus;
import com.skillswap.exception.ResourceNotFoundException;
import com.skillswap.repository.MatchEntityRepository;
import com.skillswap.repository.SwapRequestRepository;
import com.skillswap.repository.UserOfferedSkillRepository;
import com.skillswap.repository.UserRepository;
import com.skillswap.repository.UserWantedSkillRepository;
import com.skillswap.repository.BlockedUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MatchService {

    private final UserRepository userRepository;
    private final UserOfferedSkillRepository offeredRepository;
    private final UserWantedSkillRepository wantedRepository;
    private final MatchEntityRepository matchRepository;
    private final SwapRequestRepository swapRequestRepository;
    private final BlockedUserRepository blockedUserRepository;

    public MatchEntity getMatch(Long id) {
        return matchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Match not found with id: " + id));
    }

    public List<MatchEntity> getAllMatches() {
        return matchRepository.findAll();
    }

    @Transactional
    public MatchEntity updateStatus(Long id, MatchStatus status) {
        MatchEntity match = getMatch(id);
        match.setStatus(status);
        return matchRepository.save(match);
    }

    public List<MatchEntity> getMatchesForUser(Long userId) {
        return matchRepository.findByUserIdEither(userId).stream()
                .filter(match -> match.getStatus() != null && match.getStatus().name().equals("ACTIVE"))
                .sorted(Comparator.comparing(MatchEntity::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MatchEntity> getRecommendedMatches(Long userId) {
        User current = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Map<Long, List<UserOfferedSkill>> offeredByUser = offeredRepository.findAll().stream()
                .collect(Collectors.groupingBy(skill -> skill.getUser().getId()));
        Map<Long, List<UserWantedSkill>> wantedByUser = wantedRepository.findAll().stream()
                .collect(Collectors.groupingBy(skill -> skill.getUser().getId()));

        List<UserOfferedSkill> myOffered = offeredByUser.getOrDefault(userId, List.of());
        List<UserWantedSkill> myWanted = wantedByUser.getOrDefault(userId, List.of());

        List<MatchEntity> existingMatches = matchRepository.findByUserIdEither(userId);

        Set<Long> alreadyMatchedUserIds = new HashSet<>();
        for (MatchEntity m : existingMatches) {
            Long otherId = m.getUser1().getId().equals(userId) ? m.getUser2().getId() : m.getUser1().getId();
            alreadyMatchedUserIds.add(otherId);
        }

        // Hide users who already have a live request with the current user. This prevents
        // recommendation cards that can only fail with a duplicate-request response.
        swapRequestRepository.findBySenderId(userId).stream()
                .filter(request -> request.getStatus() == RequestStatus.PENDING
                        || request.getStatus() == RequestStatus.ACCEPTED)
                .map(request -> request.getReceiver().getId())
                .forEach(alreadyMatchedUserIds::add);
        swapRequestRepository.findByReceiverId(userId).stream()
                .filter(request -> request.getStatus() == RequestStatus.PENDING
                        || request.getStatus() == RequestStatus.ACCEPTED)
                .map(request -> request.getSender().getId())
                .forEach(alreadyMatchedUserIds::add);

        List<User> allUsers = userRepository.findAll();
        List<MatchEntity> newMatches = new ArrayList<>();

        for (User other : allUsers) {
            if (other.getId().equals(userId)) continue;
            if (alreadyMatchedUserIds.contains(other.getId())) continue;
            if (blockedUserRepository.existsByBlockerIdAndBlockedUserId(userId, other.getId())
                    || blockedUserRepository.existsByBlockerIdAndBlockedUserId(other.getId(), userId)) continue;

            List<UserOfferedSkill> otherOffered = offeredByUser.getOrDefault(other.getId(), List.of());
            List<UserWantedSkill> otherWanted = wantedByUser.getOrDefault(other.getId(), List.of());

            int score = calculateScore(current, other, myOffered, myWanted, otherOffered, otherWanted);

            if (score > 0) {
                // Recommendations are transient: reading this endpoint never creates a match.
                // A synthetic negative id keeps client keys unique without touching the DB.
                MatchEntity match = MatchEntity.builder()
                        .user1(current)
                        .user2(other)
                        .matchScore(score)
                        .status(com.skillswap.enums.MatchStatus.ACTIVE)
                        .matchReasons(buildReasons(current, other, myOffered, myWanted, otherOffered, otherWanted))
                        .build();
                match.setId(-other.getId());
                newMatches.add(match);
            }
        }

        return newMatches.stream()
                .sorted(Comparator.comparing(MatchEntity::getMatchScore,
                                Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(match -> match.getUser2().getRatingAvg(),
                                Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(20)
                .collect(Collectors.toList());
    }

    private int calculateScore(
            User current,
            User other,
            List<UserOfferedSkill> myOffered,
            List<UserWantedSkill> myWanted,
            List<UserOfferedSkill> otherOffered,
            List<UserWantedSkill> otherWanted
    ) {
        Set<Long> myOfferedIds = skillIds(myOffered, item -> item.getSkill().getId());
        Set<Long> myWantedIds = skillIds(myWanted, item -> item.getSkill().getId());
        Set<Long> otherOfferedIds = skillIds(otherOffered, item -> item.getSkill().getId());
        Set<Long> otherWantedIds = skillIds(otherWanted, item -> item.getSkill().getId());

        int teachMatches = intersectionSize(myOfferedIds, otherWantedIds);
        int learnMatches = intersectionSize(myWantedIds, otherOfferedIds);
        int compatibilityCount = teachMatches + learnMatches;

        // Location or rating alone should never produce a skill-swap recommendation.
        if (compatibilityCount == 0) {
            return 0;
        }

        int score = Math.min(80, compatibilityCount * 30);

        if (current.getCity() != null
                && current.getCity().equalsIgnoreCase(Optional.ofNullable(other.getCity()).orElse(""))) {
            score += 5;
        }

        if (other.getRatingAvg() != null && other.getRatingAvg() >= 4.5) {
            score += 10;
        } else if (other.getRatingAvg() != null && other.getRatingAvg() >= 4.0) {
            score += 5;
        }

        if (current.getAvailabilityText() != null
                && other.getAvailabilityText() != null
                && current.getAvailabilityText().equalsIgnoreCase(other.getAvailabilityText())) {
            score += 5;
        }

        return Math.min(score, 100);
    }

    private <T> Set<Long> skillIds(List<T> items, Function<T, Long> idExtractor) {
        return items.stream().map(idExtractor).collect(Collectors.toSet());
    }

    private int intersectionSize(Set<Long> left, Set<Long> right) {
        Set<Long> intersection = new HashSet<>(left);
        intersection.retainAll(right);
        return intersection.size();
    }

    private List<String> buildReasons(
            User current,
            User other,
            List<UserOfferedSkill> myOffered,
            List<UserWantedSkill> myWanted,
            List<UserOfferedSkill> otherOffered,
            List<UserWantedSkill> otherWanted
    ) {
        List<String> reasons = new ArrayList<>();
        Set<Long> otherWantedIds = skillIds(otherWanted, item -> item.getSkill().getId());
        Set<Long> otherOfferedIds = skillIds(otherOffered, item -> item.getSkill().getId());

        myOffered.stream()
                .filter(item -> otherWantedIds.contains(item.getSkill().getId()))
                .map(item -> "You can teach " + item.getSkill().getName())
                .distinct()
                .limit(2)
                .forEach(reasons::add);
        myWanted.stream()
                .filter(item -> otherOfferedIds.contains(item.getSkill().getId()))
                .map(item -> "You can learn " + item.getSkill().getName())
                .distinct()
                .limit(2)
                .forEach(reasons::add);

        if (current.getCity() != null && current.getCity().equalsIgnoreCase(
                Optional.ofNullable(other.getCity()).orElse(""))) {
            reasons.add("You are both in " + current.getCity());
        }
        if (other.getRatingAvg() != null && other.getRatingAvg() >= 4.5) {
            reasons.add("Highly rated community member");
        }
        return reasons;
    }
}
