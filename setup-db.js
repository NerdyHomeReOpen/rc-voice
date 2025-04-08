const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function setupDatabase() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || '3306',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  };
  const database = process.env.DB_NAME || 'chat_app';

  try {
    // Create connection
    const connection = await mysql.createConnection(config);

    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${database}`);
    await connection.query(`USE ${database}`);

    // Read and execute schema
    const schema = await fs.readFile(path.join(__dirname, 'schema.sql'), 'utf8');
    const statements = schema.split(';').filter(stmt => stmt.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        await connection.query(statement);
      }
    }

    console.log('Database setup completed successfully');
    await connection.end();
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase();