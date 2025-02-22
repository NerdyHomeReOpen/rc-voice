import { configureStore } from '@reduxjs/toolkit';

// Slices
import userSlice from './userSlice';
import serverSlice from './serverSlice';
import channelSlice from './channelSlice';
import sessionTokenSlice from './sessionTokenSlice';

const store = configureStore({
  reducer: {
    user: userSlice,
    server: serverSlice,
    channel: channelSlice,
    sessionToken: sessionTokenSlice,
  },
});

export default store;
