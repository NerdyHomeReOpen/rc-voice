/* eslint-disable @typescript-eslint/no-unused-vars */
import { createSlice } from '@reduxjs/toolkit';

// Types
import { Channel } from '@/types';

const channelSlice = createSlice({
  name: 'channelSlice',
  initialState: {
    id: '',
    name: '未知頻道',
    isRoot: false,
    isCategory: false,
    isLobby: false,
    voiceMode: 'free',
    chatMode: 'free',
    order: 0,
    serverId: '',
    settings: {
      bitrate: 0,
      slowmode: false,
      userLimit: -1,
      visibility: 'public',
    },
    createdAt: 0,
  } as Channel,
  reducers: {
    setChannel: (state, action: { payload: Channel | Partial<Channel> }) => {
      return { ...state, ...action.payload };
    },
    clearChannel: (state) => {
      return {
        id: '',
        name: '未知頻道',
        isRoot: false,
        isCategory: false,
        isLobby: false,
        voiceMode: 'free',
        chatMode: 'free',
        order: 0,
        serverId: '',
        settings: {
          bitrate: 0,
          slowmode: false,
          userLimit: -1,
          visibility: 'public',
        },
        createdAt: 0,
      };
    },
  },
});

export const { setChannel, clearChannel } = channelSlice.actions;
export default channelSlice.reducer;
