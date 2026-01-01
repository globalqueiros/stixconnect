require('dotenv').config();
const { execute, pool } = require('../config/database');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

async function updatePasswords() {
    try {
        const hash = await bcrypt.hash('senha123', 10);
        console.log('Generated hash:', hash);

        await execute('UPDATE profissionais SET senha_hash = ?', [hash]);
        console.log('Passwords updated successfully for all users');

        process.exit(0);
    } catch (error) {
        console.error('Error updating passwords:', error);
        process.exit(1);
    }
}

updatePasswords();
