import { createSlice } from '@reduxjs/toolkit';

// Types
import { Channel } from '@/types';

const channelsSlice = createSlice({
  name: 'channelsSlice',
  initialState: [] as Channel[],
  reducers: {
    setChannels: (state, action: { payload: Channel[] }) => {
      return action.payload;
    },
  },
});

export const { setChannels } = channelsSlice.actions;
export default channelsSlice.reducer;
