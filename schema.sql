SET FOREIGN_KEY_CHECKS=0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

--
-- 資料庫： `ricecall`
--

-- --------------------------------------------------------

--
-- 資料表結構 `accounts`
--

CREATE TABLE `accounts` (
  `account` varchar(255) NOT NULL,
  `password` char(60) NOT NULL COMMENT 'BCRYPT',
  `user_id` char(36) NOT NULL
);

-- --------------------------------------------------------

--
-- 資料表結構 `badges`
--

CREATE TABLE `badges` (
  `badge_id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` varchar(255) NOT NULL
);

-- --------------------------------------------------------

--
-- 資料表結構 `channels`
--

CREATE TABLE `channels` (
  `channel_id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `order` int(10) UNSIGNED NOT NULL,
  `bitrate` int(10) UNSIGNED NOT NULL,
  `password` int(10) UNSIGNED NOT NULL,
  `user_limit` int(10) UNSIGNED NOT NULL,
  `guest_text_gap_time` int(10) UNSIGNED NOT NULL,
  `guest_text_wait_time` int(10) UNSIGNED NOT NULL,
  `guest_text_max_length` int(10) UNSIGNED NOT NULL,
  `is_root` tinyint(3) UNSIGNED NOT NULL,
  `is_lobby` tinyint(3) UNSIGNED NOT NULL,
  `slowmode` tinyint(3) UNSIGNED NOT NULL,
  `forbid_text` tinyint(3) UNSIGNED NOT NULL,
  `forbid_guest_text` tinyint(3) UNSIGNED NOT NULL,
  `forbid_guest_url` tinyint(3) UNSIGNED NOT NULL,
  `type` varchar(255) NOT NULL,
  `voice_mode` varchar(255) NOT NULL,
  `category_id` char(36) NOT NULL,
  `server_id` char(36) NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
);

-- --------------------------------------------------------

--
-- 資料表結構 `direct_messages`
--

CREATE TABLE `direct_messages` (
  `message_id` char(36) NOT NULL,
  `content` text NOT NULL,
  `type` varchar(255) NOT NULL,
  `sender_id` char(36) NOT NULL,
  `user_id_1` char(36) NOT NULL,
  `user_id_2` char(36) NOT NULL,
  `timestamp` int(10) UNSIGNED NOT NULL
);

-- --------------------------------------------------------

--
-- 資料表結構 `friends`
--

CREATE TABLE `friends` (
  `friend_id` char(36) NOT NULL,
  `is_blocked` tinyint(3) UNSIGNED NOT NULL,
  `friend_group_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `target_id` char(36) NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
);

-- --------------------------------------------------------

--
-- 資料表結構 `friend_applications`
--

CREATE TABLE `friend_applications` (
  `application_id` char(36) NOT NULL,
  `description` varchar(255) NOT NULL,
  `application_status` varchar(255) NOT NULL,
  `sender_id` char(36) NOT NULL,
  `reciever_id` char(36) NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
);

-- --------------------------------------------------------

--
-- 資料表結構 `friend_groups`
--

CREATE TABLE `friend_groups` (
  `friend_group_id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `order` int(10) UNSIGNED NOT NULL,
  `user_id` char(36) NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
);

-- --------------------------------------------------------

--
-- 資料表結構 `members`
--

CREATE TABLE `members` (
  `member_id` char(36) NOT NULL,
  `nickname` varchar(255) DEFAULT NULL,
  `contribution` int(10) UNSIGNED NOT NULL,
  `last_message_time` int(10) UNSIGNED NOT NULL,
  `last_join_channel_time` int(10) UNSIGNED NOT NULL,
  `permission_level` int(10) UNSIGNED NOT NULL,
  `is_blocked` tinyint(3) UNSIGNED NOT NULL,
  `user_id` char(36) NOT NULL,
  `server_id` char(36) NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
);

-- --------------------------------------------------------

--
-- 資料表結構 `member_applications`
--

CREATE TABLE `member_applications` (
  `application_id` char(36) NOT NULL,
  `description` varchar(255) NOT NULL,
  `application_status` varchar(255) NOT NULL,
  `user_id` char(36) NOT NULL,
  `server_id` char(36) NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
);

-- --------------------------------------------------------

--
-- 資料表結構 `messages`
--

CREATE TABLE `messages` (
  `message_id` char(36) NOT NULL,
  `content` text NOT NULL,
  `type` varchar(255) NOT NULL,
  `sender_id` char(36) NOT NULL,
  `server_id` char(36) NOT NULL,
  `channel_id` char(36) NOT NULL,
  `timestamp` int(10) UNSIGNED NOT NULL
);

-- --------------------------------------------------------

--
-- 資料表結構 `servers`
--

CREATE TABLE `servers` (
  `server_id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `avatar` varchar(255) NOT NULL,
  `avatar_url` varchar(255) NOT NULL,
  `announcement` text NOT NULL,
  `apply_notice` varchar(255) NOT NULL,
  `description` varchar(255) NOT NULL,
  `display_id` varchar(24) NOT NULL,
  `slogan` varchar(255) NOT NULL,
  `level` int(10) UNSIGNED NOT NULL,
  `wealth` int(1) UNSIGNED NOT NULL,
  `receive_apply` tinyint(3) UNSIGNED NOT NULL,
  `allow_direct_message` tinyint(3) UNSIGNED NOT NULL,
  `type` varchar(255) NOT NULL,
  `visibility` varchar(255) NOT NULL,
  `lobby_id` char(36) NOT NULL,
  `owner_id` char(36) NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
);

-- --------------------------------------------------------

--
-- 資料表結構 `users`
--

CREATE TABLE `users` (
  `user_id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `avatar` varchar(255) NOT NULL,
  `avatar_url` varchar(255) NOT NULL,
  `signature` varchar(255) NOT NULL,
  `country` varchar(48) NOT NULL,
  `level` int(10) UNSIGNED NOT NULL,
  `vip` int(10) UNSIGNED NOT NULL,
  `xp` int(10) UNSIGNED NOT NULL,
  `required_xp` int(10) UNSIGNED NOT NULL,
  `progress` int(10) UNSIGNED NOT NULL,
  `birth_year` smallint(5) UNSIGNED NOT NULL,
  `birth_month` tinyint(3) UNSIGNED NOT NULL,
  `birth_day` tinyint(3) UNSIGNED NOT NULL,
  `status` varchar(255) NOT NULL,
  `gender` varchar(255) NOT NULL,
  `current_channel_id` char(36) DEFAULT NULL,
  `current_server_id` char(36) DEFAULT NULL,
  `last_active_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
);

-- --------------------------------------------------------

--
-- 資料表結構 `user_badges`
--

CREATE TABLE `user_badges` (
  `user_id` char(36) NOT NULL,
  `badge_id` char(36) NOT NULL,
  `order` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
);

-- --------------------------------------------------------

--
-- 資料表結構 `user_servers`
--

CREATE TABLE `user_servers` (
  `user_id` char(36) NOT NULL,
  `server_id` char(36) NOT NULL,
  `owned` tinyint(3) UNSIGNED NOT NULL,
  `recent` tinyint(3) UNSIGNED NOT NULL,
  `favorite` tinyint(3) UNSIGNED NOT NULL,
  `timestamp` int(10) UNSIGNED NOT NULL
);

--
-- 已傾印資料表的索引
--

--
-- 資料表索引 `accounts`
--
ALTER TABLE `accounts`
  ADD PRIMARY KEY (`account`),
  ADD KEY `user_id` (`user_id`);

--
-- 資料表索引 `badges`
--
ALTER TABLE `badges`
  ADD PRIMARY KEY (`badge_id`);

--
-- 資料表索引 `channels`
--
ALTER TABLE `channels`
  ADD PRIMARY KEY (`channel_id`);

--
-- 資料表索引 `direct_messages`
--
ALTER TABLE `direct_messages`
  ADD PRIMARY KEY (`message_id`),
  ADD KEY `user_id_1` (`user_id_1`),
  ADD KEY `user_id_2` (`user_id_2`);

--
-- 資料表索引 `friends`
--
ALTER TABLE `friends`
  ADD PRIMARY KEY (`friend_id`),
  ADD KEY `friend_group_id` (`friend_group_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `target_id` (`target_id`);

--
-- 資料表索引 `friend_applications`
--
ALTER TABLE `friend_applications`
  ADD PRIMARY KEY (`application_id`),
  ADD KEY `sender_id` (`sender_id`),
  ADD KEY `reciever_id` (`reciever_id`);

--
-- 資料表索引 `friend_groups`
--
ALTER TABLE `friend_groups`
  ADD PRIMARY KEY (`friend_group_id`),
  ADD KEY `user_id` (`user_id`);

--
-- 資料表索引 `members`
--
ALTER TABLE `members`
  ADD PRIMARY KEY (`member_id`),
  ADD KEY `server_id` (`server_id`),
  ADD KEY `user_id` (`user_id`);

--
-- 資料表索引 `member_applications`
--
ALTER TABLE `member_applications`
  ADD PRIMARY KEY (`application_id`),
  ADD KEY `server_id` (`server_id`),
  ADD KEY `user_id` (`user_id`);

--
-- 資料表索引 `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`message_id`),
  ADD KEY `channel_id` (`channel_id`),
  ADD KEY `sender_id` (`sender_id`),
  ADD KEY `server_id` (`server_id`);

--
-- 資料表索引 `servers`
--
ALTER TABLE `servers`
  ADD PRIMARY KEY (`server_id`),
  ADD KEY `owner_id` (`owner_id`),
  ADD KEY `lobby_id` (`lobby_id`);

--
-- 資料表索引 `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`);

--
-- 資料表索引 `user_badges`
--
ALTER TABLE `user_badges`
  ADD PRIMARY KEY (`user_id`,`badge_id`),
  ADD KEY `badge_id` (`badge_id`);

--
-- 資料表索引 `user_servers`
--
ALTER TABLE `user_servers`
  ADD PRIMARY KEY (`user_id`,`server_id`),
  ADD KEY `server_id` (`server_id`);

--
-- 已傾印資料表的限制式
--

--
-- 資料表的限制式 `accounts`
--
ALTER TABLE `accounts`
  ADD CONSTRAINT `accounts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- 資料表的限制式 `direct_messages`
--
ALTER TABLE `direct_messages`
  ADD CONSTRAINT `direct_messages_ibfk_1` FOREIGN KEY (`user_id_1`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `direct_messages_ibfk_2` FOREIGN KEY (`user_id_2`) REFERENCES `users` (`user_id`);

--
-- 資料表的限制式 `friends`
--
ALTER TABLE `friends`
  ADD CONSTRAINT `friends_ibfk_1` FOREIGN KEY (`friend_group_id`) REFERENCES `friend_groups` (`friend_group_id`),
  ADD CONSTRAINT `friends_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `friends_ibfk_3` FOREIGN KEY (`target_id`) REFERENCES `users` (`user_id`);

--
-- 資料表的限制式 `friend_applications`
--
ALTER TABLE `friend_applications`
  ADD CONSTRAINT `friend_applications_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `friend_applications_ibfk_2` FOREIGN KEY (`reciever_id`) REFERENCES `users` (`user_id`);

--
-- 資料表的限制式 `friend_groups`
--
ALTER TABLE `friend_groups`
  ADD CONSTRAINT `friend_groups_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- 資料表的限制式 `members`
--
ALTER TABLE `members`
  ADD CONSTRAINT `members_ibfk_1` FOREIGN KEY (`server_id`) REFERENCES `servers` (`server_id`),
  ADD CONSTRAINT `members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- 資料表的限制式 `member_applications`
--
ALTER TABLE `member_applications`
  ADD CONSTRAINT `member_applications_ibfk_1` FOREIGN KEY (`server_id`) REFERENCES `servers` (`server_id`),
  ADD CONSTRAINT `member_applications_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- 資料表的限制式 `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`channel_id`) REFERENCES `channels` (`channel_id`),
  ADD CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `messages_ibfk_3` FOREIGN KEY (`server_id`) REFERENCES `servers` (`server_id`);

--
-- 資料表的限制式 `servers`
--
ALTER TABLE `servers`
  ADD CONSTRAINT `servers_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `servers_ibfk_2` FOREIGN KEY (`lobby_id`) REFERENCES `channels` (`channel_id`);

--
-- 資料表的限制式 `user_badges`
--
ALTER TABLE `user_badges`
  ADD CONSTRAINT `user_badges_ibfk_1` FOREIGN KEY (`badge_id`) REFERENCES `badges` (`badge_id`),
  ADD CONSTRAINT `user_badges_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- 資料表的限制式 `user_servers`
--
ALTER TABLE `user_servers`
  ADD CONSTRAINT `user_servers_ibfk_1` FOREIGN KEY (`server_id`) REFERENCES `servers` (`server_id`),
  ADD CONSTRAINT `user_servers_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);
SET FOREIGN_KEY_CHECKS=1;
COMMIT;
