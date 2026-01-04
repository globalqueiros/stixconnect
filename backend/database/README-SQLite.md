# SQLite Configuration for Testing

This directory contains the SQLite database setup for testing the StixConnect backend.

## Files

- `stixconnect_test.db` - SQLite database file
- `init-sqlite.js` - Database initialization script
- `schema.sql` - Original MySQL schema (for reference)

## Setup Instructions

1. **Install dependencies:**
   ```bash
   cd backend
   npm install sqlite3 sqlite
   ```

2. **Initialize the database:**
   ```bash
   npm run init-sqlite
   ```

3. **Start the server:**
   ```bash
   npm run dev
   ```

## Configuration

The SQLite configuration is automatically enabled in `config/database.js` when:
- No MariaDB connection is available
- Running in test environment
- `DB_TYPE=sqlite` is set in environment variables

## Key Differences from MariaDB

### Data Types
- `INT AUTO_INCREMENT` → `INTEGER PRIMARY KEY AUTOINCREMENT`
- `ENUM` → `TEXT` with CHECK constraints
- `JSON` → `TEXT` (JSON stored as text)
- `BOOLEAN` → `INTEGER` with CHECK constraints

### Syntax
- `INSERT IGNORE` → `INSERT OR IGNORE`
- MySQL-specific functions removed or converted
- Foreign key constraints work similarly

## Sample Data

The database is initialized with:
- 4 healthcare professionals (2 doctors, 2 nurses)
- 4 sample patients
- All necessary tables and indexes

## Testing

To verify SQLite is working:
```bash
# Test database connection
curl http://localhost:3001/health

# Test API endpoints
curl http://localhost:3001/api/profissionais
curl http://localhost:3001/api/pacientes
```

## Switching Back to MariaDB

To use MariaDB instead of SQLite:
1. Update `.env` file with MariaDB credentials
2. Remove or rename `data/stixconnect_test.db`
3. Restart the server

## Notes

- SQLite is for **testing only** - not recommended for production
- Database file is stored in `backend/data/`
- All existing API endpoints work unchanged
- Performance may differ from MariaDB