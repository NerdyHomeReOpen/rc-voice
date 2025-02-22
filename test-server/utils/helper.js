module.exports = {
  checkUserBlocked: (members, serverId, userId) => {
    const serverMember = Object.values(members).find(
      (member) => member.serverId === serverId && member.userId === userId,
    );

    if (serverMember?.isBlocked) {
      throw new SocketError(
        '您已被此群組封鎖',
        'CONNECTSERVER',
        'USER_BLOCKED',
        403,
      );
    }

    return false;
  },
  calculateRequiredXP: (level) => {
    return Math.ceil(
      XP_SYSTEM.BASE_XP * Math.pow(XP_SYSTEM.GROWTH_RATE, level),
    );
  },
  calculateSimilarity: (str1, str2) => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    return (
      (longer.length - levenshteinDistance(longer, shorter)) / longer.length
    );
  },
  levenshteinDistance: (str1, str2) => {
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

    return matrix[str1.length][str2.length];
  },
};
