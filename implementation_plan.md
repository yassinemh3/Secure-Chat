# Secure-Chat — Full-Stack Implementation Plan

A scalable, production-ready real-time messaging platform built with Spring Boot 3 + Angular 18, secured with JWT, deployed via Docker/Nginx.

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENTS                             │
│          Browser (Angular SPA + WebSocket/STOMP)            │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTPS / WSS
                    ┌────────▼────────┐
                    │   Nginx Reverse  │
                    │      Proxy       │
                    └────────┬────────┘
              ┌──────────────┴──────────────┐
              │ HTTP REST                   │ WS /ws
    ┌─────────▼──────────┐     ┌────────────▼───────────┐
    │  Spring Boot API   │     │  Spring WebSocket/STOMP │
    │  (Port 8080)       │     │  (STOMP broker relay)   │
    └─────────┬──────────┘     └────────────┬────────────┘
              │                             │
    ┌─────────▼─────────────────────────────▼────────────┐
    │              Spring Security + JWT Filter           │
    └─────────┬───────────────────────────────────────────┘
              │
    ┌─────────▼──────────┐   ┌──────────────────────┐
    │   PostgreSQL DB     │   │  In-Memory STOMP     │
    │   (Port 5432)       │   │  Message Broker      │
    └─────────────────────┘   └──────────────────────┘
```

**Key design decisions:**
- Spring Boot exposes both REST APIs and a STOMP WebSocket endpoint on the same port
- Nginx terminates TLS and proxies to both
- JWT tokens authenticate both HTTP and WebSocket connections
- PostgreSQL stores all persistent data; in-memory STOMP broker handles real-time routing

---

## 2. Database Schema

### Entity Relationship Diagram (Logical)

```
users ──< room_memberships >── chat_rooms
  │                                │
  └──< messages ──────────────────►┘
  │
  ├──< refresh_tokens
  ├──< notifications
  └──< user_presence
```

### Tables

#### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| username | VARCHAR(50) UNIQUE NOT NULL | |
| email | VARCHAR(255) UNIQUE NOT NULL | |
| password_hash | VARCHAR(255) NOT NULL | BCrypt |
| display_name | VARCHAR(100) | |
| avatar_url | VARCHAR(500) | |
| role | ENUM(USER, ADMIN) | |
| is_active | BOOLEAN DEFAULT true | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

#### `chat_rooms`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| name | VARCHAR(100) | null for DMs |
| description | TEXT | |
| type | ENUM(DIRECT, GROUP) | |
| created_by | UUID FK users.id | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

#### `room_memberships`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| room_id | UUID FK chat_rooms.id | |
| user_id | UUID FK users.id | |
| role | ENUM(MEMBER, ADMIN, OWNER) | |
| joined_at | TIMESTAMP | |
| last_read_at | TIMESTAMP | |
| UNIQUE(room_id, user_id) | | |

#### `messages`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| room_id | UUID FK chat_rooms.id | |
| sender_id | UUID FK users.id | |
| content | TEXT NOT NULL | |
| content_type | ENUM(TEXT, IMAGE, FILE) | |
| is_encrypted | BOOLEAN DEFAULT false | |
| is_edited | BOOLEAN DEFAULT false | |
| is_deleted | BOOLEAN DEFAULT false | |
| reply_to_id | UUID FK messages.id | nullable |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

#### `message_receipts`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| message_id | UUID FK messages.id | |
| user_id | UUID FK users.id | |
| status | ENUM(DELIVERED, READ) | |
| timestamp | TIMESTAMP | |
| UNIQUE(message_id, user_id) | | |

#### `refresh_tokens`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| token | VARCHAR(512) UNIQUE NOT NULL | |
| user_id | UUID FK users.id | |
| expires_at | TIMESTAMP | |
| revoked | BOOLEAN DEFAULT false | |
| created_at | TIMESTAMP | |

#### `notifications`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK users.id | |
| type | VARCHAR(50) | |
| payload | JSONB | |
| is_read | BOOLEAN DEFAULT false | |
| created_at | TIMESTAMP | |

#### `user_presence`
| Column | Type | Notes |
|--------|------|-------|
| user_id | UUID PK FK users.id | |
| status | ENUM(ONLINE, OFFLINE, AWAY) | |
| last_seen | TIMESTAMP | |

---

## 3. Backend Folder Structure

```
secure-chat-backend/
├── pom.xml
├── Dockerfile
└── src/
    └── main/
        ├── java/com/securechat/
        │   ├── SecureChatApplication.java
        │   ├── config/
        │   │   ├── SecurityConfig.java
        │   │   ├── WebSocketConfig.java
        │   │   ├── JwtConfig.java
        │   │   └── CorsConfig.java
        │   ├── controller/
        │   │   ├── AuthController.java
        │   │   ├── UserController.java
        │   │   ├── ChatRoomController.java
        │   │   ├── MessageController.java
        │   │   └── WebSocketController.java
        │   ├── service/
        │   │   ├── AuthService.java
        │   │   ├── UserService.java
        │   │   ├── ChatRoomService.java
        │   │   ├── MessageService.java
        │   │   ├── JwtService.java
        │   │   ├── PresenceService.java
        │   │   └── NotificationService.java
        │   ├── repository/
        │   │   ├── UserRepository.java
        │   │   ├── ChatRoomRepository.java
        │   │   ├── RoomMembershipRepository.java
        │   │   ├── MessageRepository.java
        │   │   ├── MessageReceiptRepository.java
        │   │   ├── RefreshTokenRepository.java
        │   │   └── NotificationRepository.java
        │   ├── entity/
        │   │   ├── User.java
        │   │   ├── ChatRoom.java
        │   │   ├── RoomMembership.java
        │   │   ├── Message.java
        │   │   ├── MessageReceipt.java
        │   │   ├── RefreshToken.java
        │   │   └── Notification.java
        │   ├── dto/
        │   │   ├── request/
        │   │   │   ├── RegisterRequest.java
        │   │   │   ├── LoginRequest.java
        │   │   │   ├── SendMessageRequest.java
        │   │   │   └── CreateRoomRequest.java
        │   │   └── response/
        │   │       ├── AuthResponse.java
        │   │       ├── UserDto.java
        │   │       ├── MessageDto.java
        │   │       ├── ChatRoomDto.java
        │   │       └── PagedResponse.java
        │   ├── security/
        │   │   ├── JwtAuthenticationFilter.java
        │   │   ├── JwtTokenProvider.java
        │   │   ├── UserDetailsServiceImpl.java
        │   │   └── WebSocketAuthInterceptor.java
        │   ├── exception/
        │   │   ├── GlobalExceptionHandler.java
        │   │   ├── ResourceNotFoundException.java
        │   │   ├── UnauthorizedException.java
        │   │   └── ValidationException.java
        │   ├── mapper/
        │   │   ├── UserMapper.java
        │   │   ├── MessageMapper.java
        │   │   └── ChatRoomMapper.java
        │   └── enums/
        │       ├── UserRole.java
        │       ├── RoomType.java
        │       └── MessageStatus.java
        └── resources/
            ├── application.yml
            ├── application-dev.yml
            ├── application-prod.yml
            └── db/migration/
                ├── V1__create_users.sql
                ├── V2__create_chat_rooms.sql
                ├── V3__create_messages.sql
                ├── V4__create_tokens_notifications.sql
                ├── V5__change_enum_columns_to_varchar.sql 
```

---

## 4. Angular Frontend Folder Structure

```
secure-chat-frontend/
├── angular.json
├── package.json
├── Dockerfile
├── nginx.conf
└── src/
    ├── index.html
    ├── main.ts
    ├── styles.scss
    └── app/
        ├── app.config.ts
        ├── app.routes.ts
        ├── core/
        │   ├── guards/
        │   │   ├── auth.guard.ts
        │   │   └── role.guard.ts
        │   ├── interceptors/
        │   │   ├── jwt.interceptor.ts
        │   │   └── error.interceptor.ts
        │   ├── services/
        │   │   ├── auth.service.ts
        │   │   ├── user.service.ts
        │   │   ├── chat.service.ts
        │   │   ├── websocket.service.ts
        │   │   ├── notification.service.ts
        │   │   └── theme.service.ts
        │   └── models/
        │       ├── user.model.ts
        │       ├── message.model.ts
        │       ├── chat-room.model.ts
        │       └── auth.model.ts
        ├── features/
        │   ├── auth/
        │   │   ├── login/
        │   │   │   ├── login.component.ts
        │   │   │   └── login.component.html
        │   │   └── register/
        │   │       ├── register.component.ts
        │   │       └── register.component.html
        │   ├── chat/
        │   │   ├── chat.component.ts
        │   │   ├── chat.component.html
        │   │   ├── chat-sidebar/
        │   │   │   ├── chat-sidebar.component.ts
        │   │   │   └── chat-sidebar.component.html
        │   │   ├── chat-window/
        │   │   │   ├── chat-window.component.ts
        │   │   │   └── chat-window.component.html
        │   │   ├── message-bubble/
        │   │   │   ├── message-bubble.component.ts
        │   │   │   └── message-bubble.component.html
        │   │   └── typing-indicator/
        │   │       └── typing-indicator.component.ts
        │   └── profile/
        │       ├── profile.component.ts
        │       └── profile.component.html
        └── shared/
            ├── components/
            │   ├── navbar/
            │   ├── avatar/
            │   ├── loading-spinner/
            │   └── confirm-dialog/
            └── pipes/
                ├── time-ago.pipe.ts
                └── truncate.pipe.ts
```

---

## 5. Authentication Flow

```
REGISTER:
  Client → POST /api/v1/auth/register {username, email, password}
         → Server validates, hashes password (BCrypt, strength 12)
         → Saves user to DB
         → Returns 201 Created

LOGIN:
  Client → POST /api/v1/auth/login {email, password}
         → Server authenticates credentials
         → Issues JWT access token (15 min TTL) + refresh token (7 days)
         → Refresh token stored in DB, returned as HttpOnly cookie
         → Access token returned in response body
         → Client stores access token in memory (NOT localStorage)

AUTHENTICATED REQUEST:
  Client → HTTP request with header: Authorization: Bearer <access_token>
         → JwtAuthenticationFilter extracts & validates token
         → Sets SecurityContext with UserDetails

TOKEN REFRESH:
  Client → POST /api/v1/auth/refresh (HttpOnly cookie auto-sent)
         → Server validates refresh token in DB
         → Issues new access token + rotates refresh token
         → Returns new access token

LOGOUT:
  Client → POST /api/v1/auth/logout
         → Server revokes refresh token in DB
         → Clears HttpOnly cookie
```

---

## 6. WebSocket / STOMP Communication Flow

```
CONNECTION:
  1. Client connects to ws://host/ws?token=<access_token>
  2. WebSocketAuthInterceptor validates JWT from query param
  3. STOMP CONNECT frame sent; server confirms CONNECTED

SUBSCRIPTIONS (after connect):
  Client subscribes to:
  - /user/queue/messages      → private messages for this user
  - /topic/room/{roomId}      → broadcast messages in a room
  - /user/queue/presence      → presence updates
  - /user/queue/typing        → typing indicators
  - /user/queue/notifications → notifications

SENDING A MESSAGE:
  Client → STOMP SEND /app/chat.send
         { roomId, content, contentType }
  Server → validates, saves to DB, broadcasts to /topic/room/{roomId}
         → sends receipt to sender via /user/queue/messages

TYPING INDICATOR:
  Client → STOMP SEND /app/chat.typing { roomId, typing: true }
  Server → broadcasts to /topic/room/{roomId}/typing (excluding sender)

PRESENCE:
  On WS connect → server marks user ONLINE, broadcasts to room members
  On WS disconnect → server marks user OFFLINE, broadcasts
```

---

## 7. REST API Design

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/auth/register | Register new user |
| POST | /api/v1/auth/login | Login, get tokens |
| POST | /api/v1/auth/refresh | Refresh access token |
| POST | /api/v1/auth/logout | Revoke refresh token |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/users/me | Get current user profile |
| PUT | /api/v1/users/me | Update profile |
| GET | /api/v1/users/{id} | Get user by ID |
| GET | /api/v1/users/search?q= | Search users |

### Chat Rooms
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/rooms | Create room (group/DM) |
| GET | /api/v1/rooms | List rooms for current user |
| GET | /api/v1/rooms/{id} | Get room details |
| PUT | /api/v1/rooms/{id} | Update room info |
| DELETE | /api/v1/rooms/{id} | Delete room (owner only) |
| POST | /api/v1/rooms/{id}/members | Add member |
| DELETE | /api/v1/rooms/{id}/members/{userId} | Remove member |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/rooms/{id}/messages | Paginated message history |
| DELETE | /api/v1/messages/{id} | Delete message |
| PUT | /api/v1/messages/{id} | Edit message |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/notifications | Get unread notifications |
| PUT | /api/v1/notifications/{id}/read | Mark as read |

---

## 8. Security Configuration Highlights

### Spring Security
- Stateless session (SessionCreationPolicy.STATELESS)
- CSRF disabled for REST (SameSite=Strict cookie protects refresh token)
- Public endpoints: `/api/v1/auth/**`, `/ws/**`, `/actuator/health`
- All other endpoints require authentication
- Method-level security with `@PreAuthorize`

### JWT
- Algorithm: RS256 (RSA key pair) or HS256 with strong secret
- Access token TTL: 15 minutes
- Refresh token TTL: 7 days, stored in DB, rotated on use
- Token stored in memory on client (not localStorage)

### WebSocket
- JWT validated in STOMP CONNECT interceptor
- Users can only send to rooms they are members of
- Rate limiting on message endpoints

### Input Validation
- Bean Validation (Jakarta Validation) on all DTOs
- `@Size`, `@NotBlank`, `@Email` constraints
- Message content sanitized with OWASP HTML Sanitizer (XSS prevention)

### CORS
- Strict origin whitelist configured via environment variable
- Credentials allowed for cookie-based refresh token

---

## 9. Docker & Nginx Setup

### Docker Compose Services
```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment: POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD
    volumes: postgres_data:/var/lib/postgresql/data
    ports: [5432:5432]

  backend:
    build: ./secure-chat-backend
    environment: DATABASE_URL, JWT_SECRET, CORS_ORIGIN
    depends_on: [postgres]
    ports: [8080:8080]

  frontend:
    build: ./secure-chat-frontend
    ports: [80:80]

  nginx:
    image: nginx:alpine
    volumes: ./nginx/nginx.conf, ./nginx/ssl/
    ports: [443:443, 80:80]
    depends_on: [backend, frontend]
```

### Nginx Routing
- `/` → Angular frontend (static files)
- `/api/` → Spring Boot backend (HTTP proxy)
- `/ws` → Spring Boot backend (WebSocket upgrade proxy)
- Redirect HTTP → HTTPS
- TLS certificate via Let's Encrypt (or self-signed for dev)

---

## 10. Step-by-Step Development Roadmap

### Phase 1 — Project Setup (Day 1–2)
- [ ] Initialize Spring Boot project with Maven (Spring Initializr)
- [ ] Initialize Angular project with Angular CLI
- [ ] Configure PostgreSQL with Docker Compose
- [ ] Set up Flyway DB migrations
- [ ] Create basic project structure

### Phase 2 — Backend Core (Day 3–5)
- [ ] Implement all JPA entities and repositories
- [ ] Configure Spring Security (stateless, JWT filter)
- [ ] Implement JWT service (issue, validate, refresh)
- [ ] Implement Auth endpoints (register, login, refresh, logout)
- [ ] Write unit tests for auth service

### Phase 3 — Chat Backend (Day 6–8)
- [ ] Implement ChatRoom and Message entities + services
- [ ] REST APIs for rooms and message history
- [ ] Configure Spring WebSocket + STOMP
- [ ] Implement WebSocket auth interceptor
- [ ] Implement WebSocketController (send, typing, presence)
- [ ] Write unit tests for chat service

### Phase 4 — Frontend Foundation (Day 9–11)
- [ ] Configure Angular Material + global theme (dark/light)
- [ ] Implement JWT interceptor and error interceptor
- [ ] Implement AuthService (login, register, token refresh)
- [ ] Build auth pages (Login, Register) with validation
- [ ] Set up route guards

### Phase 5 — Chat UI (Day 12–15)
- [ ] Implement WebSocketService (connect, subscribe, send)
- [ ] Build ChatSidebar component (room list, user presence)
- [ ] Build ChatWindow component (message list, scroll behavior)
- [ ] Build MessageBubble component (sent/received styling, receipts)
- [ ] Implement typing indicator
- [ ] Integrate ChatService with REST + WebSocket

### Phase 6 — Polish & Advanced Features (Day 16–18)
- [ ] Profile page (avatar upload, display name)
- [ ] Notification panel
- [ ] Dark/light mode toggle
- [ ] Mobile-responsive layout
- [ ] Message search
- [ ] Error handling + loading states

### Phase 7 — Docker & Deployment (Day 19–20)
- [ ] Dockerize backend (multi-stage build with JRE 21-slim)
- [ ] Dockerize frontend (multi-stage: Node build + Nginx)
- [ ] Write docker-compose.yml with all services
- [ ] Configure Nginx reverse proxy + TLS
- [ ] Environment variable management (.env files)
- [ ] Test full stack locally with Docker Compose

### Phase 8 — Testing & Security Audit (Day 21–22)
- [ ] Backend unit tests (services, security)
- [ ] Angular component/service tests (Jasmine + Karma)
- [ ] Security review: headers, CORS, rate limiting
- [ ] Performance review: database indexing, connection pooling

---

## Open Questions

> [!IMPORTANT]
> **E2E Encryption**: Should end-to-end encryption be implemented using Web Crypto API (client-side key exchange)? This is architecturally significant — it means the server cannot read messages, but adds complexity and limits search/moderation features.

> [!IMPORTANT]
> **File Uploads**: Should file/image uploads be stored locally (in a Docker volume) or integrated with an external object store (e.g., AWS S3, MinIO)? MinIO can be self-hosted via Docker.

> [!IMPORTANT]
> **Deployment Target**: Will this be deployed to a cloud provider (AWS, GCP, Azure, DigitalOcean), a self-hosted VPS, or just run locally? This determines TLS certificate strategy.

> [!NOTE]
> **Admin Dashboard**: Should the admin moderation panel be a separate Angular route or a separate application?

> [!NOTE]
> **Testing Depth**: Should I write full test suites as part of the initial implementation, or stub test files with a few representative examples?

---

## Verification Plan

### Automated
- `mvn test` — Spring Boot unit/integration tests
- `ng test` — Angular Jasmine/Karma tests
- `docker-compose up` — Full stack smoke test

### Manual Browser Verification
- Register → Login → Create room → Send messages (real-time updates verified)
- Two browser tabs simulate two users chatting
- Token refresh flow triggered (wait for access token expiry or mock it)
- WebSocket disconnect/reconnect verified
