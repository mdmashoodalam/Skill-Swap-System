package com.skillswap.controller;

import com.skillswap.dto.CommonDtos;
import com.skillswap.entity.MatchEntity;
import com.skillswap.service.ChatService;
import com.skillswap.service.MatchService;
import com.skillswap.service.UserService;
import com.skillswap.util.UploadContentValidator;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/chats")
@RequiredArgsConstructor
public class ChatController {

    private static final long MAX_CHAT_ATTACHMENT_BYTES = 5L * 1024 * 1024;

    private final ChatService chatService;
    private final MatchService matchService;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserService userService;

    @Value("${app.upload.directory:uploads}")
    private String uploadBaseDir;

    private static final Map<String, String> ATTACHMENT_TYPES = Map.of(
            "image/jpeg", "jpg", "image/png", "png", "image/webp", "webp",
            "application/pdf", "pdf", "text/plain", "txt"
    );

    @GetMapping("/{matchId}/messages")
    public List<CommonDtos.ChatMessageResponse> getMessages(@PathVariable Long matchId) {
        Long currentUserId = getAuthenticatedUserId();
        authorizeMatchParticipant(matchId, currentUserId);
        List<Long> readIds = chatService.markAsRead(matchId, currentUserId);
        if (!readIds.isEmpty()) {
            messagingTemplate.convertAndSend("/topic/chat/" + matchId + "/read",
                    Map.of("readerId", currentUserId, "messageIds", readIds));
        }
        return chatService.getMessages(matchId);
    }

    @PostMapping("/{matchId}/messages")
    public CommonDtos.ChatMessageResponse sendMessage(@PathVariable Long matchId,
                                                      @Valid @RequestBody CommonDtos.ChatMessageRequest request) {
        Long currentUserId = getAuthenticatedUserId();
        authorizeMatchParticipant(matchId, currentUserId);

        request.setSenderId(currentUserId);
        request.setMatchId(matchId);

        CommonDtos.ChatMessageResponse response = chatService.send(request);
        messagingTemplate.convertAndSend("/topic/chat/" + matchId, response);
        return response;
    }

    @PatchMapping("/{matchId}/messages/{messageId}")
    public CommonDtos.ChatMessageResponse editMessage(@PathVariable Long matchId, @PathVariable Long messageId,
                                                       @Valid @RequestBody CommonDtos.ChatMessageRequest request) {
        Long userId = getAuthenticatedUserId();
        authorizeMatchParticipant(matchId, userId);
        CommonDtos.ChatMessageResponse response = chatService.edit(matchId, messageId, userId, request.getContent());
        messagingTemplate.convertAndSend("/topic/chat/" + matchId, response);
        return response;
    }

    @DeleteMapping("/{matchId}/messages/{messageId}")
    public CommonDtos.ChatMessageResponse deleteMessage(@PathVariable Long matchId, @PathVariable Long messageId) {
        Long userId = getAuthenticatedUserId();
        authorizeMatchParticipant(matchId, userId);
        CommonDtos.ChatMessageResponse response = chatService.delete(matchId, messageId, userId);
        messagingTemplate.convertAndSend("/topic/chat/" + matchId, response);
        return response;
    }

    @PatchMapping("/{matchId}/read")
    public List<Long> markRead(@PathVariable Long matchId) {
        Long userId = getAuthenticatedUserId();
        authorizeMatchParticipant(matchId, userId);
        List<Long> ids = chatService.markAsRead(matchId, userId);
        if (!ids.isEmpty()) messagingTemplate.convertAndSend("/topic/chat/" + matchId + "/read",
                Map.of("readerId", userId, "messageIds", ids));
        return ids;
    }

    @PostMapping("/{matchId}/attachments")
    public CommonDtos.ChatMessageResponse uploadAttachment(@PathVariable Long matchId,
                                                            @RequestParam("file") MultipartFile file,
                                                            @RequestParam(required = false) String caption,
                                                            @RequestParam(required = false) Long replyToId) throws IOException {
        Long userId = getAuthenticatedUserId();
        authorizeMatchParticipant(matchId, userId);
        String contentType = UploadContentValidator.normalizeMediaType(file.getContentType());
        String extension = ATTACHMENT_TYPES.get(contentType);
        if (file.isEmpty() || extension == null || file.getSize() > MAX_CHAT_ATTACHMENT_BYTES) {
            throw new IllegalArgumentException("Only JPEG, PNG, WebP, PDF, and text files are supported");
        }
        byte[] content = file.getBytes();
        if (!UploadContentValidator.isSupportedAttachment(contentType, content)) {
            throw new IllegalArgumentException("The uploaded file does not match its allowed file type");
        }
        Path directory = Paths.get(uploadBaseDir, "chat-attachments").toAbsolutePath().normalize();
        Files.createDirectories(directory);
        String storedName = UUID.randomUUID() + "." + extension;
        Path target = directory.resolve(storedName).normalize();
        if (!target.startsWith(directory)) throw new IllegalArgumentException("Invalid attachment path");
        Files.write(target, content);
        String originalName = file.getOriginalFilename() == null ? "attachment." + extension
                : Paths.get(file.getOriginalFilename()).getFileName().toString();
        CommonDtos.ChatMessageResponse response = chatService.sendAttachment(matchId, userId,
                "/uploads/chat-attachments/" + storedName, originalName, contentType, caption, replyToId);
        messagingTemplate.convertAndSend("/topic/chat/" + matchId, response);
        return response;
    }

    @MessageMapping("/chat/{matchId}/typing")
    public void typing(@DestinationVariable Long matchId, Map<String, Object> payload, Principal principal) {
        if (principal == null) return;
        Long userId = userService.getUserByEmail(principal.getName()).getId();
        authorizeMatchParticipant(matchId, userId);
        messagingTemplate.convertAndSend("/topic/chat/" + matchId + "/typing",
                Map.of("userId", userId, "typing", Boolean.TRUE.equals(payload.get("typing"))));
    }

    private Long getAuthenticatedUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return userService.getUserByEmail(auth.getName()).getId();
    }

    private void authorizeMatchParticipant(Long matchId, Long userId) {
        MatchEntity match = matchService.getMatch(matchId);
        boolean allowed =
                match.getUser1().getId().equals(userId) ||
                match.getUser2().getId().equals(userId);

        if (!allowed) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not a participant in this match");
        }
    }
}

/*
 * package com.skillswap.controller;
 * 
 * import com.skillswap.dto.CommonDtos; import
 * com.skillswap.service.ChatService; import com.skillswap.service.UserService;
 * import lombok.RequiredArgsConstructor; import
 * org.springframework.messaging.simp.SimpMessagingTemplate; import
 * org.springframework.security.core.Authentication; import
 * org.springframework.security.core.context.SecurityContextHolder; import
 * org.springframework.web.bind.annotation.*;
 * 
 * import java.util.List;
 * 
 * @RestController
 * 
 * @RequestMapping("/api/chats")
 * 
 * @RequiredArgsConstructor public class ChatController {
 * 
 * private final ChatService chatService; private final SimpMessagingTemplate
 * messagingTemplate; private final UserService userService;
 * 
 * // ✅ GET message history for a match
 * 
 * @GetMapping("/{matchId}/messages") public
 * List<CommonDtos.ChatMessageResponse> getMessages(
 * 
 * @PathVariable Long matchId) { return chatService.getMessages(matchId); }
 * 
 * // ✅ POST send a message — saves to DB and broadcasts via WebSocket
 * 
 * @PostMapping("/{matchId}/messages") public CommonDtos.ChatMessageResponse
 * sendMessage(
 * 
 * @PathVariable Long matchId,
 * 
 * @RequestBody CommonDtos.ChatMessageRequest request) {
 * 
 * // ✅ If senderId not provided in body, resolve from JWT if
 * (request.getSenderId() == null) { Authentication auth =
 * SecurityContextHolder.getContext().getAuthentication(); Long userId =
 * userService.getUserByEmail(auth.getName()).getId();
 * request.setSenderId(userId); }
 * 
 * request.setMatchId(matchId);
 * 
 * // Save to DB CommonDtos.ChatMessageResponse response =
 * chatService.send(request);
 * 
 * // ✅ Broadcast via WebSocket so both users receive it in real-time
 * messagingTemplate.convertAndSend("/topic/chat/" + matchId, response);
 * 
 * return response; } }
 */
