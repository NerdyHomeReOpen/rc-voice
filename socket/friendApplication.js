/* eslint-disable @typescript-eslint/no-require-imports */
const { QuickDB } = require('quick.db');
const db = new QuickDB();
// Utils
const utils = require('../utils');
const {
  standardizedError: StandardizedError,
  logger: Logger,
  get: Get,
  set: Set,
  func: Func,
} = utils;

const friendApplicationHandler = {
  createFriendApplication: async (io, socket, data) => {
    try {
      // data = {
      //   senderId: string,
      //   receiverId: string,
      //   friendApplication: {
      //     ...
      //   },
      // }

      // Validate data
      const { friendApplication: _newApplication, senderId, receiverId } = data;
      if (!_newApplication || !senderId || !receiverId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'CREATEFRIENDAPPLICATION',
          'DATA_INVALID',
          401,
        );
      }
      const newApplication = await Func.validate.friendApplication(
        _newApplication,
      );

      // Validate socket
      const operatorId = await Func.validate.socket(socket);

      // Get data
      const operator = await Get.user(operatorId);
      const sender = await Get.user(senderId);
      const receiver = await Get.user(receiverId);
      let receiverSocket;
      io.sockets.sockets.forEach((_socket) => {
        if (_socket.userId === receiverId) {
          receiverSocket = _socket;
        }
      });

      // Validate operation
      if (operator.id !== sender.id) {
        throw new StandardizedError(
          '無法創建非自己的好友申請',
          'ValidationError',
          'CREATEFRIENDAPPLICATION',
          'PERMISSION_DENIED',
          403,
        );
      }
      if (sender.id === receiver.id) {
        throw new StandardizedError(
          '無法發送好友申請給自己',
          'ValidationError',
          'CREATEFRIENDAPPLICATION',
          'SELF_OPERATION',
          403,
        );
      }

      // Create friend application
      const applicationId = `fa_${senderId}-${receiverId}`;
      await Set.friendApplication(applicationId, {
        ...newApplication,
        senderId: senderId,
        receiverId: receiverId,
        createdAt: Date.now(),
      });

      // Emit updated data (to the receiver)
      if (receiverSocket) {
        io.to(receiverSocket.id).emit('userUpdate', {
          friendApplications: await Get.userFriendApplications(receiverId),
        });
      }

      new Logger('FriendApplication').success(
        `Friend application(${applicationId}) of User(${senderId}) and User(${receiverId}) created by User(${operator.id})`,
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `創建申請時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'CREATEFRIENDAPPLICATION',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit error data (to the operator)
      io.to(socket.id).emit('error', error);

      new Logger('FriendApplication').error(
        `Error creating friend application: ${error.error_message}`,
      );
    }
  },

  updateFriendApplication: async (io, socket, data) => {
    try {
      // data = {
      //   senderId: string,
      //   receiverId: string,
      //   friendApplication: {
      //     ...
      //   },
      // }

      // Validate data
      const {
        friendApplication: _editedApplication,
        senderId,
        receiverId,
      } = data;
      if (!_editedApplication || !senderId || !receiverId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'UPDATEFRIENDAPPLICATION',
          'DATA_INVALID',
          401,
        );
      }
      const editedApplication = await Func.validate.friendApplication(
        _editedApplication,
      );

      // Validate socket
      const operatorId = await Func.validate.socket(socket);

      // Get data
      const operator = await Get.user(operatorId);
      const sender = await Get.user(senderId);
      const receiver = await Get.user(receiverId);
      const application = await Get.friendApplication(senderId, receiverId);
      let receiverSocket;
      io.sockets.sockets.forEach((_socket) => {
        if (_socket.userId === receiverId) {
          receiverSocket = _socket;
        }
      });

      // Validate operation
      if (operator.id !== sender.id) {
        throw new StandardizedError(
          '無法修改非自己的好友申請',
          'ValidationError',
          'UPDATEFRIENDAPPLICATION',
          'PERMISSION_DENIED',
          403,
        );
      }

      // Update friend application
      await Set.friendApplication(application.id, editedApplication);

      // Emit updated data (to the receiver)
      io.to(receiverSocket.id).emit('userUpdate', {
        friendApplications: await Get.userFriendApplications(receiver.id),
      });

      new Logger('FriendApplication').success(
        `Friend application(${application.id}) of User(${sender.id}) and User(${receiver.id}) updated by User(${operator.id})`,
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `更新申請時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'UPDATEFRIENDAPPLICATION',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit error data (to the operator)
      io.to(socket.id).emit('error', error);

      new Logger('FriendApplication').error(
        `Error updating friend application: ${error.error_message}`,
      );
    }
  },
  deleteFriendApplication: async (io, socket, data) => {
    try {
      // data = {
      //   senderId: string,
      //   receiverId: string,
      // }

      // Validate data
      const { senderId, receiverId } = data;
      if (!senderId || !receiverId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'DELETEFRIENDAPPLICATION',
          'DATA_INVALID',
          401,
        );
      }

      // Validate socket
      const operatorId = await Func.validate.socket(socket);

      // Get data
      const operator = await Get.user(operatorId);
      const sender = await Get.user(senderId);
      const receiver = await Get.user(receiverId);
      const application = await Get.friendApplication(senderId, receiverId);

      // Validate operation
      if (operator.id !== sender.id) {
        throw new StandardizedError(
          '你刪除非自己的好友申請',
          'ValidationError',
          'DELETEFRIENDAPPLICATION',
          'PERMISSION_DENIED',
          403,
        );
      }

      await db.delete(`friendApplications.${application.id}`);

      new Logger('FriendApplication').success(
        `Friend application(${application.id}) of User(${sender.id}) and User(${receiver.id}) deleted by User(${operator.id})`,
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `刪除好友申請時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'DELETEFRIENDAPPLICATION',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit error data (to the operator)
      io.to(socket.id).emit('error', error);

      new Logger('FriendApplication').error(
        `Error deleting friend application: ${error.error_message}`,
      );
    }
  },
};

module.exports = { ...friendApplicationHandler };
