// // const express = require("express");
// // const http = require("http");
// // const { Server } = require("this.socket.io");

// class Call {
//   constructor(io = null, channels = [], Logger) {
//     // this.port = 3000;
//     // this.app = app;
//     // this.server = server;
//     // this.app.use(express.static("public"));
//     // this.server.listen(this.port, () => console.log(`The server runs at http://localhost:${this.port}`));

//     this.io = io;
//     this.Logger = Logger;
//     this.rooms = {};
//     if (channels && Array.isArray(channels)) {
//       channels.forEach((channel) => {
//         this.rooms[channel] = {};
//       });
//     }
//     if (this.io) {
//       this.io.on('connection', async (socket) => {
//         if (socket) {
//           this.Logger.success(`使用者連線：${socket.id}`);
//           socket.on('get-rooms', () => this.sendRooms(socket));
//           socket.on('join-room', (data) => this.handleJoinRoom(socket, data));
//           socket.on('audio-data', (data) => this.handleAudioData(socket, data));
//           socket.on('user-speaking', (data) =>
//             this.handleUserSpeaking(socket, data),
//           );
//           socket.on('toggle-mute', (data) =>
//             this.handleToggleMute(socket, data),
//           );
//           socket.on('call-disconnect', () => this.handleDisconnect(socket));
//         }
//       });
//     }
//   }
//   /**發送房間列表**/
//   sendRooms(socket) {
//     socket.emit('room-list', Object.keys(this.rooms));
//   }
//   /**處理靜音(個人)**/
//   handleToggleMute(socket, { room, userId, isMuted }) {
//     if (this.rooms[room] && this.rooms[room][userId]) {
//       this.rooms[room][userId].isMuted = isMuted;
//       this.io
//         .to(room)
//         .emit('update-users-list', Object.values(this.rooms[room]));
//     }
//   }
//   /**處理加入房間**/
//   handleJoinRoom(socket, { room, isSpeaker, username }) {
//     socket.join(room);
//     if (!this.rooms[room]) this.rooms[room] = {};
//     this.rooms[room][socket.id] = {
//       username,
//       userId: socket.id,
//       isSpeaker,
//       isMuted: false,
//     };
//     this.io.to(room).emit('update-users-list', Object.values(this.rooms[room]));
//     this.Logger.success(
//       `${socket.id} 使用者 ${username} 加入房間 ${room}，發言者：${isSpeaker}`,
//     );
//     // if (isSpeaker) {
//     //     socket.emit("start-broadcast");
//     // }
//     // this.io.emit("room-list", Object.keys(this.rooms));
//   }
//   /**處理音流**/
//   handleAudioData(socket, { room, data, username }) {
//     this.io.to(room).emit('audio-stream', { from: username, data });
//   }
//   /**處理講話**/
//   handleUserSpeaking(socket, { room, isSpeaking, volume, username }) {
//     this.io
//       .to(room)
//       .emit('user-speaking', { userId: username, isSpeaking, volume });
//   }
//   /**處理斷線**/
//   handleDisconnect(socket) {
//     for (const room in this.rooms) {
//       if (this.rooms[room][socket.id]) {
//         const username = this.rooms[room][socket.id].username;
//         delete this.rooms[room][socket.id];
//         this.io.to(socket.id).emit('update-disconnect');
//         this.io
//           .to(room)
//           .emit('update-users-list', Object.values(this.rooms[room]));
//         this.Logger.success(`${socket.id} 使用者 ${username} 離開房間 ${room}`);
//         if (Object.keys(this.rooms[room]).length == 0) {
//           delete this.rooms[room];
//         }
//         break;
//       }
//     }
//     // this.io.emit("room-list", Object.keys(this.rooms));
//   }
// }

// new Call();

// module.exports = Call;
