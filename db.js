const { query } = require('./database');

// Helper functions to match quick.db API
class Database {
  async set(table, data) {
    const entries = Object.entries(data);
    for (const [key, value] of entries) {
      // Ensure value is a valid object that can be converted to JSON
      let jsonValue;
      try {
        // If value is already a string, try parsing it first to validate JSON
        if (typeof value === 'string') {
          JSON.parse(value);
          jsonValue = value;
        } else {
          // If value is an object, stringify it
          jsonValue = JSON.stringify(value);
        }
      } catch (error) {
        throw new Error(`Invalid data format for key ${key}: ${error.message}`);
      }

      await query(
        `INSERT INTO ${table} (${table.slice(0, -1)}_id, data)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE data = ?`,
        [key, jsonValue, jsonValue]
      );
    }
  }

  async get(table, key) {
    const results = await query(
      `SELECT data FROM ${table} WHERE ${table.slice(0, -1)}_id = ?`,
      [key]
    );
    if (!results.length) return null;

    try {
      return JSON.parse(results[0].data);
    } catch (error) {
      throw new Error(`Invalid JSON format in database for ${table}/${key}: ${error.message}`);
    }
  }

  async deleteAll() {
    const tables = [
      'account_passwords',
      'account_user_ids',
      'users',
      'badges',
      'user_badges',
      'user_servers',
      'servers',
      'channels',
      'friend_groups',
      'channel_relations',
      'members',
      'member_applications',
      'friends',
      'friend_applications',
      'messages',
      'direct_messages',
      'voice_presences'
    ];

    for (const table of tables) {
      await query(`TRUNCATE TABLE ${table}`);
    }
  }
}

const db = new Database();

module.exports = db;