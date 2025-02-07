import { createSlice } from '@reduxjs/toolkit';

// Types
import { Message } from '@/types';

const messagesSlice = createSlice({
  name: 'messagesSlice',
  initialState: [] as Message[],
  reducers: {
    setMessages: (state, action: { payload: Message[] }) => {
      return action.payload;
    },
    addMessage: (state, action: { payload: Message }) => {
      state.push(action.payload);
    },
    clearMessages: (state) => {
      return [];
    },
  },
});

export const { setMessages } = messagesSlice.actions;
export default messagesSlice.reducer;
