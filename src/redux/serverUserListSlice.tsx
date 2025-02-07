import { createSlice } from '@reduxjs/toolkit';

// Types
import { UserList } from '@/types';

const serverUserListSlice = createSlice({
  name: 'serverUserListSlice',
  initialState: {} as UserList,
  reducers: {
    setServerUserList: (state, action: { payload: UserList }) => {
      return action.payload;
    },
  },
});

export const { setServerUserList } = serverUserListSlice.actions;
export default serverUserListSlice.reducer;
