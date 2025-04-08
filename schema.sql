CREATE TABLE IF NOT EXISTS account_passwords (
  account_id VARCHAR(255) PRIMARY KEY,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS account_user_ids (
  account_id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  user_id VARCHAR(255) PRIMARY KEY,
  data JSON NOT NULL
);

CREATE TABLE IF NOT EXISTS badges (
  badge_id VARCHAR(255) PRIMARY KEY,
  data JSON NOT NULL
);

CREATE TABLE IF NOT EXISTS user_badges (
  user_id VARCHAR(255),
  badge_id VARCHAR(255),
  data JSON NOT NULL,
  PRIMARY KEY (user_id, badge_id)
);

CREATE TABLE IF NOT EXISTS user_servers (
  user_id VARCHAR(255),
  server_id VARCHAR(255),
  data JSON NOT NULL,
  PRIMARY KEY (user_id, server_id)
);

CREATE TABLE IF NOT EXISTS servers (
  server_id VARCHAR(255) PRIMARY KEY,
  data JSON NOT NULL
);

CREATE TABLE IF NOT EXISTS channels (
  channel_id VARCHAR(255) PRIMARY KEY,
  data JSON NOT NULL
);

CREATE TABLE IF NOT EXISTS friend_groups (
  group_id VARCHAR(255) PRIMARY KEY,
  data JSON NOT NULL
);

CREATE TABLE IF NOT EXISTS channel_relations (
  channel_id VARCHAR(255) PRIMARY KEY,
  data JSON NOT NULL
);

CREATE TABLE IF NOT EXISTS members (
  member_id VARCHAR(255) PRIMARY KEY,
  data JSON NOT NULL
);

CREATE TABLE IF NOT EXISTS member_applications (
  application_id VARCHAR(255) PRIMARY KEY,
  data JSON NOT NULL
);

CREATE TABLE IF NOT EXISTS friends (
  friend_id VARCHAR(255) PRIMARY KEY,
  data JSON NOT NULL
);

CREATE TABLE IF NOT EXISTS friend_applications (
  application_id VARCHAR(255) PRIMARY KEY,
  data JSON NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  message_id VARCHAR(255) PRIMARY KEY,
  data JSON NOT NULL
);

CREATE TABLE IF NOT EXISTS direct_messages (
  message_id VARCHAR(255) PRIMARY KEY,
  data JSON NOT NULL
);

CREATE TABLE IF NOT EXISTS voice_presences (
  presence_id VARCHAR(255) PRIMARY KEY,
  data JSON NOT NULL
);