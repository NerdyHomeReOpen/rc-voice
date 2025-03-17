const { QuickDB } = require('quick.db');
const db = new QuickDB();
// Constants
const { XP_SYSTEM } = require('../constant');

const func = {
  calculateRequiredXP: (level) => {
    return Math.ceil(
      XP_SYSTEM.BASE_XP * Math.pow(XP_SYSTEM.GROWTH_RATE, level),
    );
  },
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
  // getAvatar: async (type = 'server', avatarUrl) => {
  //   try {
  //     const AVATAR_DIR =
  //       type === 'server' ? SERVER_AVATAR_DIR : USER_AVATAR_DIR;
  //     const avatarPath = path.join(AVATAR_DIR, path.basename(avatarUrl));
  //     const imageBuffer = await fs.readFile(avatarPath);
  //     const avatar = `data:${
  //       MIME_TYPES[path.extname(avatarPath)]
  //     };base64,${imageBuffer.toString('base64')}`;

  //     return avatar;
  //   } catch (error) {
  //     return null;
  //   }
  // },
  convertAvatarDataToBase64: (avatarData) => {
    return `data:image/png;base64,${avatarData}`;
  },
  validateAccount: (value) => {
    value = value.trim();
    if (!value) return '帳號為必填';
    if (value.length < 4) return '帳號至少需要 4 個字';
    if (value.length > 16) return '帳號最多 16 個字';
    if (!/^[A-Za-z0-9_\.]+$/.test(value))
      return '帳號只能使用英文、數字、底線(_)和點(.)';
    return '';
  },
  validatePassword: (value) => {
    value = value.trim();
    if (!value) return '密碼為必填';
    if (value.length < 8) return '密碼至少需要 8 個字';
    if (value.length > 20) return '密碼最多 20 個字';
    if (!/^[A-Za-z0-9@$!%*#?&]{8,20}$/.test(value))
      return '密碼長度需要在8-20個字之間，且不包含@$!%*#?&以外的特殊字元';
    return '';
  },
  validateUsername: (value) => {
    value = value.trim();
    if (!value) return '顯示名稱為必填';
    if (value.length < 1) return '顯示名稱至少需要 1 個字';
    if (value.length > 32) return '顯示名稱最多 32 個字';
    return '';
  },
  validateCheckPassword: (value, check) => {
    if (value !== check) return '密碼輸入不一致';
    return '';
  },
  validateServerName: (value) => {
    value = value?.trim();
    if (!value) return '群組名稱為必填';
    if (value.length > 30) return '群組名稱不能超過30個字符';
    return '';
  },
  validateServerDescription: (value) => {
    if (!value?.trim()) return '';
    if (value.length > 200) return '群組描述不能超過200個字符';
    return '';
  },
  validateServerSlogan: (value) => {
    if (!value?.trim()) return '';
    if (value.length > 30) return '群組口號不能超過30個字符';
    return '';
  },
  validateServerAvatar: async (avatar) => {
    if (!avatar) return '';

    const matches = avatar.match(/^data:image\/(.*?);base64,/);
    if (!matches) return '無效的圖片格式';

    const imageType = matches[1];
    if (!['png', 'jpeg', 'gif', 'webp'].includes(imageType)) {
      return '無效的圖片格式';
    }

    const base64Data = avatar.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length > 5 * 1024 * 1024) {
      return '圖片大小不能超過5MB';
    }

    return '';
  },
  validateChannelName: (value) => {
    value = value?.trim();
    if (!value) return '頻道名稱為必填';
    if (value.length > 30) return '頻道名稱不能超過30個字符';
    return '';
  },
  validateMessage: (value) => {
    if (!value?.trim()) return '訊息不能為空';
    if (value.length > 2000) return '訊息不能超過2000個字符';
    return '';
  },
  validateSignature: (value) => {
    if (!value?.trim()) return '';
    if (value.length > 200) return '個性簽名不能超過200個字符';
    return '';
  },
  validateNickname: (value) => {
    value = value?.trim();
    if (!value) return '暱稱為必填';
    if (value.length > 32) return '暱稱不能超過32個字符';
    return '';
  },
  validateAnnouncement: (value) => {
    if (!value?.trim()) return '';
    if (value.length > 500) return '公告不能超過500個字符';
    return '';
  },
  validatePermissionLevel: (value) => {
    if (typeof value !== 'number') return '權限等級必須是數字';
    if (value < 0 || value > 6) return '權限等級必須在0-6之間';
    return '';
  },
  validateUserLimit: (value) => {
    if (typeof value !== 'number') return '人數限制必須是數字';
    if (value !== -1 && (value < 1 || value > 99))
      return '人數限制必須是-1或1-99之間';
    return '';
  },
  validateChannelVisibility: (value) => {
    if (!['public', 'private'].includes(value)) return '無效的頻道可見度設定';
    return '';
  },
  validateServerVisibility: (value) => {
    if (!['public', 'private', 'invisible'].includes(value))
      return '無效的群組可見度設定';
    return '';
  },
};

module.exports = { ...func };
