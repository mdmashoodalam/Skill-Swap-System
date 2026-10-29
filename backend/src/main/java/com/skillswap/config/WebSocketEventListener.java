package com.skillswap.config;

import com.skillswap.service.CallSessionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.Message;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketEventListener {

    private final CallSessionService callSessionService;

    // websocket sessionId -> userId
    private final Map<String, Long> sessionUserMap = new ConcurrentHashMap<>();

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectEvent event) {
        try {
            Message<?> message = event.getMessage();
            StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
            Principal user = accessor.getUser();

            if (user == null || user.getName() == null) {
                return;
            }

            String sessionId = accessor.getSessionId();
            if (sessionId == null) {
                return;
            }

            String principalName = user.getName();

            // If your Principal name is email in JWT auth, frontend should later map this to userId.
            // For now, we only log it here. Real cleanup by exact userId will happen if you enrich the session.
            log.info("WebSocket connected: sessionId={}, principal={}", sessionId, principalName);
        } catch (Exception e) {
            log.error("Error while handling WebSocket connect event", e);
        }
    }

    // Optional helper if later you want to register sessionId -> userId explicitly from interceptor/controller
    public void registerSessionUser(String sessionId, Long userId) {
        if (sessionId != null && userId != null) {
            sessionUserMap.put(sessionId, userId);
        }
    }

    /** @return the userId bound to this websocket session at CONNECT time, or {@code null} if unknown. */
    public Long getUserId(String sessionId) {
        return sessionId == null ? null : sessionUserMap.get(sessionId);
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        try {
            StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
            String sessionId = accessor.getSessionId();

            if (sessionId == null) {
                return;
            }

            Long userId = sessionUserMap.remove(sessionId);
            if (userId != null) {
                callSessionService.clearUser(userId);
                log.info("WebSocket disconnected: sessionId={}, cleaned userId={}", sessionId, userId);
            } else {
                log.info("WebSocket disconnected: sessionId={}, no mapped userId found", sessionId);
            }
        } catch (Exception e) {
            log.error("Error while handling WebSocket disconnect event", e);
        }
    }
}