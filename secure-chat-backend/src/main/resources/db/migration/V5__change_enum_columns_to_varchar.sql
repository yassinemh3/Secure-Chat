ALTER TABLE users
    ALTER COLUMN role TYPE varchar(50) USING role::text;

ALTER TABLE chat_rooms
    ALTER COLUMN type TYPE varchar(50) USING type::text;

ALTER TABLE room_memberships
    ALTER COLUMN role TYPE varchar(50) USING role::text;

ALTER TABLE messages
    ALTER COLUMN content_type TYPE varchar(50) USING content_type::text;

ALTER TABLE message_receipts
    ALTER COLUMN status TYPE varchar(50) USING status::text;