-- V6: Drop unused custom enum types now replaced by varchar

-- Must remove defaults that reference enum types before dropping the types
ALTER TABLE users ALTER COLUMN role DROP DEFAULT;
ALTER TABLE chat_rooms ALTER COLUMN type DROP DEFAULT;
ALTER TABLE room_memberships ALTER COLUMN role DROP DEFAULT;
ALTER TABLE messages ALTER COLUMN content_type DROP DEFAULT;
ALTER TABLE message_receipts ALTER COLUMN status DROP DEFAULT;

-- Now we can safely drop the enum types
DROP TYPE IF EXISTS user_role;
DROP TYPE IF EXISTS room_type;
DROP TYPE IF EXISTS member_role;
DROP TYPE IF EXISTS content_type;
DROP TYPE IF EXISTS message_status;
-- presence_status is used by user_presence.status, leave it for now