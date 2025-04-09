// /* eslint-disable @typescript-eslint/no-require-imports */
// const { QuickDB } = require('quick.db');
// const db = new QuickDB();
// // Utils
// const Func = require('./func');

// const get = {
//   // Avatar
//   avatar: async (avatarUrl) => {
//     return `data:image/png;base64,${avatarUrl}`;
//   },

//   // User
//   searchUser: async (query) => {
//     const users = (await db.get('users')) || {};
//     const accountUserIds = (await db.get('accountUserIds')) || {};
//     const target = Object.values(users).find(
//       (u) => u.id === accountUserIds[query],
//     );
//     if (!target) return null;
//     return target;
//   },
//   user: async (userId) => {
//     const users = (await db.get('users')) || {};
//     const user = users[userId];
//     if (!user) return null;
//     return {
//       ...user,
//       badges: await get.userBadges(userId),
//       friends: await get.userFriends(userId),
//       friendGroups: await get.userFriendGroups(userId),
//       friendApplications: await get.userFriendApplications(userId),
//       joinedServers: await get.userJoinedServers(userId),
//       recentServers: await get.userRecentServers(userId),
//       ownedServers: await get.userOwnedServers(userId),
//       favServers: await get.userFavServers(userId),
//     };
//   },
//   userFriendGroups: async (userId) => {
//     const friendGroups = (await db.get('friendGroups')) || {};
//     return Object.values(friendGroups)
//       .filter((fg) => fg.userId === userId)
//       .sort((a, b) => b.order - a.order)
//       .filter((fg) => fg);
//   },
//   userBadges: async (userId) => {
//     const userBadges = (await db.get('userBadges')) || {};
//     const badges = (await db.get('badges')) || {};
//     return Object.values(userBadges)
//       .filter((ub) => ub.userId === userId)
//       .map((ub) => badges[ub.badgeId])
//       .sort((a, b) => b.order - a.order)
//       .filter((b) => b);
//   },
//   userServers: async (userId) => {
//     const userServers = (await db.get('userServers')) || {};
//     const servers = (await db.get('servers')) || {};
//     return Object.values(userServers)
//       .filter((us) => us.userId === userId)
//       .map((us) => {
//         // Concat server data with user server data
//         const server = servers[us.serverId];
//         return { ...us, ...server };
//       })
//       .filter((s) => s);
//   },
//   // Will be deprecated
//   userJoinedServers: async (userId) => {
//     const members = (await db.get('members')) || {};
//     const servers = (await db.get('servers')) || {};
//     return Object.values(members)
//       .filter((mb) => mb.userId === userId)
//       .map((mb) => servers[mb.serverId])
//       .sort((a, b) => b.name.localeCompare(a.name))
//       .filter((s) => s);
//   },
//   // Will be deprecated
//   userRecentServers: async (userId) => {
//     const userServers = (await db.get('userServers')) || {};
//     const servers = (await db.get('servers')) || {};
//     return Object.values(userServers)
//       .filter((us) => us.userId === userId && us.recent)
//       .sort((a, b) => b.timestamp - a.timestamp)
//       .map((us) => servers[us.serverId])
//       .filter((s) => s)
//       .slice(0, 10);
//   },
//   // Will be deprecated
//   userOwnedServers: async (userId) => {
//     const userServers = (await db.get('userServers')) || {};
//     const servers = (await db.get('servers')) || {};
//     return Object.values(userServers)
//       .filter((us) => us.userId === userId && us.owned)
//       .map((us) => servers[us.serverId])
//       .sort((a, b) => b.name.localeCompare(a.name))
//       .filter((s) => s);
//   },
//   // Will be deprecated
//   userFavServers: async (userId) => {
//     const userServers = (await db.get('userServers')) || {};
//     const servers = (await db.get('servers')) || {};
//     return Object.values(userServers)
//       .filter((us) => us.userId === userId && us.favorite)
//       .map((us) => servers[us.serverId])
//       .sort((a, b) => b.name.localeCompare(a.name))
//       .filter((s) => s);
//   },
//   userMembers: async (userId) => {
//     const members = (await db.get('members')) || {};
//     const servers = (await db.get('servers')) || {};
//     return Object.values(members)
//       .filter((mb) => mb.userId === userId)
//       .map((mb) => {
//         // Concat member data with server data
//         const server = servers[mb.serverId];
//         return { ...server, ...mb };
//       })
//       .filter((mb) => mb);
//   },
//   userFriends: async (userId) => {
//     const friends = (await db.get('friends')) || {};
//     const users = (await db.get('users')) || {};
//     return Object.values(friends)
//       .filter((fd) => fd.userId === userId)
//       .map((fd) => {
//         // Concat user data with friend data
//         const user = users[fd.targetId];
//         return { ...user, ...fd };
//       })
//       .filter((fd) => fd);
//   },
//   userFriendApplications: async (userId) => {
//     const applications = (await db.get('friendApplications')) || {};
//     const users = (await db.get('users')) || {};
//     return Object.values(applications)
//       .filter(
//         (app) =>
//           app.receiverId === userId && app.applicationStatus === 'pending',
//       )
//       .map((app) => {
//         // Concat user data with friend application data
//         const user = users[app.senderId];
//         return { ...user, ...app };
//       })
//       .filter((app) => app);
//   },

//   // Server
//   searchServer: async (query) => {
//     const servers = (await db.get('servers')) || {};

//     const isServerMatch = (server, query) => {
//       const _query = String(query).trim().toLowerCase();
//       const _name = String(server.name).trim().toLowerCase();
//       const _displayId = String(server.displayId).trim().toLowerCase();

//       if (server.visibility === 'invisible' && _displayId !== _query)
//         return false;
//       return (
//         Func.calculateSimilarity(_name, _query) >= 0.5 ||
//         _name.includes(_query) ||
//         _displayId === _query
//       );
//     };

//     return Object.values(servers)
//       .filter((s) => isServerMatch(s, query))
//       .filter((s) => s)
//       .slice(0, 10);
//   },
//   server: async (serverId) => {
//     const servers = (await db.get('servers')) || {};
//     const server = servers[serverId];
//     if (!server) return null;
//     return {
//       ...server,
//       channels: await get.serverChannels(serverId),
//       members: await get.serverMembers(serverId),
//       users: await get.serverUsers(serverId),
//       memberApplications: await get.serverMemberApplications(serverId),
//     };
//   },
//   // Change name to serverActiveMembers
//   serverUsers: async (serverId) => {
//     const members = (await db.get('members')) || {};
//     const users = (await db.get('users')) || {};
//     return Object.values(members)
//       .filter((mb) => mb.serverId === serverId)
//       .map((mb) => {
//         // Concat user data with member data
//         const user = users[mb.userId];
//         return { ...user, ...mb };
//       })
//       .filter((mb) => mb.currentServerId === serverId)
//       .filter((mb) => mb);
//   },
//   serverChannels: async (serverId) => {
//     const channels = (await db.get('channels')) || {};
//     const categories = (await db.get('categories')) || {};
//     return Object.values({ ...channels, ...categories })
//       .filter((ch) => ch.serverId === serverId)
//       .sort((a, b) => a.order - b.order)
//       .filter((ch) => ch);
//   },
//   serverMembers: async (serverId) => {
//     const members = (await db.get('members')) || {};
//     const users = (await db.get('users')) || {};
//     return Object.values(members)
//       .filter((mb) => mb.serverId === serverId)
//       .map((mb) => {
//         // Concat user data with member data
//         const user = users[mb.userId];
//         return { ...user, ...mb };
//       })
//       .filter((mb) => mb);
//   },
//   serverMemberApplications: async (serverId) => {
//     const applications = (await db.get('memberApplications')) || {};
//     const users = (await db.get('users')) || {};
//     return Object.values(applications)
//       .filter(
//         (app) =>
//           app.serverId === serverId && app.applicationStatus === 'pending',
//       )
//       .map((app) => {
//         // Concat user data with application data
//         const user = users[app.userId];
//         return { ...user, ...app };
//       })
//       .filter((app) => app);
//   },

//   // Category
//   category: async (categoryId) => {
//     const categories = (await db.get('categories')) || {};
//     const category = categories[categoryId];
//     if (!category) return null;
//     return {
//       ...category,
//     };
//   },

//   // Channel
//   channel: async (channelId) => {
//     const channels = (await db.get('channels')) || {};
//     const channel = channels[channelId];
//     if (!channel) return null;
//     return {
//       ...channel,
//       messages: [
//         ...(await get.channelMessages(channelId)),
//         ...(await get.channelInfoMessages(channelId)),
//       ],
//     };
//   },
//   channelMessages: async (channelId) => {
//     const messages = (await db.get('messages')) || {};
//     const members = (await db.get('members')) || {};
//     const users = (await db.get('users')) || {};
//     return Object.values(messages)
//       .filter((msg) => msg.channelId === channelId && msg.type === 'general')
//       .map((msg) => {
//         // Concat user and member data with message data
//         const member = members[`mb_${msg.senderId}-${msg.serverId}`];
//         const user = users[msg.senderId];
//         return { ...user, ...member, ...msg };
//       })
//       .filter((msg) => msg);
//   },
//   channelInfoMessages: async (channelId) => {
//     const messages = (await db.get('messages')) || {};
//     return Object.values(messages)
//       .filter((msg) => msg.channelId === channelId && msg.type === 'info')
//       .map((msg) => {
//         return { ...msg };
//       })
//       .filter((msg) => msg);
//   },

//   // Friend Group
//   friendGroup: async (friendGroupId) => {
//     const friendGroups = (await db.get('friendGroups')) || {};
//     const friendGroup = friendGroups[friendGroupId];
//     if (!friendGroup) return null;
//     return {
//       ...friendGroup,
//     };
//   },

//   // Member
//   member: async (userId, serverId) => {
//     const members = (await db.get('members')) || {};
//     const member = members[`mb_${userId}-${serverId}`];
//     if (!member) return null;
//     return {
//       ...member,
//     };
//   },

//   // Member Application
//   memberApplication: async (userId, serverId) => {
//     const applications = (await db.get('memberApplications')) || {};
//     const application = applications[`ma_${userId}-${serverId}`];
//     if (!application) return null;
//     return {
//       ...application,
//     };
//   },

//   // Friend
//   friend: async (userId, targetId) => {
//     const friends = (await db.get('friends')) || {};
//     const friend = friends[`fd_${userId}-${targetId}`];
//     if (!friend) return null;
//     return {
//       ...friend,
//     };
//   },

//   // Friend Application
//   friendApplication: async (senderId, receiverId) => {
//     const applications = (await db.get('friendApplications')) || {};
//     const application = applications[`fa_${senderId}-${receiverId}`];
//     if (!application) return null;
//     return {
//       ...application,
//     };
//   },

//   // Message
//   message: async (messageId) => {
//     const messages = (await db.get('messages')) || {};
//     const message = messages[messageId];
//     if (!message) return null;
//     return {
//       ...message,
//     };
//   },

//   directMessages: async (userId, targetId) => {
//     const directMessages = (await db.get('directMessages')) || {};
//     const users = (await db.get('users')) || {};
//     const userId1 = userId.localeCompare(targetId) < 0 ? userId : targetId;
//     const userId2 = userId.localeCompare(targetId) < 0 ? targetId : userId;
//     return Object.values(directMessages)
//       .filter((dm) => dm.userId1 === userId1 && dm.userId2 === userId2)
//       .map((dm) => {
//         const user = users[dm.senderId];
//         return { ...user, ...dm };
//       })
//       .filter((dm) => dm);
//   },
// };

// module.exports = { ...get };
