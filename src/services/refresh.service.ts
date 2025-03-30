// Services
import apiService from '@/services/api.service';

// Types
import {
  User,
  Server,
  Channel,
  FriendApplication,
  Friend,
  MemberApplication,
  Member,
} from '@/types';

export const refreshService = {
  user: async ({ userId }: { userId: User['id'] }): Promise<User | null> => {
    const user = await apiService.post('/refresh/user', { userId });
    return user;
  },

  server: async ({
    serverId,
  }: {
    serverId: Server['id'];
  }): Promise<Server | null> => {
    const server = await apiService.post('/refresh/server', { serverId });
    return server;
  },

  channel: async ({
    channelId,
  }: {
    channelId: Channel['id'];
  }): Promise<Channel | null> => {
    const channel = await apiService.post('/refresh/channel', { channelId });
    return channel;
  },

  friendApplication: async ({
    senderId,
    receiverId,
  }: {
    senderId: User['id'];
    receiverId: User['id'];
  }): Promise<FriendApplication | null> => {
    const friendApplication = await apiService.post(
      '/refresh/friendApplication',
      { senderId, receiverId },
    );
    return friendApplication;
  },

  friend: async ({
    userId,
    targetId,
  }: {
    userId: User['id'];
    targetId: User['id'];
  }): Promise<Friend | null> => {
    const friend = await apiService.post('/refresh/friend', {
      userId,
      targetId,
    });
    return friend;
  },

  memberApplication: async ({
    userId,
    serverId,
  }: {
    userId: User['id'];
    serverId: Server['id'];
  }): Promise<MemberApplication | null> => {
    const memberApplication = await apiService.post(
      '/refresh/memberApplication',
      { userId, serverId },
    );
    return memberApplication;
  },

  member: async ({
    userId,
    serverId,
  }: {
    userId: User['id'];
    serverId: Server['id'];
  }): Promise<Member | null> => {
    const member = await apiService.post('/refresh/member', {
      userId,
      serverId,
    });
    return member;
  },
};

export default refreshService;
