CREATE TABLE IF NOT EXISTS accounts (
  account VARCHAR(255) PRIMARY KEY,
  password VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL
);

-- WILL BE DEPRECATED
CREATE TABLE IF NOT EXISTS account_passwords (
  account_id VARCHAR(255) PRIMARY KEY,
  password VARCHAR(255) NOT NULL
);

-- WILL BE DEPRECATED
CREATE TABLE IF NOT EXISTS account_user_ids (
  account_id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  user_id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255),
  avatar VARCHAR(255),
  avatar_url VARCHAR(255),
  signature VARCHAR(255),
  country VARCHAR(255),
  level INT,
  vip INT,
  xp INT,
  required_xp INT,
  progress INT,
  birth_year INT,
  birth_month INT,
  birth_day INT,
  status VARCHAR(255),
  gender VARCHAR(255),
  current_channel_id VARCHAR(255),
  current_server_id VARCHAR(255),
  last_active_at INT,
  created_at INT
);

CREATE TABLE IF NOT EXISTS badges (
  badge_id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255),
  description VARCHAR(255),
);

CREATE TABLE IF NOT EXISTS user_badges (
  user_id VARCHAR(255),
  badge_id VARCHAR(255),
  PRIMARY KEY (user_id, badge_id)
  order INT,
  created_at INT
);

CREATE TABLE IF NOT EXISTS user_servers (
  user_id VARCHAR(255),
  server_id VARCHAR(255),
  PRIMARY KEY (user_id, server_id)
  owned BOOLEAN,
  recent BOOLEAN,
  favorite BOOLEAN,
  timestamp INT
);

CREATE TABLE IF NOT EXISTS servers (
  server_id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255),
  avatar VARCHAR(255),
  avatar_url VARCHAR(255),
  announcement VARCHAR(255),
  apply_notice VARCHAR(255),
  description VARCHAR(255),
  display_id VARCHAR(255),
  slogan VARCHAR(255),
  level INT,
  wealth INT,
  receive_apply BOOLEAN,
  allow_direct_message BOOLEAN,
  type VARCHAR(255),
  visibility VARCHAR(255),
  lobby_id VARCHAR(255),
  owner_id VARCHAR(255),
  created_at INT
);

CREATE TABLE IF NOT EXISTS channels (
  channel_id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255),
  order INT,
  bitrate INT,
  user_limit INT,
  guest_text_gap_time INT,
  guest_text_wait_time INT,
  guest_text_max_length INT,
  is_root BOOLEAN,
  is_lobby BOOLEAN,
  slowmode BOOLEAN,
  forbid_text BOOLEAN,
  forbid_guest_text BOOLEAN,
  forbid_guest_url BOOLEAN,
  type VARCHAR(255),
  voice_mode VARCHAR(255),
  category_id VARCHAR(255),
  server_id VARCHAR(255),
  created_at INT
);

CREATE TABLE IF NOT EXISTS friend_groups (
  friend_group_id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255),  
  order INT,
  user_id VARCHAR(255),
  created_at INT
);

-- NOT USED
CREATE TABLE IF NOT EXISTS channel_relations (
  channel_id VARCHAR(255) PRIMARY KEY,
  data JSON NOT NULL
);

CREATE TABLE IF NOT EXISTS members (
  member_id VARCHAR(255) PRIMARY KEY,
  nickname VARCHAR(255),
  contribution INT,
  last_message_time INT,
  last_join_channel_time INT,
  permission_level INT,
  is_blocked BOOLEAN,
  user_id VARCHAR(255),
  server_id VARCHAR(255),
  created_at INT
);

CREATE TABLE IF NOT EXISTS member_applications (
  application_id VARCHAR(255) PRIMARY KEY,
  description VARCHAR(255),
  application_status VARCHAR(255),
  user_id VARCHAR(255),
  server_id VARCHAR(255),
  created_at INT
);

CREATE TABLE IF NOT EXISTS friends (
  friend_id VARCHAR(255) PRIMARY KEY,
  is_blocked BOOLEAN,
  friend_group_id VARCHAR(255),
  user_id VARCHAR(255),
  target_id VARCHAR(255),
  created_at INT
);

CREATE TABLE IF NOT EXISTS friend_applications (
  application_id VARCHAR(255) PRIMARY KEY,
  description VARCHAR(255),
  application_status VARCHAR(255),
  sender_id VARCHAR(255),
  reciever_id VARCHAR(255),
  created_at INT
);

CREATE TABLE IF NOT EXISTS messages (
  message_id VARCHAR(255) PRIMARY KEY,
  content VARCHAR(255),
  type VARCHAR(255),
  sender_id VARCHAR(255),
  server_id VARCHAR(255),
  channel_id VARCHAR(255),
  timestamp INT
);

CREATE TABLE IF NOT EXISTS direct_messages (
  message_id VARCHAR(255) PRIMARY KEY,
  content VARCHAR(255),
  type VARCHAR(255),
  user_id_1 VARCHAR(255),
  user_id_2 VARCHAR(255),
  timestamp INT
);

-- NOT USED
CREATE TABLE IF NOT EXISTS voice_presences (
  presence_id VARCHAR(255) PRIMARY KEY,
  data JSON NOT NULL
);