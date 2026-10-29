package com.skillswap.service;

import com.skillswap.dto.CommonDtos;
import com.skillswap.entity.Chat;
import com.skillswap.entity.MatchEntity;
import com.skillswap.entity.SwapRequest;
import com.skillswap.entity.User;
import com.skillswap.entity.UserOfferedSkill;
import com.skillswap.entity.UserWantedSkill;
import com.skillswap.enums.MatchStatus;
import com.skillswap.enums.NotificationType;
import com.skillswap.enums.RequestStatus;
import com.skillswap.repository.ChatRepository;
import com.skillswap.repository.BlockedUserRepository;
import com.skillswap.repository.MatchEntityRepository;
import com.skillswap.repository.SwapRequestRepository;
import com.skillswap.repository.UserOfferedSkillRepository;
import com.skillswap.repository.UserRepository;
import com.skillswap.repository.UserWantedSkillRepository;
import com.skillswap.security.SecurityUtils;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class SwapRequestService {

    private final SwapRequestRepository repository;
    private final UserRepository userRepository;
    private final UserOfferedSkillRepository offeredRepository;
    private final UserWantedSkillRepository wantedRepository;
    private final NotificationService notificationService;
    private final MatchEntityRepository matchRepository;
    private final ChatRepository chatRepository;
    private final BlockedUserRepository blockedUserRepository;

    @Transactional
    public SwapRequest create(CommonDtos.SwapRequestCreateRequest request, Long senderId) {
        if (request.getReceiverId() == null) {
            throw new IllegalArgumentException("receiverId is required");
        }

        if (senderId.equals(request.getReceiverId())) {
            throw new IllegalArgumentException("You cannot send a swap request to yourself");
        }

        if (blockedUserRepository.existsByBlockerIdAndBlockedUserId(senderId, request.getReceiverId())
                || blockedUserRepository.existsByBlockerIdAndBlockedUserId(request.getReceiverId(), senderId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "A swap request cannot be sent between blocked users");
        }

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new IllegalArgumentException("Sender not found"));

        User receiver = userRepository.findById(request.getReceiverId())
                .orElseThrow(() -> new IllegalArgumentException("Receiver not found"));

        // Check both directions: an active request between these two users in either direction blocks a new one
        boolean duplicate = java.util.stream.Stream.concat(
                        repository.findBySenderId(senderId).stream()
                                .filter(r -> r.getReceiver().getId().equals(request.getReceiverId())),
                        repository.findByReceiverId(senderId).stream()
                                .filter(r -> r.getSender().getId().equals(request.getReceiverId()))
                )
                .anyMatch(r -> r.getStatus() == RequestStatus.PENDING || r.getStatus() == RequestStatus.ACCEPTED);

        if (duplicate) {
            throw new IllegalArgumentException("A swap request already exists with this user");
        }

        UserOfferedSkill senderOffered = request.getSenderOfferedSkillId() != null
                ? offeredRepository.findById(request.getSenderOfferedSkillId())
                .orElseThrow(() -> new IllegalArgumentException("Sender offered skill not found"))
                : null;

        UserWantedSkill senderWanted = request.getSenderWantedSkillId() != null
                ? wantedRepository.findById(request.getSenderWantedSkillId())
                .orElseThrow(() -> new IllegalArgumentException("Sender wanted skill not found"))
                : null;

        UserOfferedSkill receiverOffered = request.getReceiverOfferedSkillId() != null
                ? offeredRepository.findById(request.getReceiverOfferedSkillId())
                .orElseThrow(() -> new IllegalArgumentException("Receiver offered skill not found"))
                : null;

        UserWantedSkill receiverWanted = request.getReceiverWantedSkillId() != null
                ? wantedRepository.findById(request.getReceiverWantedSkillId())
                .orElseThrow(() -> new IllegalArgumentException("Receiver wanted skill not found"))
                : null;

        verifySkillOwner(senderOffered != null ? senderOffered.getUser() : null, senderId,
                "senderOfferedSkillId");
        verifySkillOwner(senderWanted != null ? senderWanted.getUser() : null, senderId,
                "senderWantedSkillId");
        verifySkillOwner(receiverOffered != null ? receiverOffered.getUser() : null, receiver.getId(),
                "receiverOfferedSkillId");
        verifySkillOwner(receiverWanted != null ? receiverWanted.getUser() : null, receiver.getId(),
                "receiverWantedSkillId");

        SwapRequest swapRequest = repository.save(
                SwapRequest.builder()
                        .sender(sender)
                        .receiver(receiver)
                        .senderOfferedSkill(senderOffered)
                        .senderWantedSkill(senderWanted)
                        .receiverOfferedSkill(receiverOffered)
                        .receiverWantedSkill(receiverWanted)
                        .message(normalizeOptionalText(request.getMessage()))
                        .preferredMode(request.getPreferredMode())
                        .proposedAt(request.getProposedAt())
                        .status(RequestStatus.PENDING)
                        .build()
        );

        notificationService.createNotification(
                receiver,
                "New Swap Request from " + sender.getFullName(),
                "You received a swap request for skill exchange",
                NotificationType.REQUEST
        );

        return swapRequest;
    }

    public List<SwapRequest> incoming(Long userId) {
        return repository.findByReceiverId(userId);
    }

    public List<SwapRequest> outgoing(Long userId) {
        return repository.findBySenderId(userId);
    }

    public List<SwapRequest> getAll() {
        return repository.findAll();
    }

    @Transactional
    public SwapRequestStatusResponse updateStatus(Long id, RequestStatus status, Long actingUserId) {
        SwapRequest req = repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Swap request not found"));

        boolean isAdmin = SecurityUtils.isAdmin();
        Long senderId = req.getSender().getId();
        Long receiverId = req.getReceiver().getId();

        // Only PENDING requests can transition; a terminal status is final.
        if (req.getStatus() != RequestStatus.PENDING && !isAdmin) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This request has already been " + req.getStatus().name().toLowerCase());
        }

        // Authorize the acting user for the requested transition (admins bypass).
        if (!isAdmin) {
            switch (status) {
                case ACCEPTED, REJECTED -> {
                    if (!receiverId.equals(actingUserId)) {
                        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                                "Only the request receiver can accept or reject it");
                    }
                }
                case CANCELLED -> {
                    if (!senderId.equals(actingUserId)) {
                        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                                "Only the request sender can cancel it");
                    }
                }
                default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Unsupported status transition: " + status);
            }
        }

        req.setStatus(status);
        SwapRequest updated = repository.save(req);

        Long matchId = null;

        if (status == RequestStatus.ACCEPTED) {
            MatchEntity match = matchRepository.findMatchBetweenUsers(senderId, receiverId)
                    .orElseGet(() -> matchRepository.save(
                            MatchEntity.builder()
                                    .user1(req.getSender())
                                    .user2(req.getReceiver())
                                    .matchScore(50)
                                    .status(MatchStatus.ACTIVE)
                                    .build()
                    ));

            if (match.getStatus() != MatchStatus.ACTIVE) {
                match.setStatus(MatchStatus.ACTIVE);
                match = matchRepository.save(match);
            }

            MatchEntity activeMatch = match;
            chatRepository.findByMatchId(activeMatch.getId())
                    .orElseGet(() -> chatRepository.save(Chat.builder().match(activeMatch).build()));

            matchId = match.getId();

            notificationService.createNotification(
                    req.getSender(),
                    "Swap Request Accepted!",
                    req.getReceiver().getFullName() + " accepted your swap request. You can start chatting now.",
                    NotificationType.MATCH
            );

            notificationService.createNotification(
                    req.getReceiver(),
                    "Match Created!",
                    "You are now matched with " + req.getSender().getFullName() + ". You can start chatting now.",
                    NotificationType.MATCH
            );
        } else {
            notificationService.createNotification(
                    req.getSender(),
                    "Swap Request " + status.name(),
                    "Your swap request has been " + status.name().toLowerCase(),
                    NotificationType.REQUEST
            );
        }

        return new SwapRequestStatusResponse(updated, matchId);
    }

    private void verifySkillOwner(User skillOwner, Long expectedOwnerId, String fieldName) {
        if (skillOwner == null || !expectedOwnerId.equals(skillOwner.getId())) {
            throw new IllegalArgumentException(fieldName + " does not belong to the expected user");
        }
    }

    private String normalizeOptionalText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    @Data
    @AllArgsConstructor
    public static class SwapRequestStatusResponse {
        private SwapRequest request;
        private Long matchId;
    }
}

/*
 * package com.skillswap.service;
 * 
 * import com.skillswap.dto.CommonDtos; import com.skillswap.entity.Chat; import
 * com.skillswap.entity.MatchEntity; import com.skillswap.entity.SwapRequest;
 * import com.skillswap.entity.User; import
 * com.skillswap.entity.UserOfferedSkill; import
 * com.skillswap.entity.UserWantedSkill; import com.skillswap.enums.MatchStatus;
 * import com.skillswap.enums.NotificationType; import
 * com.skillswap.enums.RequestStatus; import
 * com.skillswap.repository.ChatRepository; import
 * com.skillswap.repository.MatchEntityRepository; import
 * com.skillswap.repository.SwapRequestRepository; import
 * com.skillswap.repository.UserOfferedSkillRepository; import
 * com.skillswap.repository.UserRepository; import
 * com.skillswap.repository.UserWantedSkillRepository; import
 * lombok.RequiredArgsConstructor; import
 * org.springframework.stereotype.Service; import
 * org.springframework.transaction.annotation.Transactional;
 * 
 * import java.util.List;
 * 
 * @Service
 * 
 * @RequiredArgsConstructor public class SwapRequestService {
 * 
 * private final SwapRequestRepository repository; private final UserRepository
 * userRepository; private final UserOfferedSkillRepository offeredRepository;
 * private final UserWantedSkillRepository wantedRepository; private final
 * NotificationService notificationService; private final MatchEntityRepository
 * matchRepository; private final ChatRepository chatRepository;
 * 
 * public SwapRequest create(CommonDtos.SwapRequestCreateRequest request, Long
 * senderId) { if (request.getReceiverId() == null) { throw new
 * IllegalArgumentException("receiverId is required"); }
 * 
 * if (senderId.equals(request.getReceiverId())) { throw new
 * IllegalArgumentException("You cannot send a swap request to yourself"); }
 * 
 * User sender = userRepository.findById(senderId) .orElseThrow(() -> new
 * IllegalArgumentException("Sender not found"));
 * 
 * User receiver = userRepository.findById(request.getReceiverId())
 * .orElseThrow(() -> new IllegalArgumentException("Receiver not found"));
 * 
 * boolean duplicate = repository.findBySenderId(senderId).stream() .anyMatch(r
 * -> r.getReceiver().getId().equals(request.getReceiverId()) && r.getStatus()
 * == RequestStatus.PENDING);
 * 
 * if (duplicate) { throw new
 * IllegalArgumentException("You already have a pending swap request with this user"
 * ); }
 * 
 * UserOfferedSkill senderOffered = null; UserWantedSkill senderWanted = null;
 * UserOfferedSkill receiverOffered = null; UserWantedSkill receiverWanted =
 * null;
 * 
 * if (request.getSenderOfferedSkillId() != null) { senderOffered =
 * offeredRepository.findById(request.getSenderOfferedSkillId()) .orElseThrow(()
 * -> new IllegalArgumentException("Sender's offered skill not found")); }
 * 
 * if (request.getSenderWantedSkillId() != null) { senderWanted =
 * wantedRepository.findById(request.getSenderWantedSkillId()) .orElseThrow(()
 * -> new IllegalArgumentException("Sender's wanted skill not found")); }
 * 
 * if (request.getReceiverOfferedSkillId() != null) { receiverOffered =
 * offeredRepository.findById(request.getReceiverOfferedSkillId())
 * .orElseThrow(() -> new
 * IllegalArgumentException("Receiver's offered skill not found")); }
 * 
 * if (request.getReceiverWantedSkillId() != null) { receiverWanted =
 * wantedRepository.findById(request.getReceiverWantedSkillId()) .orElseThrow(()
 * -> new IllegalArgumentException("Receiver's wanted skill not found")); }
 * 
 * SwapRequest swapRequest = repository.save( SwapRequest.builder()
 * .sender(sender) .receiver(receiver) .senderOfferedSkill(senderOffered)
 * .senderWantedSkill(senderWanted) .receiverOfferedSkill(receiverOffered)
 * .receiverWantedSkill(receiverWanted) .message(request.getMessage())
 * .status(RequestStatus.PENDING) .build() );
 * 
 * notificationService.createNotification( receiver, "New Swap Request from " +
 * sender.getFullName(), "You received a swap request for skill exchange",
 * NotificationType.REQUEST );
 * 
 * return swapRequest; }
 * 
 * public List<SwapRequest> incoming(Long userId) { return
 * repository.findByReceiverId(userId); }
 * 
 * public List<SwapRequest> outgoing(Long userId) { return
 * repository.findBySenderId(userId); }
 * 
 * public List<SwapRequest> getAll() { return repository.findAll(); }
 * 
 * @Transactional public SwapRequest updateStatus(Long id, RequestStatus status)
 * { SwapRequest req = repository.findById(id) .orElseThrow(() -> new
 * RuntimeException("Swap request not found: " + id));
 * 
 * req.setStatus(status); SwapRequest updated = repository.save(req);
 * 
 * if (status == RequestStatus.ACCEPTED) { Long senderId =
 * req.getSender().getId(); Long receiverId = req.getReceiver().getId();
 * 
 * MatchEntity match = matchRepository.findMatchBetweenUsers(senderId,
 * receiverId) .orElseGet(() -> matchRepository.save( MatchEntity.builder()
 * .user1(req.getSender()) .user2(req.getReceiver()) .matchScore(50)
 * .status(MatchStatus.ACTIVE) .build() ));
 * 
 * chatRepository.findByMatchId(match.getId()) .orElseGet(() ->
 * chatRepository.save( Chat.builder() .match(match) .build() ));
 * 
 * notificationService.createNotification( req.getSender(),
 * "Swap Request Accepted!", req.getReceiver().getFullName() +
 * " accepted your swap request. You can start chatting now.",
 * NotificationType.MATCH );
 * 
 * notificationService.createNotification( req.getReceiver(), "Match Created!",
 * "You are now matched with " + req.getSender().getFullName() +
 * ". You can start chatting now.", NotificationType.MATCH ); } else {
 * notificationService.createNotification( req.getSender(), "Swap Request " +
 * status.name(), "Your swap request has been " + status.name().toLowerCase(),
 * NotificationType.REQUEST ); }
 * 
 * return updated; } }
 */
