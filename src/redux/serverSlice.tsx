import { createSlice } from '@reduxjs/toolkit';

// Types
import { Server } from '@/types';

const serverSlice = createSlice({
  name: 'serverSlice',
  initialState: null as Server | null,
  reducers: {
    setServer: (state, action: { payload: Server }) => {
      return action.payload;
    },
    clearServer: (state) => {
      return null;
    },
  },
});

export const { setServer, clearServer } = serverSlice.actions;
export default serverSlice.reducer;
