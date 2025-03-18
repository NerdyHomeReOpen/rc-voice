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

const memberApplicationHandler = {
  refreshMemberApplication: async (io, socket, data) => {
    // Get database
    const memberApplications = (await db.get('memberApplications')) || {};
  },
  createMemberApplication: async (io, socket, data) => {
    // Get database
    const memberApplications = (await db.get('memberApplications')) || {};
  },
  updateMemberApplication: async (io, socket, data) => {
    // Get database
    const memberApplications = (await db.get('memberApplications')) || {};
  },
  deleteMemberApplication: async (io, socket, data) => {
    // Get database
    const memberApplications = (await db.get('memberApplications')) || {};
  },
};
module.exports = { ...memberApplicationHandler };
