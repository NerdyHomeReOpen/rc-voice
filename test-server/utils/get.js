const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
  server: async (serverId) => {
    const servers = (await db.get('servers')) || {};
    const server = servers[serverId];
    if (!server) return null;

    // Get all channels including child channels
    const allChannels = await Promise.all(
      server.channelIds.map(async (channelId) => await getChannels(channelId)),
    );

    // Filter out any null channels and ensure hierarchy is preserved
    const channels = allChannels
      .filter((channel) => channel)
      .map((channel) => {
        // Preserve parent-child relationships
        if (channel.parentId) {
          const parent = allChannels.find((c) => c.id === channel.parentId);
          if (parent) {
            parent.isCategory = true;
          }
        }
        return channel;
      });

    return {
      ...server,
      members: await getServerMembers(serverId),
      channels: channels,
      lobby: await getChannels(server.lobbyId),
      owner: await getUser(server.ownerId),
    };
  },
  channel: async (channelId) => {
    const _channels = (await db.get('channels')) || {};
    const channel = _channels[channelId];
    if (!channel) return null;
    return {
      ...channel,
      users: (
        await Promise.all(
          channel.userIds.map(async (userId) => await getUser(userId)),
        )
      ).filter((user) => user),
      messages: (
        await Promise.all(
          channel.messageIds.map(
            async (messageId) => await getMessages(messageId),
          ),
        )
      ).filter((message) => message),
    };
  },
  message: async (messageId) => {
    const _messages = (await db.get('messages')) || {};
    const message = _messages[messageId];
    if (!message) return null;
    return {
      ...message,
      sender: await getUser(message.senderId),
    };
  },
  user: async (userId) => {
    const _users = (await db.get('users')) || {};
    const user = _users[userId];
    if (!user) return null;
    const { account, ...restUser } = user;
    const xpInfo = {
      xp: user.xp || 0,
      required: calculateRequiredXP(user.level),
      progress: ((user.xp || 0) / calculateRequiredXP(user.level)) * 100,
    };

    return {
      ...restUser,
      xpInfo,
      badges: await getUserBadges(userId),
      presence: await getPresenceState(userId),
    };
  },
  userBadges: async (userId) => {
    const _users = (await db.get('users')) || {};
    const _badges = (await db.get('badgeList')) || {};
    const userBadges = _users[userId].badgeIds
      .map((badgeId) => _badges[badgeId])
      .filter((badge) => badge);
    if (!userBadges) return null;
    return [...userBadges];
  },
  member: async (userId, serverId) => {
    const _members = (await db.get('members')) || {};
    const member = Object.values(_members).find(
      (member) => member.userId === userId && member.serverId === serverId,
    );
    if (!member) return null;
    return member;
  },
  userMembers: async (userId) => {
    const _members = (await db.get('members')) || {};
    const members = Object.values(_members).reduce((result, member) => {
      if (member?.userId === userId) {
        result[member.serverId] = member;
      }
      return result;
    }, {});
    if (!members) return null;
    return {
      ...members,
    };
  },
  serverMembers: async (serverId) => {
    const _members = (await db.get('members')) || {};
    const members = Object.values(_members).reduce((result, member) => {
      if (member?.serverId === serverId) {
        result[member.userId] = member;
      }
      return result;
    }, {});
    if (!members) return null;
    return {
      ...members,
    };
  },
  userFriendGroups: async (userId) => {
    const _friendCategories = (await db.get('friendCategories')) || {};
    const userFriendCategories = Object.values(_friendCategories).filter(
      (fs) => fs.userId === userId,
    );
    if (!userFriendCategories) return null;
    return [
      ...(
        await Promise.all(
          userFriendCategories.map(
            async (category) => await getFriendCategory(category.id),
          ),
        )
      ).filter((category) => category),
    ];
  },
  friendGroup: async (categoryId) => {
    const _friendCategories = (await db.get('friendCategories')) || {};
    const category = _friendCategories[categoryId];
    if (!category) return null;
    return {
      ...category,
      friends: (
        await Promise.all(
          category.friendIds.map(
            async (friendId) => await getFriend(category.userId, friendId),
          ),
        )
      ).filter((friend) => friend),
    };
  },
  userFriends: async (userId) => {
    const _friends = (await db.get('friends')) || {};
    const friends = Object.values(_friends).filter((friend) =>
      friend.userIds.includes(userId),
    );
    if (!friends) return null;
    return [...friends];
  },
  friend: async (userId, friendId) => {
    const _friends = (await db.get('friends')) || {};
    const friend = Object.values(_friends).find(
      (friend) =>
        friend.userIds.includes(userId) && friend.userIds.includes(friendId),
    );
    if (!friend) return null;
    return {
      ...friend,
      user: await getUser(friend.userIds.find((id) => id !== userId)),
      messages: (
        await Promise.all(
          friend.messageIds.map(
            async (messageId) => await getMessages(messageId),
          ),
        )
      ).filter((message) => message),
    };
  },
  directMessages: async (userId, friendId) => {
    const friend = await getFriend(userId, friendId);
    if (!friend) return null;
    return [...friend.messages];
  },
  displayId: async (baseId = 20000000) => {
    const servers = (await db.get('servers')) || {};
    let displayId = baseId + Object.keys(servers).length;
    // Ensure displayId is unique
    while (
      Object.values(servers).some((server) => server.displayId === displayId)
    ) {
      displayId++;
    }
    return displayId;
  },
  serverApplications: async (serverId) => {
    const _serverApplications = (await db.get('serverApplications')) || {};
    const serverApplications = Object.values(_serverApplications).filter(
      (app) => app.serverId === serverId,
    );
    if (!serverApplications) return null;
    return [
      ...(
        await Promise.all(
          serverApplications.map(async (app) => {
            return {
              ...app,
              user: await getUser(app.userId),
            };
          }),
        )
      ).filter((app) => app),
    ];
  },
};
