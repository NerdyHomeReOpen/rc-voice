const { query } = require('./database');

// Helper functions to match quick.db API
class Database {
  async set(table, data) {
    const entries = Object.entries(data);
    for (const [key, value] of entries) {
      // Ensure value is a valid object that can be converted to JSON
      let jsonValue;
      try {
        // If value is already a string, try parsing it first to validate JSON
        if (typeof value === 'string') {
          JSON.parse(value);
          jsonValue = value;
        } else {
          // If value is an object, stringify it
          jsonValue = JSON.stringify(value);
        }
      } catch (error) {
        throw new Error(`Invalid data format for key ${key}: ${error.message}`);
      }

      await query(
        `INSERT INTO ${table} (${table.slice(0, -1)}_id, data)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE data = ?`,
        [key, jsonValue, jsonValue],
      );
    }
  }

  get = {
    // Avatar
    avatar: async (avatarUrl) => {
      return `data:image/png;base64,${avatarUrl}`;
    },

    // User
    searchUser: async (query) => {
      // const users = (await db.get('users')) || {};
      // const accountUserIds = (await db.get('accountUserIds')) || {};
      // const target = Object.values(users).find(
      //   (u) => u.id === accountUserIds[query],
      // );
      // if (!target) return null;
      // return target;
      const userId = await query(
        `SELECT id FROM account_user_ids WHERE id = ?`,
        [query],
      );
      const user = await query(`SELECT * FROM users WHERE id = ?`, [userId]);
      if (!user) return null;
      return user;
    },
    user: async (userId) => {
      // const users = (await db.get('users')) || {};
      // const user = users[userId];
      // if (!user) return null;
      // return {
      //   ...user,
      //   badges: await get.userBadges(userId),
      //   friends: await get.userFriends(userId),
      //   friendGroups: await get.userFriendGroups(userId),
      //   friendApplications: await get.userFriendApplications(userId),
      //   joinedServers: await get.userJoinedServers(userId),
      //   recentServers: await get.userRecentServers(userId),
      //   ownedServers: await get.userOwnedServers(userId),
      //   favServers: await get.userFavServers(userId),
      // };
      const user = await query(`SELECT * FROM users WHERE users.id = ?`, [
        userId,
      ]);
      const userBadges = await query(
        `SELECT * FROM badges
        LEFT JOIN user_badges ON badges.id = user_badges.badge_id
        WHERE user_badges.user_id = ?`,
        [userId],
      );
      if (!user) return null;
      return {
        ...user,
        badges: userBadges,
      };
    },
    userFriendGroups: async (userId) => {
      // const friendGroups = (await db.get('friendGroups')) || {};
      // return Object.values(friendGroups)
      //   .filter((fg) => fg.userId === userId)
      //   .sort((a, b) => b.order - a.order)
      //   .filter((fg) => fg);
      const friendGroups = await query(
        `SELECT * FROM friend_groups WHERE user_id = ? ORDER BY friend_groups.order DESC`,
        [userId],
      );
      if (!friendGroups) return null;
      return friendGroups;
    },
    userBadges: async (userId) => {
      // const userBadges = (await db.get('userBadges')) || {};
      // const badges = (await db.get('badges')) || {};
      // return Object.values(userBadges)
      //   .filter((ub) => ub.userId === userId)
      //   .map((ub) => badges[ub.badgeId])
      //   .sort((a, b) => b.order - a.order)
      //   .filter((b) => b);
      const userBadges = await query(
        `SELECT * FROM badges
        LEFT JOIN user_badges ON badges.id = user_badges.badge_id
        WHERE user_badges.user_id = ? ORDER BY badges.order DESC`,
        [userId],
      );
      if (!userBadges) return null;
      return userBadges;
    },
    userServers: async (userId) => {
      // const userServers = (await db.get('userServers')) || {};
      // const servers = (await db.get('servers')) || {};
      // return Object.values(userServers)
      //   .filter((us) => us.userId === userId)
      //   .map((us) => {
      //     // Concat server data with user server data
      //     const server = servers[us.serverId];
      //     return { ...us, ...server };
      //   })
      //   .filter((s) => s);
      const userServers = await query(
        `SELECT * FROM user_servers 
        LEFT JOIN servers ON user_servers.server_id = servers.id
        WHERE user_servers.user_id = ? ORDER BY user_servers.timestamp DESC`,
        [userId],
      );
      if (!userServers) return null;
      return userServers;
    },
    // // Will be deprecated
    // userJoinedServers: async (userId) => {
    //   const members = (await db.get('members')) || {};
    //   const servers = (await db.get('servers')) || {};
    //   return Object.values(members)
    //     .filter((mb) => mb.userId === userId)
    //     .map((mb) => servers[mb.serverId])
    //     .sort((a, b) => b.name.localeCompare(a.name))
    //     .filter((s) => s);
    // },
    // // Will be deprecated
    // userRecentServers: async (userId) => {
    //   const userServers = (await db.get('userServers')) || {};
    //   const servers = (await db.get('servers')) || {};
    //   return Object.values(userServers)
    //     .filter((us) => us.userId === userId && us.recent)
    //     .sort((a, b) => b.timestamp - a.timestamp)
    //     .map((us) => servers[us.serverId])
    //     .filter((s) => s)
    //     .slice(0, 10);
    // },
    // // Will be deprecated
    // userOwnedServers: async (userId) => {
    //   const userServers = (await db.get('userServers')) || {};
    //   const servers = (await db.get('servers')) || {};
    //   return Object.values(userServers)
    //     .filter((us) => us.userId === userId && us.owned)
    //     .map((us) => servers[us.serverId])
    //     .sort((a, b) => b.name.localeCompare(a.name))
    //     .filter((s) => s);
    // },
    // // Will be deprecated
    // userFavServers: async (userId) => {
    //   const userServers = (await db.get('userServers')) || {};
    //   const servers = (await db.get('servers')) || {};
    //   return Object.values(userServers)
    //     .filter((us) => us.userId === userId && us.favorite)
    //     .map((us) => servers[us.serverId])
    //     .sort((a, b) => b.name.localeCompare(a.name))
    //     .filter((s) => s);
    // },
    userMembers: async (userId) => {
      // const members = (await db.get('members')) || {};
      // const servers = (await db.get('servers')) || {};
      // return Object.values(members)
      //   .filter((mb) => mb.userId === userId)
      //   .map((mb) => {
      //     // Concat member data with server data
      //     const server = servers[mb.serverId];
      //     return { ...server, ...mb };
      //   })
      //   .filter((mb) => mb);
      const userMembers = await query(
        `SELECT * FROM members 
        LEFT JOIN servers ON members.server_id = servers.id
        WHERE members.user_id = ? ORDER BY members.created_at DESC`,
        [userId],
      );
      if (!userMembers) return null;
      return userMembers;
    },
    userFriends: async (userId) => {
      // const friends = (await db.get('friends')) || {};
      // const users = (await db.get('users')) || {};
      // return Object.values(friends)
      //   .filter((fd) => fd.userId === userId)
      //   .map((fd) => {
      //     // Concat user data with friend data
      //     const user = users[fd.targetId];
      //     return { ...user, ...fd };
      //   })
      //   .filter((fd) => fd);
      const userFriends = await query(
        `SELECT * FROM friends 
        LEFT JOIN users ON friends.target_id = users.id
        WHERE friends.user_id = ? ORDER BY friends.created_at DESC`,
        [userId],
      );
      if (!userFriends) return null;
      return userFriends;
    },
    userFriendApplications: async (userId) => {
      // const applications = (await db.get('friendApplications')) || {};
      // const users = (await db.get('users')) || {};
      // return Object.values(applications)
      //   .filter(
      //     (app) =>
      //       app.receiverId === userId && app.applicationStatus === 'pending',
      //   )
      //   .map((app) => {
      //     // Concat user data with friend application data
      //     const user = users[app.senderId];
      //     return { ...user, ...app };
      //   })
      //   .filter((app) => app);
      const userFriendApplications = await query(
        `SELECT * FROM friend_applications 
        LEFT JOIN users ON friend_applications.sender_id = users.id
        WHERE friend_applications.receiver_id = ? AND friend_applications.application_status = 'pending' ORDER BY friend_applications.created_at DESC`,
        [userId],
      );
      if (!userFriendApplications) return null;
      return userFriendApplications;
    },

    // Server
    searchServer: async (query) => {
      const servers = await query(
        `SELECT * FROM servers 
        WHERE servers.name LIKE ? OR servers.display_id LIKE ? ORDER BY servers.created_at DESC`,
        [`%${query}%`, `${query}`],
      );
      if (!servers) return null;
      return servers;

      // const isServerMatch = (server, query) => {
      //   const _query = String(query).trim().toLowerCase();
      //   const _name = String(server.name).trim().toLowerCase();
      //   const _displayId = String(server.displayId).trim().toLowerCase();

      //   if (server.visibility === 'invisible' && _displayId !== _query)
      //     return false;
      //   return (
      //     Func.calculateSimilarity(_name, _query) >= 0.5 ||
      //     _name.includes(_query) ||
      //     _displayId === _query
      //   );
      // };

      // return Object.values(servers)
      //   .filter((s) => isServerMatch(s, query))
      //   .filter((s) => s)
      //   .slice(0, 10);
    },
    server: async (serverId) => {
      // const servers = (await db.get('servers')) || {};
      // const server = servers[serverId];
      // if (!server) return null;
      // return {
      //   ...server,
      //   channels: await get.serverChannels(serverId),
      //   members: await get.serverMembers(serverId),
      //   users: await get.serverUsers(serverId),
      //   memberApplications: await get.serverMemberApplications(serverId),
      // };
      const server = await query(`SELECT * FROM servers WHERE servers.id = ?`, [
        serverId,
      ]);
      if (!server) return null;
      return server;
    },
    // Change name to serverActiveMembers
    serverUsers: async (serverId) => {
      // const members = (await db.get('members')) || {};
      // const users = (await db.get('users')) || {};
      // return Object.values(members)
      //   .filter((mb) => mb.serverId === serverId)
      //   .map((mb) => {
      //     // Concat user data with member data
      //     const user = users[mb.userId];
      //     return { ...user, ...mb };
      //   })
      //   .filter((mb) => mb.currentServerId === serverId)
      //   .filter((mb) => mb);
      const serverUsers = await query(
        `SELECT * FROM members 
        LEFT JOIN users ON members.user_id = users.id
        WHERE members.server_id = ? ORDER BY members.created_at DESC`,
        [serverId],
      );
      if (!serverUsers) return null;
      return serverUsers;
    },
    serverChannels: async (serverId) => {
      // const channels = (await db.get('channels')) || {};
      // const categories = (await db.get('categories')) || {};
      // return Object.values({ ...channels, ...categories })
      //   .filter((ch) => ch.serverId === serverId)
      //   .sort((a, b) => a.order - b.order)
      //   .filter((ch) => ch);
      const serverChannels = await query(
        `SELECT * FROM channels 
        LEFT JOIN categories ON channels.category_id = categories.id
        WHERE channels.server_id = ? ORDER BY channels.order ASC`,
        [serverId],
      );
      if (!serverChannels) return null;
      return serverChannels;
    },
    serverMembers: async (serverId) => {
      // const members = (await db.get('members')) || {};
      // const users = (await db.get('users')) || {};
      // return Object.values(members)
      //   .filter((mb) => mb.serverId === serverId)
      //   .map((mb) => {
      //     // Concat user data with member data
      //     const user = users[mb.userId];
      //     return { ...user, ...mb };
      //   })
      //   .filter((mb) => mb);
      const serverMembers = await query(
        `SELECT * FROM members 
        LEFT JOIN users ON members.user_id = users.id
        WHERE members.server_id = ? ORDER BY members.created_at DESC`,
        [serverId],
      );
      if (!serverMembers) return null;
      return serverMembers;
    },
    serverMemberApplications: async (serverId) => {
      // const applications = (await db.get('memberApplications')) || {};
      // const users = (await db.get('users')) || {};
      // return Object.values(applications)
      //   .filter(
      //     (app) =>
      //       app.serverId === serverId && app.applicationStatus === 'pending',
      //   )
      //   .map((app) => {
      //     // Concat user data with application data
      //     const user = users[app.userId];
      //     return { ...user, ...app };
      //   })
      //   .filter((app) => app);
      const serverMemberApplications = await query(
        `SELECT * FROM member_applications 
        LEFT JOIN users ON member_applications.user_id = users.id
        WHERE member_applications.server_id = ? AND member_applications.application_status = 'pending' ORDER BY member_applications.created_at DESC`,
        [serverId],
      );
      if (!serverMemberApplications) return null;
      return serverMemberApplications;
    },

    // Category
    category: async (categoryId) => {
      // const categories = (await db.get('categories')) || {};
      // const category = categories[categoryId];
      // if (!category) return null;
      // return {
      //   ...category,
      // };
      const category = await query(
        `SELECT * FROM categories WHERE categories.id = ? ORDER BY categories.order ASC`,
        [categoryId],
      );
      if (!category) return null;
      return category;
    },

    // Channel
    channel: async (channelId) => {
      // const channels = (await db.get('channels')) || {};
      // const channel = channels[channelId];
      // if (!channel) return null;
      // return {
      //   ...channel,
      //   messages: [
      //     ...(await get.channelMessages(channelId)),
      //     ...(await get.channelInfoMessages(channelId)),
      //   ],
      // };
      const channel = await query(
        `SELECT * FROM channels WHERE channels.id = ? ORDER BY channels.order ASC`,
        [channelId],
      );
      if (!channel) return null;
      return channel;
    },
    channelMessages: async (channelId) => {
      // const messages = (await db.get('messages')) || {};
      // const members = (await db.get('members')) || {};
      // const users = (await db.get('users')) || {};
      // return Object.values(messages)
      //   .filter((msg) => msg.channelId === channelId && msg.type === 'general')
      //   .map((msg) => {
      //     // Concat user and member data with message data
      //     const member = members[`mb_${msg.senderId}-${msg.serverId}`];
      //     const user = users[msg.senderId];
      //     return { ...user, ...member, ...msg };
      //   })
      //   .filter((msg) => msg);
      const channelMessages = await query(
        `SELECT * FROM messages WHERE messages.channel_id = ? AND messages.type = 'general' ORDER BY messages.created_at DESC`,
        [channelId],
      );
      if (!channelMessages) return null;
      return channelMessages;
    },
    channelInfoMessages: async (channelId) => {
      // const messages = (await db.get('messages')) || {};
      // return Object.values(messages)
      //   .filter((msg) => msg.channelId === channelId && msg.type === 'info')
      //   .map((msg) => {
      //     return { ...msg };
      //   })
      //   .filter((msg) => msg);
      const channelInfoMessages = await query(
        `SELECT * FROM messages WHERE messages.channel_id = ? AND messages.type = 'info' ORDER BY messages.created_at DESC`,
        [channelId],
      );
      if (!channelInfoMessages) return null;
      return channelInfoMessages;
    },

    // Friend Group
    friendGroup: async (friendGroupId) => {
      // const friendGroups = (await db.get('friendGroups')) || {};
      // const friendGroup = friendGroups[friendGroupId];
      // if (!friendGroup) return null;
      // return {
      //   ...friendGroup,
      // };
      const friendGroup = await query(
        `SELECT * FROM friend_groups WHERE friend_groups.id = ? ORDER BY friend_groups.order DESC`,
        [friendGroupId],
      );
      if (!friendGroup) return null;
      return friendGroup;
    },

    // Member
    member: async (userId, serverId) => {
      // const members = (await db.get('members')) || {};
      // const member = members[`mb_${userId}-${serverId}`];
      // if (!member) return null;
      // return {
      //   ...member,
      // };
      const member = await query(
        `SELECT * FROM members WHERE members.user_id = ? AND members.server_id = ? ORDER BY members.created_at DESC`,
        [userId, serverId],
      );
      if (!member) return null;
      return member;
    },

    // Member Application
    memberApplication: async (userId, serverId) => {
      // const applications = (await db.get('memberApplications')) || {};
      // const application = applications[`ma_${userId}-${serverId}`];
      // if (!application) return null;
      // return {
      //   ...application,
      // };
      const memberApplication = await query(
        `SELECT * FROM member_applications WHERE member_applications.user_id = ? AND member_applications.server_id = ? ORDER BY member_applications.created_at DESC`,
        [userId, serverId],
      );
      if (!memberApplication) return null;
      return memberApplication;
    },

    // Friend
    friend: async (userId, targetId) => {
      // const friends = (await db.get('friends')) || {};
      // const friend = friends[`fd_${userId}-${targetId}`];
      // if (!friend) return null;
      // return {
      //   ...friend,
      // };
      const friend = await query(
        `SELECT * FROM friends WHERE friends.user_id = ? AND friends.target_id = ? ORDER BY friends.created_at DESC`,
        [userId, targetId],
      );
      if (!friend) return null;
      return friend;
    },

    // Friend Application
    friendApplication: async (senderId, receiverId) => {
      // const applications = (await db.get('friendApplications')) || {};
      // const application = applications[`fa_${senderId}-${receiverId}`];
      // if (!application) return null;
      // return {
      //   ...application,
      // };
      const friendApplication = await query(
        `SELECT * FROM friend_applications WHERE friend_applications.sender_id = ? AND friend_applications.receiver_id = ? ORDER BY friend_applications.created_at DESC`,
        [senderId, receiverId],
      );
      if (!friendApplication) return null;
      return friendApplication;
    },

    // Message
    message: async (messageId) => {
      // const messages = (await db.get('messages')) || {};
      // const message = messages[messageId];
      // if (!message) return null;
      // return {
      //   ...message,
      // };
      const message = await query(
        `SELECT * FROM messages WHERE messages.id = ? ORDER BY messages.created_at DESC`,
        [messageId],
      );
      if (!message) return null;
      return message;
    },

    directMessages: async (userId, targetId) => {
      // const directMessages = (await db.get('directMessages')) || {};
      // const users = (await db.get('users')) || {};
      // const userId1 = userId.localeCompare(targetId) < 0 ? userId : targetId;
      // const userId2 = userId.localeCompare(targetId) < 0 ? targetId : userId;
      // return Object.values(directMessages)
      //   .filter((dm) => dm.userId1 === userId1 && dm.userId2 === userId2)
      //   .map((dm) => {
      //     const user = users[dm.senderId];
      //     return { ...user, ...dm };
      //   })
      //   .filter((dm) => dm);
      const userId1 = userId.localeCompare(targetId) < 0 ? userId : targetId;
      const userId2 = userId.localeCompare(targetId) < 0 ? targetId : userId;
      const directMessages = await query(
        `SELECT * FROM direct_messages 
        LEFT JOIN users ON direct_messages.sender_id = users.id
        WHERE direct_messages.user_id1 = ? AND direct_messages.user_id2 = ? ORDER BY direct_messages.created_at DESC`,
        [userId1, userId2],
      );
      if (!directMessages) return null;
      return directMessages;
    },
  };

  delete = {
    user: async (userId) => {
      await query(`DELETE FROM users WHERE users.id = ?`, [userId]);
    },

    badge: async (badgeId) => {
      await query(`DELETE FROM badges WHERE badges.id = ?`, [badgeId]);
    },

    userBadge: async (userId, badgeId) => {
      await query(`DELETE FROM user_badges WHERE user_badges.id = ?`, [
        `ub_${userId}-${badgeId}`,
      ]);
    },

    userServer: async (userId, serverId) => {
      await query(`DELETE FROM user_servers WHERE user_servers.id = ?`, [
        `us_${userId}-${serverId}`,
      ]);
    },

    server: async (serverId) => {
      await query(`DELETE FROM servers WHERE servers.id = ?`, [serverId]);
    },

    channel: async (channelId) => {
      await query(`DELETE FROM channels WHERE channels.id = ?`, [channelId]);
    },

    friendGroup: async (friendGroupId) => {
      await query(`DELETE FROM friend_groups WHERE friend_groups.id = ?`, [
        friendGroupId,
      ]);
    },

    member: async (userId, serverId) => {
      await query(`DELETE FROM members WHERE members.id = ?`, [
        `mb_${userId}-${serverId}`,
      ]);
    },

    memberApplication: async (userId, serverId) => {
      await query(
        `DELETE FROM member_applications WHERE member_applications.id = ?`,
        [`ma_${userId}-${serverId}`],
      );
    },
    friend: async (userId, targetId) => {
      await query(`DELETE FROM friends WHERE friends.id = ?`, [
        `fd_${userId}-${targetId}`,
      ]);
    },

    friendApplication: async (senderId, receiverId) => {
      await query(
        `DELETE FROM friend_applications WHERE friend_applications.id = ?`,
        [`fa_${senderId}-${receiverId}`],
      );
    },

    message: async (messageId) => {
      await query(`DELETE FROM messages WHERE messages.id = ?`, [messageId]);
    },

    directMessage: async (userId1, userId2) => {
      const userId1 = userId1.localeCompare(userId2) < 0 ? userId1 : userId2;
      const userId2 = userId1.localeCompare(userId2) < 0 ? userId2 : userId1;
      await query(
        `DELETE FROM direct_messages WHERE direct_messages.user_id1 = ? AND direct_messages.user_id2 = ?`,
        [userId1, userId2],
      );
    },
  };

  async deleteAll() {
    const tables = [
      'account_passwords',
      'account_user_ids',
      'users',
      'badges',
      'user_badges',
      'user_servers',
      'servers',
      'channels',
      'friend_groups',
      'channel_relations',
      'members',
      'member_applications',
      'friends',
      'friend_applications',
      'messages',
      'direct_messages',
      'voice_presences',
    ];

    for (const table of tables) {
      await query(`TRUNCATE TABLE ${table}`);
    }
  }
}

const db = new Database();

module.exports = db;
