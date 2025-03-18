const { v4: uuidv4 } = require('uuid');
const { QuickDB } = require('quick.db');
const db = new QuickDB();
// Utils
const utils = require('../utils');
const Logger = utils.logger;
const Map = utils.map;
const Get = utils.get;
const Interval = utils.interval;
const Func = utils.func;
const Set = utils.set;
const JWT = utils.jwt;
// Socket error
const StandardizedError = require('../standardizedError');

const friendApplicationHandler = {
  refreshFriendApplication: async (io, socket, data) => {
    // Get database
    const friendApplications = (await db.get('friendApplications')) || {};
  },
  createFriendApplication: async (io, socket, data) => {
    // Get database
    const friendApplications = (await db.get('friendApplications')) || {};
  },
  updateFriendApplication: async (io, socket, data) => {
    // Get database
    const friendApplications = (await db.get('friendApplications')) || {};
  },
  deleteFriendApplication: async (io, socket, data) => {
    // Get database
    const friendApplications = (await db.get('friendApplications')) || {};
  },
};

module.exports = { ...friendApplicationHandler };
