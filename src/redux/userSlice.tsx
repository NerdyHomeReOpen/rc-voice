/* eslint-disable @typescript-eslint/no-unused-vars */
import { createSlice } from '@reduxjs/toolkit';

// Types
import { User } from '@/types';

const userSlice = createSlice({
  name: 'userSlice',
  initialState: null as User | null,
  reducers: {
    setUser: (state, action: { payload: User }) => {
      return action.payload;
    },
    clearUser: (state) => {
      return null;
    },
    updateUser: (state, action: { payload: Partial<User> }) => {
      if (state) Object.assign(state, action.payload);
    },
  },
});

export const { setUser, clearUser, updateUser } = userSlice.actions;
export default userSlice.reducer;
