/* eslint-disable @typescript-eslint/no-unused-vars */
import { createSlice } from '@reduxjs/toolkit';

const sessionTokenSlice = createSlice({
  name: 'sessionTokenSlice',
  initialState: null as string | null,
  reducers: {
    setSessionToken: (state, action: { payload: string }) => {
      return action.payload;
    },
    clearSessionToken: (state) => {
      return null;
    },
  },
});

export const { setSessionToken, clearSessionToken } = sessionTokenSlice.actions;
export default sessionTokenSlice.reducer;
