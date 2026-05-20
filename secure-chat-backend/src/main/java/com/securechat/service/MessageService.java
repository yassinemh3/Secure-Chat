package com.securechat.service;

import com.securechat.dto.request.SendMessageRequest;
import com.securechat.dto.response.MessageDto;
import com.securechat.dto.response.PagedResponse;
import com.securechat.entity.Message;
import com.securechat.entity.User;
import com.securechat.enums.ContentType;
import com.securechat.exception.ResourceNotFoundException;
import com.securechat.exception.RoomAccessException;
import com.securechat.mapper.MessageMapper;
import com.securechat.repository.MessageRepository;
import com.securechat.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.owasp.html.HtmlPolicyBuilder;
import org.owasp.html.PolicyFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final ChatRoomService chatRoomService;
    private final MessageMapper messageMapper;

    /** OWASP sanitizer policy: allow only plain text (strips all HTML tags). */
    private static final PolicyFactory SANITIZER = new HtmlPolicyBuilder().toFactory();

    @Transactional
    public MessageDto sendMessage(SendMessageRequest req, UUID senderId) {
        chatRoomService.assertMember(req.roomId(), senderId);

        // Sanitize content to prevent XSS
        String sanitized = SANITIZER.sanitize(req.content());

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("User", senderId));

        Message.MessageBuilder builder = Message.builder()
                .room(chatRoomService.getRoomEntity(req.roomId()))
                .sender(sender)
                .content(sanitized)
                .contentType(req.contentType() != null ? req.contentType() : ContentType.TEXT);

        if (req.replyToId() != null) {
            messageRepository.findById(req.replyToId())
                    .ifPresent(builder::replyTo);
        }

        Message saved = messageRepository.save(builder.build());
        return messageMapper.toDto(saved);
    }

    @Transactional(readOnly = true)
    public PagedResponse<MessageDto> getMessages(UUID roomId, UUID userId, int page, int size) {
        chatRoomService.assertMember(roomId, userId);
        Page<Message> result = messageRepository.findByRoomId(roomId, PageRequest.of(page, size));
        return new PagedResponse<>(
                result.getContent().stream().map(messageMapper::toDto).collect(Collectors.toList()),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages(),
                result.isLast()
        );
    }

    @Transactional
    public MessageDto editMessage(UUID messageId, String newContent, UUID editorId) {
        Message msg = getMessageOrThrow(messageId);
        assertSender(msg, editorId);
        msg.setContent(SANITIZER.sanitize(newContent));
        msg.setEdited(true);
        return messageMapper.toDto(messageRepository.save(msg));
    }

    @Transactional
    public void deleteMessage(UUID messageId, UUID requesterId) {
        Message msg = getMessageOrThrow(messageId);
        assertSender(msg, requesterId);
        msg.setDeleted(true);
        msg.setContent("[Message deleted]");
        messageRepository.save(msg);
    }

    @Transactional(readOnly = true)
    public PagedResponse<MessageDto> searchMessages(UUID userId, String query, int page, int size) {
        Page<Message> result = messageRepository.searchMessages(userId, query, PageRequest.of(page, size));
        return new PagedResponse<>(
                result.getContent().stream().map(messageMapper::toDto).collect(Collectors.toList()),
                result.getNumber(), result.getSize(),
                result.getTotalElements(), result.getTotalPages(), result.isLast()
        );
    }

    private Message getMessageOrThrow(UUID id) {
        return messageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Message", id));
    }

    private void assertSender(Message msg, UUID userId) {
        if (!msg.getSender().getId().equals(userId)) {
            throw new RoomAccessException("You can only modify your own messages");
        }
    }
}
