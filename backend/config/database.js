const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const logger = require('../utils/logger');

// SQLite database configuration
const dbPath = path.join(__dirname, '..', 'data', 'stixconnect_test.db');
let db;

// Initialize database connection
async function initializeDatabase() {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    // Enable foreign keys
    await db.exec('PRAGMA foreign_keys = ON');
    
    logger.info('SQLite database connection successful');
    return true;
  } catch (error) {
    logger.error('SQLite database connection failed:', error);
    return false;
  }
}

// Test connection
async function testConnection() {
  if (!db) {
    return await initializeDatabase();
  }
  
  try {
    await db.get('SELECT 1');
    logger.info('Database connection successful');
    return true;
  } catch (error) {
    logger.error('Database connection failed:', error);
    return false;
  }
}

// Execute query with error handling
async function execute(query, params = []) {
  if (!db) {
    await initializeDatabase();
  }
  
  try {
    // Convert MySQL syntax to SQLite when needed
    let sqliteQuery = query;
    
    // Convert MySQL placeholders to SQLite format
    if (params.length > 0) {
      // Replace ? with numbered parameters for better compatibility
      params.forEach((param, index) => {
        sqliteQuery = sqliteQuery.replace('?', `?${index + 1}`);
      });
    }
    
    if (query.trim().toLowerCase().startsWith('select')) {
      const rows = await db.all(query, params);
      return rows;
    } else if (query.trim().toLowerCase().startsWith('insert')) {
      const result = await db.run(query, params);
      return { insertId: result.lastID, affectedRows: result.changes };
    } else {
      const result = await db.run(query, params);
      return { affectedRows: result.changes };
    }
  } catch (error) {
    logger.error('Database query error:', { query, params, error: error.message });
    throw error;
  }
}

// Transaction helper
async function transaction(callback) {
  if (!db) {
    await initializeDatabase();
  }
  
  try {
    await db.exec('BEGIN TRANSACTION');
    const result = await callback(db);
    await db.exec('COMMIT');
    return result;
  } catch (error) {
    await db.exec('ROLLBACK');
    throw error;
  }
}

module.exports = {
  db,
  execute,
  transaction,
  testConnection,
  initializeDatabase
};