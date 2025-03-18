const { v4: uuidv4 } = require('uuid');
const { QuickDB } = require('quick.db');
const db = new QuickDB();
// Utils
const utils = require('../utils');
const StandardizedError = utils.standardizedError;
const Logger = utils.logger;
const Map = utils.map;
const Get = utils.get;
const Interval = utils.interval;
const Func = utils.func;
const Set = utils.set;
const JWT = utils.jwt;

const friendGroupHandler = {
  refreshFriendGroup: async (io, socket, data) => {
    // Get database
    const friendGroups = (await db.get('friendGroups')) || {};
  },
  createFriendGroup: async (io, socket, data) => {
    // Get database
    const friendGroups = (await db.get('friendGroups')) || {};
  },
  updateFriendGroup: async (io, socket, data) => {
    // Get database
    const friendGroups = (await db.get('friendGroups')) || {};
  },
  deleteFriendGroup: async (io, socket, data) => {
    // Get database
    const friendGroups = (await db.get('friendGroups')) || {};
  },
};

module.exports = { ...friendGroupHandler };
