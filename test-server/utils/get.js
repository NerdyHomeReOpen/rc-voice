/* eslint-disable @typescript-eslint/no-require-imports */
const { QuickDB } = require('quick.db');
const db = new QuickDB();

const get = {
  // Avatar
  avatar: async (avatarUrl) => {
    return `data:image/png;base64,${avatarUrl}`;
  },

  // User
  user: async (userId) => {
    const users = (await db.get('users')) || {};
    const user = users[userId];
    if (!user) return null;
    return {
      ...user,
      badges: await get.userBadges(userId),
      friends: await get.userFriends(userId),
      friendGroups: await get.userFriendGroups(userId),
      friendApplications: await get.userFriendApplications(userId),
      joinedServers: await get.userJoinedServers(userId),
      recentServers: await get.userRecentServers(userId),
      ownedServers: await get.userOwnedServers(userId),
      favServers: await get.userFavServers(userId),
    };
  },
  userFriendGroups: async (userId) => {
    const friendGroups = (await db.get('friendGroups')) || {};
    return Object.values(friendGroups)
      .filter((fg) => fg.userId === userId)
      .sort((a, b) => b.order - a.order)
      .filter((fg) => fg);
  },
  userBadges: async (userId) => {
    const userBadges = (await db.get('userBadges')) || {};
    const badges = (await db.get('badges')) || {};
    return Object.values(userBadges)
      .filter((ub) => ub.userId === userId)
      .map((ub) => badges[ub.badgeId])
      .sort((a, b) => b.order - a.order)
      .filter((b) => b);
  },
  userJoinedServers: async (userId) => {
    const members = (await db.get('members')) || {};
    const servers = (await db.get('servers')) || {};
    return Object.values(members)
      .filter((mb) => mb.userId === userId)
      .map((mb) => servers[mb.serverId])
      .sort((a, b) => b.name.localeCompare(a.name))
      .filter((s) => s);
  },
  userRecentServers: async (userId) => {
    const userServers = (await db.get('userServers')) || {};
    const servers = (await db.get('servers')) || {};
    return Object.values(userServers)
      .filter((us) => us.userId === userId && us.recent)
      .map((us) => servers[us.serverId])
      .sort((a, b) => b.timestamp - a.timestamp)
      .filter((_, index) => index < 10)
      .filter((s) => s);
  },
  userOwnedServers: async (userId) => {
    const userServers = (await db.get('userServers')) || {};
    const servers = (await db.get('servers')) || {};
    return Object.values(userServers)
      .filter((us) => us.userId === userId && us.owned)
      .map((us) => servers[us.serverId])
      .sort((a, b) => b.name.localeCompare(a.name))
      .filter((s) => s);
  },
  userFavServers: async (userId) => {
    const userServers = (await db.get('userServers')) || {};
    const servers = (await db.get('servers')) || {};
    return Object.values(userServers)
      .filter((us) => us.userId === userId && us.favorite)
      .map((us) => servers[us.serverId])
      .sort((a, b) => b.name.localeCompare(a.name))
      .filter((s) => s);
  },
  userMembers: async (userId) => {
    const members = (await db.get('members')) || {};
    const servers = (await db.get('servers')) || {};
    return Object.values(members)
      .filter((mb) => mb.userId === userId)
      .map((mb) => {
        // Concat member data with server data
        const server = servers[mb.serverId];
        return { ...server, ...mb };
      })
      .filter((mb) => mb);
  },
  userFriends: async (userId) => {
    const friends = (await db.get('friends')) || {};
    const users = (await db.get('users')) || {};
    return Object.values(friends)
      .filter((fd) => fd.user1Id === userId || fd.user2Id === userId)
      .map((fd) => {
        // Concat user data with friend data
        const user = users[fd.user1Id === userId ? fd.user2Id : fd.user1Id];
        return { ...user, ...fd };
      })
      .filter((fd) => fd);
  },
  userFriendApplications: async (userId) => {
    const applications = (await db.get('friendApplications')) || {};
    const users = (await db.get('users')) || {};
    return Object.values(applications)
      .filter((app) => app.recieverId === userId)
      .map((app) => {
        // Concat user data with friend application data
        const user = users[app.senderId];
        return { ...user, ...app };
      })
      .filter((app) => app);
  },

  // Server
  server: async (serverId) => {
    const servers = (await db.get('servers')) || {};
    const server = servers[serverId];
    if (!server) return null;
    return {
      ...server,
      lobby: await get.channel(server.lobbyId),
      owner: await get.user(server.ownerId),
      users: await get.serverUsers(serverId),
      channels: await get.serverChannels(serverId),
      members: await get.serverMembers(serverId),
      memberApplications: await get.serverApplications(serverId),
    };
  },
  serverUsers: async (serverId) => {
    const users = (await db.get('users')) || {};
    return Object.values(users)
      .filter((u) => u.currentServerId === serverId)
      .sort((a, b) => b.lastActiveAt - a.lastActiveAt)
      .filter((u) => u);
  },
  serverChannels: async (serverId) => {
    const channels = (await db.get('channels')) || {};
    const categories = (await db.get('categories')) || {};
    return Object.values({ ...channels, ...categories })
      .filter((ch) => ch.serverId === serverId)
      .sort((a, b) => a.order - b.order)
      .filter((ch) => ch);
  },
  serverMembers: async (serverId) => {
    const members = (await db.get('members')) || {};
    const users = (await db.get('users')) || {};
    return Object.values(members)
      .filter((mb) => mb.serverId === serverId)
      .map((mb) => {
        // Concat user data with member data
        const user = users[mb.userId];
        return { ...user, ...mb };
      })
      .filter((mb) => mb);
  },
  serverApplications: async (serverId) => {
    const applications = (await db.get('memberApplications')) || {};
    const users = (await db.get('users')) || {};
    return Object.values(applications)
      .filter((app) => app.serverId === serverId)
      .map((app) => {
        // Concat user data with application data
        const user = users[app.userId];
        return { ...user, ...app };
      })
      .filter((app) => app);
  },

  // Category
  category: async (categoryId) => {
    const categories = (await db.get('categories')) || {};
    const category = categories[categoryId];
    if (!category) return null;
    return {
      ...category,
    };
  },

  // Channel
  channel: async (channelId) => {
    const channels = (await db.get('channels')) || {};
    const channel = channels[channelId];
    if (!channel) return null;
    return {
      ...channel,
      messages: await get.channelMessages(channelId),
    };
  },
  channelMessages: async (channelId) => {
    const messages = (await db.get('messages')) || {};
    const users = (await db.get('users')) || {};
    return Object.values(messages)
      .filter((msg) => msg.channelId === channelId)
      .map((msg) => {
        // Concat user data with message data
        const user = users[msg.senderId];
        return { ...user, ...msg };
      })
      .filter((msg) => msg);
  },

  // Member
  member: async (userId, serverId) => {
    const members = (await db.get('members')) || {};
    const member = members[`mb_${userId}-${serverId}`];
    if (!member) return null;
    return {
      ...member,
    };
  },

  // Member Application
  memberApplication: async (userId, serverId) => {
    const applications = (await db.get('memberApplications')) || {};
    const application = applications[`ma_${userId}-${serverId}`];
    if (!application) return null;
    return {
      ...application,
    };
  },

  // Friend
  friend: async (userId1, userId2) => {
    const friends = (await db.get('friends')) || {};
    const friend =
      friends[`fd_${userId1}-${userId2}`] ||
      friends[`fd_${userId2}-${userId1}`];
    if (!friend) return null;
    return {
      ...friend,
      directMessages: await get.friendDirectMessages(friend.id),
    };
  },
  friendDirectMessages: async (friendId) => {
    const directMessages = (await db.get('directMessages')) || {};
    const users = (await db.get('users')) || {};
    return Object.values(directMessages)
      .filter((dm) => dm.friendId === friendId)
      .map((dm) => {
        // Concat user data with direct message data
        const user = users[dm.senderId];
        return { ...user, ...dm };
      })
      .filter((dm) => dm);
  },

  // Friend Application
  friendApplication: async (userId1, userId2) => {
    const applications = (await db.get('friendApplications')) || {};
    const application =
      applications[`fa_${userId1}-${userId2}`] ||
      applications[`fa_${userId2}-${userId1}`];
    if (!application) return null;
    return {
      ...application,
    };
  },

  // Message
  message: async (messageId) => {
    const messages = (await db.get('messages')) || {};
    const message = messages[messageId];
    if (!message) return null;
    return {
      ...message,
    };
  },

  // DirectMessage
  directMessages: async (directMessageId) => {
    const directMessages = (await db.get('directMessages')) || {};
    const directMessage = directMessages[directMessageId];
    if (!directMessage) return null;
    return {
      ...directMessage,
    };
  },
};

module.exports = { ...get };
