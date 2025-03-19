/* eslint-disable @typescript-eslint/no-require-imports */
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const sharp = require('sharp');
// Utils
const StandardizedError = require('./standardizedError');
const Map = require('./map');
const JWT = require('./jwt');

const func = {
  calculateSimilarity: (str1, str2) => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    const levenshteinDistance = (str1, str2) => {
      const matrix = [];

      for (let i = 0; i <= str1.length; i++) matrix[i] = [i];
      for (let j = 0; j <= str2.length; j++) matrix[0][j] = j;

      for (let i = 1; i <= str1.length; i++) {
        for (let j = 1; j <= str2.length; j++) {
          const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j - 1] + cost,
          );
        }
      }
    };

    if (longer.length === 0) return 1.0;

    return (
      (longer.length - levenshteinDistance(longer, shorter)) / longer.length
    );
  },

  generateUniqueDisplayId: async (baseId = 20000000) => {
    const servers = (await db.get('servers')) || {};
    let displayId = baseId + Object.keys(servers).length;
    // Ensure displayId is unique
    while (
      Object.values(servers).some((server) => server.displayId === displayId)
    ) {
      displayId++;
    }
    return displayId;
  },

  generateImageData: async (image) => {
    if (!image) return;
    const matches = image.match(/^data:image\/(.*?);base64,/);
    if (!matches) {
      throw new StandardizedError(
        '無效的圖片格式',
        'ValidationError',
        'GENERATEIMAGE',
        'INVALID_IMAGE_FORMAT',
        400,
      );
    }
    const imageType = matches[1];
    if (!['png', 'jpeg', 'gif', 'webp'].includes(imageType)) {
      throw new StandardizedError(
        '無效的圖片格式',
        'ValidationError',
        'GENERATEIMAGE',
        'INVALID_IMAGE_FORMAT',
        400,
      );
    }
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    if (buffer.length > 5 * 1024 * 1024) {
      throw new StandardizedError(
        '圖片大小超過限制',
        'ValidationError',
        'GENERATEIMAGE',
        'IMAGE_SIZE_EXCEEDED',
        400,
      );
    }
    const resizedBuffer = await sharp(buffer).resize(200, 200).toBuffer();
    const imageData = resizedBuffer.toString('base64');
    return `data:image/png;base64,${imageData}`;
  },

  validate: {
    account: async (account) => {
      if (!account) {
        throw new StandardizedError(
          '帳號不可為空',
          'ValidationError',
          'ACCOUNT',
          'ACCOUNT_MISSING',
          401,
        );
      }
      if (account.length < 3) {
        throw new StandardizedError(
          '帳號長度不能小於3個字符',
          'ValidationError',
          'ACCOUNT',
          'ACCOUNT_TOO_SHORT',
          400,
        );
      }
      if (account.length > 32) {
        throw new StandardizedError(
          '帳號長度不能超過32個字符',
          'ValidationError',
          'ACCOUNT',
          'ACCOUNT_TOO_LONG',
          400,
        );
      }
      if (!/^[a-zA-Z0-9]+$/.test(account)) {
        throw new StandardizedError(
          '帳號只能包含英文字母和數字',
          'ValidationError',
          'ACCOUNT',
          'ACCOUNT_INVALID',
          400,
        );
      }
      return account;
    },

    password: async (password) => {
      if (!password) {
        throw new StandardizedError(
          '密碼不可為空',
          'ValidationError',
          'PASSWORD',
          'PASSWORD_MISSING',
          401,
        );
      }
      if (password.length < 6) {
        throw new StandardizedError(
          '密碼長度不能小於6個字符',
          'ValidationError',
          'PASSWORD',
          'PASSWORD_TOO_SHORT',
          400,
        );
      }
      if (password.length > 32) {
        throw new StandardizedError(
          '密碼長度不能超過32個字符',
          'ValidationError',
          'PASSWORD',
          'PASSWORD_TOO_LONG',
          400,
        );
      }
      if (!/^[a-zA-Z0-9]+$/.test(password)) {
        throw new StandardizedError(
          '密碼只能包含英文字母和數字',
          'ValidationError',
          'PASSWORD',
          'PASSWORD_INVALID',
          400,
        );
      }
      return password;
    },

    nickname: async (nickname) => {
      if (!nickname) {
        throw new StandardizedError(
          '暱稱不可為空',
          'ValidationError',
          'NICKNAME',
          'NICKNAME_MISSING',
          401,
        );
      }
      if (nickname.length > 32) {
        throw new StandardizedError(
          '暱稱不能超過32個字符',
          'ValidationError',
          'NICKNAME',
          'NICKNAME_TOO_LONG',
          400,
        );
      }
      if (!/^[a-zA-Z0-9\u4e00-\u9fa5]+$/.test(nickname)) {
        throw new StandardizedError(
          '暱稱只能包含英文字母、數字和中文',
          'ValidationError',
          'NICKNAME',
          'NICKNAME_INVALID',
          400,
        );
      }
      return nickname;
    },

    socket: async (socket) => {
      if (!socket) {
        throw new StandardizedError(
          '無可用的 socket',
          'ValidationError',
          'SOCKET',
          'SOCKET_MISSING',
          401,
        );
      }
      if (!socket.jwt) {
        throw new StandardizedError(
          '無可用的 JWT',
          'ValidationError',
          'SOCKET',
          'JWT_MISSING',
        );
      }
      if (!socket.sessionId) {
        throw new StandardizedError(
          '無可用的 session ID',
          'ValidationError',
          'SOCKET',
          'SESSION_MISSING',
          401,
        );
      }
      if (!Map.sessionToUser.get(socket.sessionId)) {
        throw new StandardizedError(
          `無效的 session ID(${socket.sessionId})`,
          'ValidationError',
          'SOCKET',
          'SESSION_INVALID',
        );
      }
      const result = JWT.verifyToken(socket.jwt);
      if (!result) {
        throw new StandardizedError(
          '無效的 JWT',
          'ValidationError',
          'SOCKET',
          'JWT_INVALID',
        );
      }
      const valid = result.valid;
      if (!valid) {
        throw new StandardizedError(
          '無效的 JWT',
          'ValidationError',
          'SOCKET',
          'JWT_INVALID',
        );
      }
      const userId = result.userId;
      if (!userId) {
        throw new StandardizedError(
          '無效的 JWT',
          'ValidationError',
          'SOCKET',
          'JWT_INVALID',
        );
      }
      return userId;
    },

    user: async (user) => {
      if (!user) {
        throw new StandardizedError(
          '使用者不存在',
          'ValidationError',
          'USER',
          'USER_NOT_FOUND',
          401,
        );
      }
      if (user.name && user.name.length > 32) {
        throw new StandardizedError(
          '顯示名稱不能超過32個字符',
          'ValidationError',
          'USER',
          'USERNAME_TOO_LONG',
        );
      }
      if (user.signature && user.signature.length > 200) {
        throw new StandardizedError(
          '個性簽名不能超過200個字符',
          'ValidationError',
          'USER',
          'SIGNATURE_TOO_LONG',
        );
      }
      if (
        user.status &&
        !['online', 'dnd', 'idle', 'gn'].includes(user.status)
      ) {
        throw new StandardizedError(
          '無效的狀態',
          'ValidationError',
          'USER',
          'STATUS_INVALID',
        );
      }
      if (user.gender && !['Male', 'Female'].includes(user.gender)) {
        throw new StandardizedError(
          '無效的性別',
          'ValidationError',
          'USER',
          'GENDER_INVALID',
        );
      }
      if (user.level && user.level < 0) {
        throw new StandardizedError(
          '等級不能小於0',
          'ValidationError',
          'USER',
          'LEVEL_INVALID',
        );
      }
      if (user.xp && user.xp < 0) {
        throw new StandardizedError(
          '經驗值不能小於0',
          'ValidationError',
          'USER',
          'XP_INVALID',
        );
      }
      if (user.requiredXp && user.requiredXp < 0) {
        throw new StandardizedError(
          '所需經驗值不能小於0',
          'ValidationError',
          'USER',
          'REQUIRED_XP_INVALID',
        );
      }
      if (user.progress && user.progress < 0) {
        throw new StandardizedError(
          '進度不能小於0',
          'ValidationError',
          'USER',
          'PROGRESS_INVALID',
        );
      }
      return user;
    },

    server: (server) => {
      if (!server) {
        throw new StandardizedError(
          '群組不存在',
          'ValidationError',
          'SERVER',
          'SERVER_NOT_FOUND',
          401,
        );
      }
      if (server.name && server.name.length > 30) {
        throw new StandardizedError(
          '群組名稱不能超過30個字符',
          'ValidationError',
          'SERVER',
          'NAME_TOO_LONG',
        );
      }
      if (server.announcement && server.announcement.length > 500) {
        throw new StandardizedError(
          '公告不能超過500個字符',
          'ValidationError',
          'SERVER',
          'ANNOUNCEMENT_TOO_LONG',
        );
      }
      if (server.description && server.description.length > 200) {
        throw new StandardizedError(
          '群組描述不能超過200個字符',
          'ValidationError',
          'SERVER',
          'DESCRIPTION_TOO_LONG',
        );
      }
      if (
        server.type &&
        !['game', 'community', 'other'].includes(server.type)
      ) {
        throw new StandardizedError(
          '無效的群組類型',
          'ValidationError',
          'SERVER',
          'TYPE_INVALID',
        );
      }
      if (server.displayId && server.displayId.length > 10) {
        throw new StandardizedError(
          '顯示ID不能超過10個字符',
          'ValidationError',
          'SERVER',
          'DISPLAY_ID_TOO_LONG',
          400,
        );
      }
      if (server.slogan && server.slogan.length > 30) {
        throw new StandardizedError(
          '群組口號不能超過30個字符',
          'ValidationError',
          'SERVER',
          'SLOGAN_TOO_LONG',
        );
      }
      if (server.level && server.level < 0) {
        throw new StandardizedError(
          '等級不能小於0',
          'ValidationError',
          'SERVER',
          'LEVEL_INVALID',
        );
      }
      if (server.wealth && server.wealth < 0) {
        throw new StandardizedError(
          '財富不能小於0',
          'ValidationError',
          'SERVER',
          'WEALTH_INVALID',
        );
      }
      if (
        server.visibility &&
        !['public', 'private', 'invisible'].includes(server.visibility)
      ) {
        throw new StandardizedError(
          '無效的群組可見度',
          'ValidationError',
          'SERVER',
          'VISIBILITY_INVALID',
        );
      }
      return server;
    },

    channel: (channel) => {
      if (!channel) {
        throw new StandardizedError(
          '頻道不存在',
          'ValidationError',
          'CHANNEL',
          'CHANNEL_NOT_FOUND',
          401,
        );
      }
      if (channel.name && channel.name.length > 30) {
        throw new StandardizedError(
          '頻道名稱不能超過30個字符',
          'ValidationError',
          'CHANNEL',
          'NAME_TOO_LONG',
        );
      }
      if (
        channel.voiceMode &&
        !['free', 'queue', 'forbidden'].includes(channel.voiceMode)
      ) {
        throw new StandardizedError(
          '無效的語音模式',
          'ValidationError',
          'CHANNEL',
          'VOICE_MODE_INVALID',
        );
      }
      if (
        channel.chatMode &&
        !['free', 'forbidden'].includes(channel.chatMode)
      ) {
        throw new StandardizedError(
          '無效的聊天模式',
          'ValidationError',
          'CHANNEL',
          'CHAT_MODE_INVALID',
        );
      }
      if (channel.bitrate && channel.bitrate < 1000) {
        throw new StandardizedError(
          '比特率不能小於1000',
          'ValidationError',
          'CHANNEL',
          'BITRATE_INVALID',
        );
      }
      if (
        channel.userLimit &&
        (channel.userLimit < 1 || channel.userLimit > 99)
      ) {
        throw new StandardizedError(
          '人數限制必須在1-99之間',
          'ValidationError',
          'CHANNEL',
          'USER_LIMIT_INVALID',
        );
      }
      if (
        channel.visibility &&
        !['public', 'private'].includes(channel.visibility)
      ) {
        throw new StandardizedError(
          '無效的頻道可見度',
          'ValidationError',
          'CHANNEL',
          'VISIBILITY_INVALID',
        );
      }
      return channel;
    },

    category: (category) => {
      if (!category) {
        throw new StandardizedError(
          '類別不存在',
          'ValidationError',
          'CATEGORY',
          'CATEGORY_NOT_FOUND',
          401,
        );
      }
      if (category.name && category.name.length > 30) {
        throw new StandardizedError(
          '類別名稱不能超過30個字符',
          'ValidationError',
          'CATEGORY',
          'NAME_TOO_LONG',
        );
      }
      return category;
    },

    member: (member) => {
      if (!member) {
        throw new StandardizedError(
          '成員不存在',
          'ValidationError',
          'MEMBER',
          'MEMBER_NOT_FOUND',
          401,
        );
      }
      if (member.nickname && member.nickname.length > 32) {
        throw new StandardizedError(
          '暱稱不能超過32個字符',
          'ValidationError',
          'MEMBER',
          'NICKNAME_TOO_LONG',
        );
      }
      if (
        member.permissionLevel &&
        (member.permissionLevel < 0 || member.permissionLevel > 8)
      ) {
        throw new StandardizedError(
          '權限等級必須介於0-8之間',
          'ValidationError',
          'MEMBER',
          'PERMISSION_LEVEL_INVALID',
        );
      }
      return member;
    },

    friend: (friend) => {
      if (!friend) {
        throw new StandardizedError(
          '好友不存在',
          'ValidationError',
          'FRIEND',
          'FRIEND_NOT_FOUND',
          401,
        );
      }
      return friend;
    },

    message: (message) => {
      if (!message) {
        throw new StandardizedError(
          '訊息不存在',
          'ValidationError',
          'MESSAGE',
          'MESSAGE_NOT_FOUND',
          401,
        );
      }
      if (message.content && message.content.length > 2000) {
        throw new StandardizedError(
          '訊息不能超過2000個字符',
          'ValidationError',
          'MESSAGE',
          'CONTENT_TOO_LONG',
        );
      }
      return message;
    },

    directMessage: (directMessage) => {
      if (!directMessage) {
        throw new StandardizedError(
          '私人訊息不存在',
          'ValidationError',
          'DIRECT_MESSAGE',
          'DIRECT_MESSAGE_NOT_FOUND',
          401,
        );
      }
      if (directMessage.content && directMessage.content.length > 2000) {
        throw new StandardizedError(
          '私人訊息不能超過2000個字符',
          'ValidationError',
          'DIRECT_MESSAGE',
          'CONTENT_TOO_LONG',
        );
      }
      return directMessage;
    },
  },
};

module.exports = { ...func };
