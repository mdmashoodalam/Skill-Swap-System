package com.skillswap.controller;

import com.skillswap.entity.MatchEntity;
import com.skillswap.service.MatchService;
import com.skillswap.service.UserService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@Slf4j
@RestController
@RequiredArgsConstructor
public class CallSignalController {

    private final SimpMessagingTemplate messagingTemplate;
    private final MatchService matchService;
    private final UserService userService;

    @MessageMapping("/call/{matchId}/signal")
    public void signal(@DestinationVariable Long matchId, SignalMessage message, Principal principal) {
        // Reject signalling from anyone who is not an authenticated participant of the match.
        if (principal == null || principal.getName() == null) {
            log.warn("Dropping call signal for match {}: no authenticated principal", matchId);
            return;
        }

        Long userId;
        try {
            userId = userService.getUserByEmail(principal.getName()).getId();
        } catch (Exception e) {
            log.warn("Dropping call signal for match {}: unknown user {}", matchId, principal.getName());
            return;
        }

        MatchEntity match;
        try {
            match = matchService.getMatch(matchId);
        } catch (Exception e) {
            log.warn("Dropping call signal: match {} not found", matchId);
            return;
        }

        boolean participant =
                (match.getUser1() != null && match.getUser1().getId().equals(userId))
                        || (match.getUser2() != null && match.getUser2().getId().equals(userId));

        if (!participant) {
            log.warn("Dropping call signal for match {}: userId {} is not a participant", matchId, userId);
            return;
        }

        // Stamp the trusted sender id so the payload cannot be spoofed.
        message.setSenderId(userId);
        messagingTemplate.convertAndSend("/topic/call/" + matchId, message);
    }

    @Data
    public static class SignalMessage {
        private String type;
        private Long senderId;
        private Long targetUserId;
        private Object payload;
    }
}