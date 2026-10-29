package com.skillswap.service;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class CallSessionService {

    // userId -> matchId
    private final Map<Long, Long> activeUserCalls = new ConcurrentHashMap<>();

    // matchIds currently in an active call flow
    private final Set<Long> activeMatches = ConcurrentHashMap.newKeySet();

    public boolean isUserBusy(Long userId) {
        if (userId == null) return false;
        return activeUserCalls.containsKey(userId);
    }

    public boolean isMatchActive(Long matchId) {
        if (matchId == null) return false;
        return activeMatches.contains(matchId);
    }

    public synchronized boolean tryStartCall(Long matchId, Long callerId, Long calleeId) {
        if (matchId == null || callerId == null || calleeId == null) {
            return false;
        }

        if (isUserBusy(callerId) || isUserBusy(calleeId) || isMatchActive(matchId)) {
            return false;
        }

        activeUserCalls.put(callerId, matchId);
        activeUserCalls.put(calleeId, matchId);
        activeMatches.add(matchId);
        return true;
    }

    public synchronized void markUserJoined(Long matchId, Long userId) {
        if (matchId == null || userId == null) return;
        activeUserCalls.put(userId, matchId);
        activeMatches.add(matchId);
    }

    public synchronized void endCall(Long matchId, Long userA, Long userB) {
        if (userA != null) {
            activeUserCalls.remove(userA);
        }
        if (userB != null) {
            activeUserCalls.remove(userB);
        }
        if (matchId != null) {
            activeMatches.remove(matchId);
        }
    }

    public synchronized void clearUser(Long userId) {
        if (userId == null) return;

        Long matchId = activeUserCalls.remove(userId);
        if (matchId == null) return;

        boolean stillUsed = activeUserCalls.values().stream()
                .anyMatch(activeMatchId -> activeMatchId.equals(matchId));

        if (!stillUsed) {
            activeMatches.remove(matchId);
        }
    }

    public Long getUserMatch(Long userId) {
        return activeUserCalls.get(userId);
    }
}