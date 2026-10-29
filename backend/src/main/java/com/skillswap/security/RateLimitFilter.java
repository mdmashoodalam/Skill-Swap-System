package com.skillswap.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Lightweight per-instance fixed-window throttling. For a multi-instance deployment,
 * replace the in-memory store with a shared Redis-backed limiter.
 */
public class RateLimitFilter extends OncePerRequestFilter {

    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    @Value("${app.rate-limit.enabled:true}")
    private boolean enabled;

    @Value("${app.rate-limit.auth-per-minute:15}")
    private int authLimit;

    @Value("${app.rate-limit.api-per-minute:180}")
    private int apiLimit;

    @Value("${app.rate-limit.trust-forwarded-header:false}")
    private boolean trustForwardedHeader;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String path = request.getRequestURI();
        if (!enabled || "OPTIONS".equalsIgnoreCase(request.getMethod()) || !path.startsWith("/api/")) {
            filterChain.doFilter(request, response);
            return;
        }

        boolean authRequest = path.startsWith("/api/auth/");
        int limit = authRequest ? authLimit : apiLimit;
        String key = clientAddress(request) + (authRequest ? ":auth" : ":api");
        long minute = Instant.now().getEpochSecond() / 60;

        Window current = windows.compute(key, (ignored, existing) -> {
            if (existing == null || existing.minute() != minute) {
                return new Window(minute, 1);
            }
            return new Window(minute, existing.count() + 1);
        });

        response.setHeader("X-RateLimit-Limit", String.valueOf(limit));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(Math.max(0, limit - current.count())));
        if (current.count() > limit) {
            response.setStatus(429);
            response.setHeader("Retry-After", String.valueOf(60 - (Instant.now().getEpochSecond() % 60)));
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"error\":\"Too many requests. Please try again shortly.\"}");
            return;
        }

        if (windows.size() > 10_000) {
            windows.entrySet().removeIf(entry -> entry.getValue().minute() < minute - 1);
        }
        filterChain.doFilter(request, response);
    }

    private String clientAddress(HttpServletRequest request) {
        if (trustForwardedHeader) {
            String forwarded = request.getHeader("X-Forwarded-For");
            if (forwarded != null && !forwarded.isBlank()) {
                return forwarded.split(",", 2)[0].trim();
            }
        }
        return request.getRemoteAddr();
    }

    private record Window(long minute, int count) {}
}
