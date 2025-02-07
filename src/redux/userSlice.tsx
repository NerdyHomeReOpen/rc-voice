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
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
