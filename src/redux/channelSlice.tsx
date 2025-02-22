/* eslint-disable @typescript-eslint/no-unused-vars */
import { createSlice } from '@reduxjs/toolkit';

// Types
import { Channel } from '@/types';

const channelSlice = createSlice({
  name: 'channelSlice',
  initialState: null as Channel | null,
  reducers: {
    setChannel: (state, action: { payload: Channel }) => {
      return action.payload;
    },
    clearChannel: (state) => {
      return null;
    },
  },
});

export const { setChannel, clearChannel } = channelSlice.actions;
export default channelSlice.reducer;
