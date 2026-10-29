package com.skillswap.config;

import com.skillswap.entity.MatchEntity;
import com.skillswap.entity.User;
import com.skillswap.security.JwtService;
import com.skillswap.service.MatchService;
import com.skillswap.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

import java.security.Principal;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketChannelInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;
    private final UserService userService;
    private final MatchService matchService;
    private final WebSocketEventListener webSocketEventListener;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
        StompCommand command = accessor.getCommand();

        if (StompCommand.CONNECT.equals(command)) {
            authenticateConnect(message, accessor);
        } else if (StompCommand.SUBSCRIBE.equals(command)) {
            authorizeSubscribe(accessor);
        }

        return message;
    }

    private void authenticateConnect(Message<?> message, StompHeaderAccessor accessor) {
        String token = extractBearerToken(accessor);

        if (token == null || token.isBlank()) {
            log.warn("STOMP CONNECT rejected: missing Authorization header");
            throw new MessagingException("Unauthorized: missing authentication token");
        }

        String email;
        try {
            email = jwtService.extractUsername(token);
        } catch (Exception e) {
            log.warn("STOMP CONNECT rejected: token parse failure");
            throw new MessagingException("Unauthorized: invalid authentication token");
        }

        if (email == null || email.isBlank()) {
            log.warn("STOMP CONNECT rejected: invalid token username");
            throw new MessagingException("Unauthorized: invalid authentication token");
        }

        User user;
        try {
            user = userService.getUserByEmail(email);
        } catch (Exception e) {
            log.warn("STOMP CONNECT rejected: user not found for email={}", email);
            throw new MessagingException("Unauthorized: user not found");
        }

        if (!Boolean.TRUE.equals(user.getEmailVerified())) {
            log.warn("STOMP CONNECT rejected: email is not verified for email={}", email);
            throw new MessagingException("Forbidden: verify your email before using chat or calls");
        }

        Principal principal = new StompPrincipal(email);
        // Set the user on the message's mutable accessor so it propagates to later frames.
        StompHeaderAccessor mutable = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (mutable != null) {
            mutable.setUser(principal);
        } else {
            accessor.setUser(principal);
        }

        String sessionId = accessor.getSessionId();
        if (sessionId != null) {
            webSocketEventListener.registerSessionUser(sessionId, user.getId());
        }

        log.info("STOMP CONNECT authenticated: sessionId={}, userId={}, email={}",
                sessionId, user.getId(), email);
    }

    private void authorizeSubscribe(StompHeaderAccessor accessor) {
        String destination = accessor.getDestination();
        if (destination == null) {
            return;
        }

        Long matchId = parseMatchId(destination);
        if (matchId == null) {
            // Not a per-match topic — nothing match-specific to authorize.
            return;
        }

        Long userId = resolveUserId(accessor);
        if (userId == null) {
            log.warn("STOMP SUBSCRIBE rejected: no authenticated user for destination={}", destination);
            throw new MessagingException("Unauthorized: not authenticated");
        }

        MatchEntity match;
        try {
            match = matchService.getMatch(matchId);
        } catch (Exception e) {
            log.warn("STOMP SUBSCRIBE rejected: match {} not found", matchId);
            throw new MessagingException("Forbidden: match not found");
        }

        boolean participant =
                (match.getUser1() != null && match.getUser1().getId().equals(userId))
                        || (match.getUser2() != null && match.getUser2().getId().equals(userId));

        if (!participant) {
            log.warn("STOMP SUBSCRIBE rejected: userId={} is not a participant of match {}", userId, matchId);
            throw new MessagingException("Forbidden: you are not a participant in this conversation");
        }
    }

    /** Extracts the match id from {@code /topic/chat/{id}} or {@code /topic/call/{id}} destinations. */
    private Long parseMatchId(String destination) {
        String chatPrefix = "/topic/chat/";
        String callPrefix = "/topic/call/";
        String raw = null;
        if (destination.startsWith(chatPrefix)) {
            raw = destination.substring(chatPrefix.length());
        } else if (destination.startsWith(callPrefix)) {
            raw = destination.substring(callPrefix.length());
        }
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return Long.parseLong(raw.split("/")[0]);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Long resolveUserId(StompHeaderAccessor accessor) {
        Long userId = webSocketEventListener.getUserId(accessor.getSessionId());
        if (userId != null) {
            return userId;
        }
        // Fallback to principal name (email) if the session map has no entry.
        Principal principal = accessor.getUser();
        if (principal != null && principal.getName() != null) {
            try {
                return userService.getUserByEmail(principal.getName()).getId();
            } catch (Exception ignored) {
                return null;
            }
        }
        return null;
    }

    private String extractBearerToken(StompHeaderAccessor accessor) {
        List<String> authHeaders = accessor.getNativeHeader("Authorization");
        if (authHeaders == null || authHeaders.isEmpty()) {
            return null;
        }

        String header = authHeaders.get(0);
        if (header == null) {
            return null;
        }

        if (header.startsWith("Bearer ")) {
            return header.substring(7);
        }

        return header;
    }

    private static class StompPrincipal implements Principal {
        private final String name;

        private StompPrincipal(String name) {
            this.name = name;
        }

        @Override
        public String getName() {
            return name;
        }
    }
}
