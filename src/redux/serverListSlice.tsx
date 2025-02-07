import { createSlice } from '@reduxjs/toolkit';

// Types
import { ServerList } from '@/types';

const serverListSlice = createSlice({
  name: 'serverListSlice',
  initialState: null as ServerList | null,
  reducers: {
    setServerList: (state, action: { payload: ServerList }) => {
      return action.payload;
    },
    clearServerList: (state) => {
      return null;
    },
  },
});

export const { setServerList, clearServerList } = serverListSlice.actions;
export default serverListSlice.reducer;
