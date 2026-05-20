-- V3: Create messages and message_receipts tables
CREATE TYPE content_type   AS ENUM ('TEXT', 'IMAGE', 'FILE');
CREATE TYPE message_status AS ENUM ('DELIVERED', 'READ');

CREATE TABLE messages (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id      UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content      TEXT NOT NULL,
    content_type content_type NOT NULL DEFAULT 'TEXT',
    is_encrypted BOOLEAN NOT NULL DEFAULT FALSE,
    is_edited    BOOLEAN NOT NULL DEFAULT FALSE,
    is_deleted   BOOLEAN NOT NULL DEFAULT FALSE,
    reply_to_id  UUID REFERENCES messages(id) ON DELETE SET NULL,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_room      ON messages(room_id, created_at DESC);
CREATE INDEX idx_messages_sender    ON messages(sender_id);
CREATE INDEX idx_messages_reply     ON messages(reply_to_id);

CREATE TABLE message_receipts (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status     message_status NOT NULL,
    timestamp  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(message_id, user_id)
);

CREATE INDEX idx_receipts_message ON message_receipts(message_id);
CREATE INDEX idx_receipts_user    ON message_receipts(user_id);
