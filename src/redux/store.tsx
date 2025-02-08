import { configureStore } from '@reduxjs/toolkit';

// Slices
import userSlice from './userSlice';
import serverSlice from './serverSlice';
import sessionTokenSlice from './sessionTokenSlice';

const store = configureStore({
  reducer: {
    user: userSlice,
    server: serverSlice,
    sessionToken: sessionTokenSlice,
  },
});

export default store;
