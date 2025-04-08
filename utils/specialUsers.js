/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const db = require('../db');
const {
  get: Get,
  set: Set,
} = db;
const Logger = require('./logger');

const specialUsers = {
  eventStaffIds: [],
  officialIds: [],
  vipCheckInterval: null,
  vipFilePath: path.join(__dirname, '..', 'vip.json'),

  isEventStaff: function (userId) {
    return this.eventStaffIds.includes(userId);
  },

  isOfficial: function (userId) {
    return this.officialIds.includes(userId);
  },

  getSpecialPermissionLevel: function (userId) {
    if (this.isOfficial(userId)) {
      return 8;
    } else if (this.isEventStaff(userId)) {
      return 7;
    }
    return null;
  },

  addEventStaff: function (userId) {
    if (!this.eventStaffIds.includes(userId)) {
      this.eventStaffIds.push(userId);
    }
  },

  addOfficial: function (userId) {
    if (!this.officialIds.includes(userId)) {
      this.officialIds.push(userId);
    }
  },

  removeEventStaff: function (userId) {
    this.eventStaffIds = this.eventStaffIds.filter((id) => id !== userId);
  },

  removeOfficial: function (userId) {
    this.officialIds = this.officialIds.filter((id) => id !== userId);
  },

  startVipCheck: function (intervalMs = 60 * 60 * 1000) {
    if (this.vipCheckInterval) {
      clearInterval(this.vipCheckInterval);
    }

    this.checkAndUpdateVips();

    this.vipCheckInterval = setInterval(() => {
      this.checkAndUpdateVips();
    }, intervalMs);

    new Logger('VIPSystem').info(
      `VIP check started, interval: ${intervalMs}ms`,
    );
  },

  stopVipCheck: function () {
    if (this.vipCheckInterval) {
      clearInterval(this.vipCheckInterval);
      this.vipCheckInterval = null;
      new Logger('VIPSystem').info('VIP check stopped');
    }
  },

  async checkAndUpdateVips() {
    try {
      const vipData = await this.readVipFile();
      if (!vipData || !vipData.vips) {
        new Logger('VIPSystem').warn('VIP file is empty');
        return;
      }

      const users = (await Get.all('users')) || {};

      let updatedCount = 0;
      for (const vipEntry of vipData.vips) {
        const { userId, level } = vipEntry;

        if (!userId || level === undefined) continue;

        const user = users[userId];
        if (user) {
          if (user.vip !== level) {
            await Set.userVip(userId, level);
            updatedCount++;
            new Logger('VIPSystem').info(
              `User(${userId}) VIP updated to ${level}`,
            );
          }
        } else {
          new Logger('VIPSystem').warn(`User(${userId}) not found`);
        }
      }

      new Logger('VIPSystem').info(
        `VIP check completed, ${updatedCount} users updated`,
      );
    } catch (error) {
      new Logger('VIPSystem').error(`Error checking VIP: ${error.message}`);
    }
  },

  async readVipFile() {
    try {
      const fileContent = await fs.readFile(this.vipFilePath, 'utf8');
      return JSON.parse(fileContent);
    } catch (error) {
      if (error.code === 'ENOENT') {
        await this.createEmptyVipFile();
        return { vips: [] };
      }
      throw error;
    }
  },

  async createEmptyVipFile() {
    try {
      const emptyVipData = { vips: [] };
      await fs.writeFile(
        this.vipFilePath,
        JSON.stringify(emptyVipData, null, 2),
        'utf8',
      );
      new Logger('VIPSystem').info(
        `Empty VIP file created: ${this.vipFilePath}`,
      );
    } catch (error) {
      new Logger('VIPSystem').error(
        `Error creating VIP file: ${error.message}`,
      );
    }
  },
};

specialUsers.startVipCheck();

module.exports = specialUsers;
