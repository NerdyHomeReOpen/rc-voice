const { QuickDB } = require('quick.db');
const db = new QuickDB();

const get = {
  // User
  user: async (userId) => {
    const users = (await db.get('users')) || {};
    const user = users[userId];
    if (!user) return null;
    return {
      ...user,
      members: await get.userMembers(userId),
      badges: await get.userBadges(userId),
      friends: await get.userFriends(userId),
      friendGroups: await get.userFriendGroups(userId),
      friendApplications: await get.userFriendApplications(userId),
    };
  },
  userBadges: async (userId) => {
    const userBadges = (await db.get('userBadges')) || {};
    const badges = (await db.get('badges')) || {};
    return [
      ...Object.values(userBadges)
        .filter((ub) => ub.userId === userId)
        .map((ub) => badges[ub.badgeId])
        .filter((badge) => badge),
    ];
  },
  userMembers: async (userId) => {
    const members = (await db.get('members')) || {};
    return [
      ...Object.values(members).filter((member) => member.userId === userId),
    ];
  },
  userFriends: async (userId) => {
    const friends = (await db.get('friends')) || {};
    return [
      ...Object.values(friends).filter(
        (friend) => friend.user1Id === userId || friend.user2Id === userId,
      ),
    ];
  },
  userFriendGroups: async (userId) => {
    const friendGroups = (await db.get('friendGroups')) || {};
    return [
      ...Object.values(friendGroups).filter((group) => group.userId === userId),
    ];
  },
  userFriendApplications: async (userId) => {
    const friendApplications = (await db.get('friendApplications')) || {};
    return [
      ...Object.values(friendApplications).filter(
        (app) => app.recieverId === userId,
      ),
    ];
  },
  // Server
  server: async (serverId) => {
    const servers = (await db.get('servers')) || {};
    const channels = (await db.get('channels')) || {};
    const users = (await db.get('users')) || {};
    const server = servers[serverId];
    if (!server) return null;
    return {
      ...server,
      lobby: channels[server.lobbyId],
      owner: users[server.ownerId],
      channels: await get.serverChannels(serverId),
      members: await get.serverMembers(serverId),
      applications: await get.serverApplications(serverId),
    };
  },
  serverChannels: async (serverId) => {
    const channels = (await db.get('channels')) || {};
    return [
      ...Object.values(channels).filter(
        (channel) => channel.serverId === serverId,
      ),
    ];
  },
  serverMembers: async (serverId) => {
    const members = (await db.get('members')) || {};
    return [
      ...Object.values(members).filter(
        (member) => member.serverId === serverId,
      ),
    ];
  },
  serverApplications: async (serverId) => {
    const serverApplications = (await db.get('serverApplications')) || {};
    return [
      ...Object.values(serverApplications).filter(
        (app) => app.serverId === serverId,
      ),
    ];
  },
  // Channel
  channel: async (channelId) => {
    const channels = (await db.get('channels')) || {};
    const channel = channels[channelId];
    if (!channel) return null;
    return {
      ...channel,
      users: await get.channelUsers(channelId),
      messages: await get.channelMessage(channelId),
      subChannel: await get.channelChildren(channelId),
    };
  },
  channelUsers: async (channelId) => {
    const users = (await db.get('users')) || {};
    return [
      ...Object.values(users).filter(
        (user) => user.currentChannelId === channelId,
      ),
    ];
  },
  channelMessage: async (channelId) => {
    const messages = (await db.get('messages')) || {};
    return [
      ...Object.values(messages).filter(
        (message) => message.channelId === channelId,
      ),
    ];
  },
  channelChildren: async (channelId) => {
    const channelRelations = (await db.get('channelRelations')) || {};
    const channels = (await db.get('channels')) || {};
    return [
      ...Object.values(channelRelations)
        .filter((relation) => relation.parentId === channelId)
        .map((relation) => channels[relation.childId])
        .filter((channel) => channel),
    ];
  },
  // Message
  message: async (messageId) => {
    const messages = (await db.get('messages')) || {};
    const users = (await db.get('users')) || {};
    const message = messages[messageId];
    if (!message) return null;
    return {
      ...message,
      sender: users[message.senderId],
    };
  },
  // DirectMessage
  directMessages: async (directMessageId) => {
    const directMessages = (await db.get('directMessages')) || {};
    const users = (await db.get('users')) || {};
    const directMessage = directMessages[directMessageId];
    if (!directMessage) return null;
    return {
      ...directMessage,
      sender: users[message.senderId],
    };
  },
  // Friend
  friend: async (friendId) => {
    const friends = (await db.get('friends')) || {};
    const users = (await db.get('users')) || {};
    const friend = friends[friendId];
    if (!friend) return null;
    return {
      ...friend,
      users: [users[friend.user1Id], users[friend.user2Id]],
      directMessages: await get.friendDriectMessages(friendId),
    };
  },
  friendDriectMessages: async (friendId) => {
    const directMessages = (await db.get('directMessages')) || {};
    return [
      ...Object.values(directMessages).filter(
        (directMessage) => directMessage.friendId === friendId,
      ),
    ];
  },
};

module.exports = { ...get };
