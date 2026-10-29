package com.skillswap.service;

import com.skillswap.dto.CommonDtos;
import com.skillswap.entity.Chat;
import com.skillswap.entity.MatchEntity;
import com.skillswap.entity.Message;
import com.skillswap.entity.User;
import com.skillswap.enums.MessageType;
import com.skillswap.exception.ResourceNotFoundException;
import com.skillswap.repository.ChatRepository;
import com.skillswap.repository.MatchEntityRepository;
import com.skillswap.repository.MessageRepository;
import com.skillswap.repository.UserRepository;
import com.skillswap.repository.BlockedUserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private static final Logger logger = LoggerFactory.getLogger(ChatService.class);

    private final ChatRepository chatRepository;
    private final MessageRepository messageRepository;
    private final MatchEntityRepository matchRepository;
    private final UserRepository userRepository;
    private final BlockedUserRepository blockedUserRepository;

    @Transactional
    public Chat getOrCreateChat(Long matchId) {
        return chatRepository.findByMatchId(matchId).orElseGet(() -> {
            MatchEntity match = matchRepository.findById(matchId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Match not found with id: " + matchId));

            logger.info("Creating new Chat for matchId: {}", matchId);

            Chat chat = Chat.builder()
                    .match(match)
                    .build();

            return chatRepository.save(chat);
        });
    }

    @Transactional(readOnly = true)
    public List<CommonDtos.ChatMessageResponse> getMessages(Long matchId) {
        // ✅ A read must not create a chat. If none exists yet, there are no messages.
        Optional<Chat> chat = chatRepository.findByMatchId(matchId);
        if (chat.isEmpty()) {
            return List.of();
        }

        List<Message> messages = messageRepository.findByChatIdOrderByCreatedAtAsc(chat.get().getId());

        logger.info("Fetched {} messages for matchId: {}", messages.size(), matchId);

        return messages.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public CommonDtos.ChatMessageResponse send(CommonDtos.ChatMessageRequest request) {
        logger.info("Saving message from senderId={} in matchId={}",
                request.getSenderId(), request.getMatchId());

        if (request.getMatchId() == null) {
            throw new IllegalArgumentException("matchId must not be null");
        }

        if (request.getSenderId() == null) {
            throw new ResourceNotFoundException("senderId must not be null");
        }

        if (request.getContent() == null || request.getContent().trim().isEmpty()) {
            throw new IllegalArgumentException("Message content must not be empty");
        }

        verifyConversationAllowed(request.getMatchId(), request.getSenderId());

        Chat chat = getOrCreateChat(request.getMatchId());

        User sender = userRepository.findById(request.getSenderId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Sender not found with id: " + request.getSenderId()));

        Message message = Message.builder()
                .chat(chat)
                .sender(sender)
                .content(request.getContent().trim())
                .messageType(MessageType.TEXT)
                .isRead(false)
                .replyTo(resolveReply(request.getReplyToId(), chat.getId()))
                .deleted(false)
                .build();

        Message saved = messageRepository.save(message);

        logger.info("Message saved id={} from user={}", saved.getId(), sender.getFullName());

        return toDto(saved);
    }

    @Transactional
    public CommonDtos.ChatMessageResponse sendAttachment(Long matchId, Long senderId, String attachmentUrl,
                                                          String attachmentName, String contentType,
                                                          String caption, Long replyToId) {
        verifyConversationAllowed(matchId, senderId);
        Chat chat = getOrCreateChat(matchId);
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("Sender not found"));
        Message message = Message.builder()
                .chat(chat)
                .sender(sender)
                .content(caption == null || caption.isBlank() ? null : caption.trim())
                .messageType(contentType != null && contentType.startsWith("image/") ? MessageType.IMAGE : MessageType.FILE)
                .isRead(false)
                .replyTo(resolveReply(replyToId, chat.getId()))
                .deleted(false)
                .attachmentUrl(attachmentUrl)
                .attachmentName(attachmentName)
                .attachmentContentType(contentType)
                .build();
        return toDto(messageRepository.save(message));
    }

    @Transactional
    public CommonDtos.ChatMessageResponse edit(Long matchId, Long messageId, Long actingUserId, String content) {
        if (content == null || content.isBlank()) throw new IllegalArgumentException("Message content must not be empty");
        Message message = getOwnedMessage(matchId, messageId, actingUserId);
        if (Boolean.TRUE.equals(message.getDeleted())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Deleted messages cannot be edited");
        }
        message.setContent(content.trim());
        message.setEditedAt(LocalDateTime.now());
        return toDto(messageRepository.save(message));
    }

    @Transactional
    public CommonDtos.ChatMessageResponse delete(Long matchId, Long messageId, Long actingUserId) {
        Message message = getOwnedMessage(matchId, messageId, actingUserId);
        message.setDeleted(true);
        message.setContent(null);
        message.setAttachmentUrl(null);
        message.setAttachmentName(null);
        message.setAttachmentContentType(null);
        message.setEditedAt(LocalDateTime.now());
        return toDto(messageRepository.save(message));
    }

    @Transactional
    public List<Long> markAsRead(Long matchId, Long readerId) {
        Optional<Chat> chat = chatRepository.findByMatchId(matchId);
        if (chat.isEmpty()) return List.of();
        List<Message> unread = messageRepository.findByChatIdAndIsReadFalseAndSenderIdNot(chat.get().getId(), readerId);
        unread.forEach(message -> message.setIsRead(true));
        messageRepository.saveAll(unread);
        return unread.stream().map(Message::getId).toList();
    }

    private Message resolveReply(Long replyToId, Long chatId) {
        if (replyToId == null) return null;
        Message reply = messageRepository.findById(replyToId)
                .orElseThrow(() -> new ResourceNotFoundException("Reply message not found"));
        if (!reply.getChat().getId().equals(chatId)) {
            throw new IllegalArgumentException("Reply message belongs to another conversation");
        }
        return reply;
    }

    private Message getOwnedMessage(Long matchId, Long messageId, Long actingUserId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));
        if (!message.getChat().getMatch().getId().equals(matchId)) {
            throw new IllegalArgumentException("Message belongs to another conversation");
        }
        if (!message.getSender().getId().equals(actingUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only modify your own messages");
        }
        return message;
    }

    private void verifyConversationAllowed(Long matchId, Long senderId) {
        MatchEntity match = matchRepository.findById(matchId)
                .orElseThrow(() -> new ResourceNotFoundException("Match not found"));
        Long otherId = match.getUser1().getId().equals(senderId) ? match.getUser2().getId() : match.getUser1().getId();
        boolean blocked = blockedUserRepository.existsByBlockerIdAndBlockedUserId(senderId, otherId)
                || blockedUserRepository.existsByBlockerIdAndBlockedUserId(otherId, senderId);
        if (blocked) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Messaging is unavailable because one user blocked the other");
    }

    private CommonDtos.ChatMessageResponse toDto(Message message) {
        User sender = message.getSender();

        CommonDtos.ReplyPreview replyPreview = message.getReplyTo() == null ? null : new CommonDtos.ReplyPreview(
                message.getReplyTo().getId(),
                message.getReplyTo().getSender().getFullName(),
                Boolean.TRUE.equals(message.getReplyTo().getDeleted()) ? "Message deleted" : message.getReplyTo().getContent()
        );

        return new CommonDtos.ChatMessageResponse(
                message.getId(),
                new CommonDtos.UserSummary(
                        sender.getId(),
                        sender.getFullName() != null ? sender.getFullName() : "Unknown",
                        sender.getProfilePhotoUrl(),
                        sender.getRatingAvg() != null ? sender.getRatingAvg() : 0.0
                ),
                message.getContent(),
                message.getCreatedAt(),
                message.getIsRead() != null ? message.getIsRead() : false,
                message.getMessageType() != null ? message.getMessageType().name() : "TEXT",
                replyPreview,
                message.getEditedAt(),
                Boolean.TRUE.equals(message.getDeleted()),
                message.getAttachmentUrl(),
                message.getAttachmentName(),
                message.getAttachmentContentType()
        );
    }
}
