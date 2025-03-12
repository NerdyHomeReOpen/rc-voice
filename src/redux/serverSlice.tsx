/* eslint-disable @typescript-eslint/no-unused-vars */
import { createSlice } from '@reduxjs/toolkit';

// Types
import { Server } from '@/types';

const serverSlice = createSlice({
  name: 'serverSlice',
  initialState: {
    id: '',
    name: '未知伺服器',
    avatar: '',
    avatarUrl: '/logo_server_def.png',
    announcement: '',
    description: '',
    type: 'other',
    displayId: '00000000',
    slogan: '',
    level: 0,
    wealth: 0,
    lobbyId: '',
    ownerId: '',
    settings: {
      allowDirectMessage: false,
      visibility: 'public',
      defaultChannelId: '',
    },
    createdAt: 0,
  } as Server,
  reducers: {
    setServer: (state, action: { payload: Server | Partial<Server> }) => {
      return { ...state, ...action.payload };
    },
    clearServer: (state) => {
      return {
        id: '',
        name: '未知伺服器',
        avatar: '',
        avatarUrl: '/logo_server_def.png',
        announcement: '',
        description: '',
        type: 'other',
        displayId: '00000000',
        slogan: '',
        level: 0,
        wealth: 0,
        lobbyId: '',
        ownerId: '',
        settings: {
          allowDirectMessage: false,
          visibility: 'public',
          defaultChannelId: '',
        },
        createdAt: 0,
      };
    },
  },
});

export const { setServer, clearServer } = serverSlice.actions;
export default serverSlice.reducer;
