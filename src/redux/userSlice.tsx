/* eslint-disable @typescript-eslint/no-unused-vars */
import { createSlice } from '@reduxjs/toolkit';

// Types
import { User } from '@/types';

const userSlice = createSlice({
  name: 'userSlice',
  initialState: {
    id: '',
    name: '未知使用者',
    avatar: '',
    avatarUrl: '',
    signature: '',
    status: 'online',
    gender: 'Male',
    level: 0,
    xp: 0,
    requiredXp: 0,
    progress: 0,
    currentChannelId: '',
    currentServerId: '',
    lastActiveAt: 0,
    createdAt: 0,
  } as User,
  reducers: {
    setUser: (state, action: { payload: User | Partial<User> }) => {
      return { ...state, ...action.payload };
    },
    clearUser: (state) => {
      return {
        id: '',
        name: '未知使用者',
        avatar: '',
        avatarUrl: '',
        signature: '',
        status: 'online',
        gender: 'Male',
        level: 0,
        xp: 0,
        requiredXp: 0,
        progress: 0,
        currentChannelId: '',
        currentServerId: '',
        lastActiveAt: 0,
        createdAt: 0,
      };
    },
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
