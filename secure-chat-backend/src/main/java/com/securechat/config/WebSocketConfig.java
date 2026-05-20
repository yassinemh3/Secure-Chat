package com.securechat.config;

import com.securechat.security.WebSocketAuthInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Configures Spring WebSocket with STOMP messaging.
 *
 * <ul>
 *   <li>Endpoint: /ws (with SockJS fallback)</li>
 *   <li>Application prefix: /app</li>
 *   <li>Topic prefix: /topic (broadcast)</li>
 *   <li>User queue prefix: /user/queue (private)</li>
 *   <li>JWT authentication via {@link WebSocketAuthInterceptor}</li>
 * </ul>
 */
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final WebSocketAuthInterceptor webSocketAuthInterceptor;

    @Value("${app.websocket.allowed-origins}")
    private String allowedOrigins;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // In-memory broker — use /topic for broadcast, /queue for point-to-point
        registry.enableSimpleBroker("/topic", "/queue");
        // Client sends messages to /app/** → dispatched to @MessageMapping methods
        registry.setApplicationDestinationPrefixes("/app");
        // Routes /user/... messages to the correct user session
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(allowedOrigins.split(","))
                .withSockJS();    // SockJS fallback for older browsers/proxies
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // Authenticate WebSocket connections via JWT in STOMP CONNECT header
        registration.interceptors(webSocketAuthInterceptor);
    }
}
