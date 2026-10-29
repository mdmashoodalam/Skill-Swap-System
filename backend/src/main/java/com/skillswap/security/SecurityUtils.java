package com.skillswap.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Small helper for reading the current authentication from the SecurityContext.
 * Authorities are populated by {@code JwtAuthFilter} as {@code ROLE_USER} / {@code ROLE_ADMIN}.
 */
public final class SecurityUtils {

    private SecurityUtils() {
    }

    /** @return the authenticated principal's username (email), or {@code null} if unauthenticated. */
    public static String getCurrentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return null;
        }
        return auth.getName();
    }

    /** @return {@code true} if the current authentication holds the {@code ROLE_ADMIN} authority. */
    public static boolean isAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return false;
        }
        return auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }
}
