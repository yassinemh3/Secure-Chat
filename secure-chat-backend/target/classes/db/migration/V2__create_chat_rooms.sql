-- V2: Create chat_rooms and room_memberships tables
CREATE TYPE room_type AS ENUM ('DIRECT', 'GROUP');
CREATE TYPE member_role AS ENUM ('MEMBER', 'ADMIN', 'OWNER');

CREATE TABLE chat_rooms (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100),
    description TEXT,
    type        room_type NOT NULL DEFAULT 'GROUP',
    created_by  UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rooms_created_by ON chat_rooms(created_by);
CREATE INDEX idx_rooms_type       ON chat_rooms(type);

CREATE TABLE room_memberships (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id      UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role         member_role NOT NULL DEFAULT 'MEMBER',
    joined_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_read_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(room_id, user_id)
);

CREATE INDEX idx_memberships_room ON room_memberships(room_id);
CREATE INDEX idx_memberships_user ON room_memberships(user_id);
