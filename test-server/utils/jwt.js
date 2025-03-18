/* eslint-disable @typescript-eslint/no-require-imports */
const jwt = require('jsonwebtoken');

// Secret key for signing tokens - in production, store this in environment variables
const JWT_SECRET = 'mysecretkey';
// Token expiration time
const JWT_EXPIRES_IN = '7d';

const JWT = {
  generateToken: (data) => {
    return jwt.sign({ ...data }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  },
  verifyToken: (token) => {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return { valid: true, ...decoded };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  },
};

module.exports = JWT;
