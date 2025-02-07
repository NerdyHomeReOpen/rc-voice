import { createSlice } from '@reduxjs/toolkit';

// Types
import { UserList } from '@/types';

const friendListSlice = createSlice({
  name: 'friendListSlice',
  initialState: {} as UserList,
  reducers: {
    setFriendList: (state, action: { payload: UserList }) => {
      return action.payload;
    },
  },
});

export const { setFriendList } = friendListSlice.actions;
export default friendListSlice.reducer;
