import { configureStore } from '@reduxjs/toolkit';

// Slices
import userSlice from './userSlice';
import serverSlice from './serverSlice';
import serverListSlice from './serverListSlice';
import serverUserListSlice from './serverUserListSlice';
import channelsSlice from './channelsSlice';
import messagesSlice from './messagesSlice';
import friendListSlice from './friendListSlice';

const store = configureStore({
  reducer: {
    user: userSlice,
    server: serverSlice,
    serverList: serverListSlice,
    serverUserList: serverUserListSlice,
    channels: channelsSlice,
    messages: messagesSlice,
    friendList: friendListSlice,
  },
});

export default store;
