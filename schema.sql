CREATE TABLE IF NOT EXISTS accounts (
  account VARCHAR(255) PRIMARY KEY,
  password VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL
);

-- WILL BE DEPRECATED
-- CREATE TABLE IF NOT EXISTS account_passwords (
--  account_id VARCHAR(255) PRIMARY KEY,
--  password VARCHAR(255) NOT NULL
-- );

-- WILL BE DEPRECATED
-- CREATE TABLE IF NOT EXISTS account_user_ids (
--  account_id VARCHAR(255) PRIMARY KEY,
--  user_id VARCHAR(255) NOT NULL
-- );

CREATE TABLE IF NOT EXISTS users (
  user_id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  avatar VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(255) NOT NULL,
  signature VARCHAR(255) NOT NULL,
  country VARCHAR(255) NOT NULL,
  level INT NOT NULL,
  vip INT NOT NULL,
  xp INT NOT NULL,
  required_xp INT NOT NULL,
  progress INT NOT NULL,
  birth_year INT NOT NULL,
  birth_month INT NOT NULL,
  birth_day INT NOT NULL,
  status VARCHAR(255) NOT NULL,
  gender VARCHAR(255) NOT NULL,
  current_channel_id VARCHAR(255),
  current_server_id VARCHAR(255),
  last_active_at INT NOT NULL,
  created_at INT NOT NULL
);

CREATE TABLE IF NOT EXISTS badges (
  badge_id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS user_badges (
  user_id VARCHAR(255),
  badge_id VARCHAR(255),
  PRIMARY KEY (user_id, badge_id),
  `order` INT NOT NULL,
  created_at INT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_servers (
  user_id VARCHAR(255),
  server_id VARCHAR(255),
  PRIMARY KEY (user_id, server_id),
  owned BOOLEAN NOT NULL,
  recent BOOLEAN NOT NULL,
  favorite BOOLEAN NOT NULL,
  `timestamp` INT NOT NULL
);

CREATE TABLE IF NOT EXISTS servers (
  server_id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  avatar VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(255) NOT NULL,
  announcement VARCHAR(255) NOT NULL,
  apply_notice VARCHAR(255) NOT NULL,
  description VARCHAR(255) NOT NULL,
  display_id VARCHAR(255) NOT NULL,
  slogan VARCHAR(255) NOT NULL,
  level INT NOT NULL,
  wealth INT NOT NULL,
  receive_apply BOOLEAN NOT NULL,
  allow_direct_message BOOLEAN NOT NULL,
  type VARCHAR(255) NOT NULL,
  visibility VARCHAR(255) NOT NULL,
  lobby_id VARCHAR(255) NOT NULL,
  owner_id VARCHAR(255) NOT NULL,
  created_at INT NOT NULL
);

CREATE TABLE IF NOT EXISTS channels (
  channel_id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  `order` INT NOT NULL,
  bitrate INT NOT NULL,
  `password` INT NOT NULL,
  user_limit INT NOT NULL,
  guest_text_gap_time INT NOT NULL,
  guest_text_wait_time INT NOT NULL,
  guest_text_max_length INT NOT NULL,
  is_root BOOLEAN NOT NULL,
  is_lobby BOOLEAN NOT NULL,
  slowmode BOOLEAN NOT NULL,
  forbid_text BOOLEAN NOT NULL,
  forbid_guest_text BOOLEAN NOT NULL,
  forbid_guest_url BOOLEAN NOT NULL,
  type VARCHAR(255) NOT NULL,
  voice_mode VARCHAR(255) NOT NULL,
  category_id VARCHAR(255) NOT NULL,
  server_id VARCHAR(255) NOT NULL,
  created_at INT NOT NULL
);

CREATE TABLE IF NOT EXISTS friend_groups (
  friend_group_id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  `order` INT NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  created_at INT NOT NULL
);

-- NOT USED
-- CREATE TABLE IF NOT EXISTS channel_relations (
--  channel_id VARCHAR(255) PRIMARY KEY,
--  data JSON NOT NULL
-- );

CREATE TABLE IF NOT EXISTS members (
  member_id VARCHAR(255) PRIMARY KEY,
  nickname VARCHAR(255),
  contribution INT NOT NULL,
  last_message_time INT NOT NULL,
  last_join_channel_time INT NOT NULL,
  permission_level INT NOT NULL,
  is_blocked BOOLEAN NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  server_id VARCHAR(255) NOT NULL,
  created_at INT NOT NULL
);

CREATE TABLE IF NOT EXISTS member_applications (
  application_id VARCHAR(255) PRIMARY KEY,
  description VARCHAR(255) NOT NULL,
  application_status VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  server_id VARCHAR(255) NOT NULL,
  created_at INT NOT NULL
);

CREATE TABLE IF NOT EXISTS friends (
  friend_id VARCHAR(255) PRIMARY KEY,
  is_blocked BOOLEAN NOT NULL,
  friend_group_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  target_id VARCHAR(255) NOT NULL,
  created_at INT NOT NULL
);

CREATE TABLE IF NOT EXISTS friend_applications (
  application_id VARCHAR(255) PRIMARY KEY,
  description VARCHAR(255) NOT NULL,
  application_status VARCHAR(255) NOT NULL,
  sender_id VARCHAR(255) NOT NULL,
  reciever_id VARCHAR(255) NOT NULL,
  created_at INT NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  message_id VARCHAR(255) PRIMARY KEY,
  content VARCHAR(255) NOT NULL,
  type VARCHAR(255) NOT NULL,
  sender_id VARCHAR(255) NOT NULL,
  server_id VARCHAR(255) NOT NULL,
  channel_id VARCHAR(255) NOT NULL,
  `timestamp` INT NOT NULL
);

CREATE TABLE IF NOT EXISTS direct_messages (
  message_id VARCHAR(255) PRIMARY KEY,
  content VARCHAR(255) NOT NULL,
  type VARCHAR(255) NOT NULL,
  sender_id VARCHAR(255) NOT NULL,
  user_id_1 VARCHAR(255) NOT NULL,
  user_id_2 VARCHAR(255) NOT NULL,
  `timestamp` INT NOT NULL
);

-- NOT USED
-- CREATE TABLE IF NOT EXISTS voice_presences (
--  presence_id VARCHAR(255) PRIMARY KEY,
--  data JSON NOT NULL
-- );