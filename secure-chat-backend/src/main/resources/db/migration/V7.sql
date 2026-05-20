-- V7: Convert user_presence.status from enum to varchar
ALTER TABLE user_presence ALTER COLUMN status DROP DEFAULT;
ALTER TABLE user_presence ALTER COLUMN status TYPE varchar(50) USING status::text;
ALTER TABLE user_presence ALTER COLUMN status SET DEFAULT 'OFFLINE';

DROP TYPE IF EXISTS presence_status;