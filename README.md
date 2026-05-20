# Secure-Chat

A production-ready, full-stack secure real-time chat platform.

## Tech Stack

| Layer      | Technology                                           |
|------------|------------------------------------------------------|
| Frontend   | Angular 18, Angular Material, RxJS, STOMP/SockJS     |
| Backend    | Java 21, Spring Boot 3.2, Spring Security, WebSocket |
| Database   | PostgreSQL 16 with Flyway migrations                 |
| Auth       | JWT (access token) + HttpOnly refresh token cookie   |
| Deployment | Docker Compose, Nginx reverse proxy, TLS-ready       |

## Features
- ✅ JWT authentication (register / login / refresh / logout)
- ✅ Real-time messaging via STOMP WebSocket
- ✅ Group rooms & direct messages
- ✅ Typing indicators
- ✅ Online/offline presence
- ✅ Message edit & soft-delete
- ✅ Paginated message history
- ✅ Full-text message search
- ✅ Role-based access (USER / ADMIN)
- ✅ Dark / light mode
- ✅ OWASP HTML sanitization (XSS prevention)
- ✅ Rate limiting on auth endpoints
- ✅ Docker Compose with Nginx reverse proxy

## Quick Start (Development)

### Prerequisites
- Java 21+
- Maven 3.9+
- Node.js 20+
- Docker & Docker Compose

### 1. Configure environment
```bash
cp .env.example .env
# Edit .env with your database password and JWT secret
```

### 2. Start PostgreSQL
```bash
docker-compose up postgres -d
```

### 3. Start Backend
```bash
cd secure-chat-backend
mvn spring-boot:run
```

### 4. Start Frontend
```bash
cd secure-chat-frontend
npm start
```

Open http://localhost:4200

## Docker Compose (Full Stack)

```bash
# Copy and configure environment
cp .env.example .env

# For HTTPS, place your certs in nginx/ssl/:
#   nginx/ssl/fullchain.pem
#   nginx/ssl/privkey.pem

# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f
```

## Project Structure

```
Secure-Chat/
├── docker-compose.yml
├── nginx/nginx.conf
├── .env.example
├── secure-chat-backend/       # Spring Boot
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/main/java/com/securechat/
│       ├── config/            # Security, WebSocket, CORS
│       ├── controller/        # REST + WebSocket controllers
│       ├── service/           # Business logic
│       ├── repository/        # JPA repositories
│       ├── entity/            # JPA entities
│       ├── dto/               # Request/Response DTOs
│       ├── security/          # JWT filter, interceptors
│       ├── mapper/            # MapStruct mappers
│       └── exception/         # Global exception handling
└── secure-chat-frontend/      # Angular 18
    ├── Dockerfile
    └── src/app/
        ├── core/              # Guards, interceptors, services, models
        └── features/          # Auth, Chat, Profile components
```

## API Reference

| Method | Endpoint                         | Description            |
|--------|----------------------------------|------------------------|
| POST   | /api/v1/auth/register            | Register               |
| POST   | /api/v1/auth/login               | Login                  |
| POST   | /api/v1/auth/refresh             | Refresh access token   |
| POST   | /api/v1/auth/logout              | Logout                 |
| GET    | /api/v1/users/me                 | Get own profile        |
| GET    | /api/v1/users/search?q=          | Search users           |
| GET    | /api/v1/rooms                    | List my rooms          |
| POST   | /api/v1/rooms                    | Create room            |
| GET    | /api/v1/rooms/{id}/messages      | Message history        |
| GET    | /api/v1/messages/search?q=       | Search messages        |

## WebSocket STOMP Endpoints

- Connect: `ws://host/ws`
- Send message: `/app/chat.send`
- Typing: `/app/chat.typing`
- Subscribe room: `/topic/room.{roomId}`
- Presence: `/topic/presence`
