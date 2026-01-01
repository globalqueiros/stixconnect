const mysql = require('mysql2/promise');

async function check() {
    // Try 1: Backend .env credentials
    console.log('Trying stixuser/stix123 on stixconnect...');
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'stixuser',
            password: 'stix123',
            database: 'stixconnect'
        });
        const [rows] = await connection.execute('SELECT * FROM tb_usuario');
        console.log('Users found (stixconnect):', rows);
        await connection.end();
        return;
    } catch (err) {
        console.log('Failed stixconnect:', err.message);
    }

    // Try 2: dbs.ts credentials
    console.log('Trying root/empty on core_system...');
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            database: 'core_system',
            password: ''
        });
        const [rows] = await connection.execute('SELECT * FROM tb_usuario');
        console.log('Users found (core_system):', rows);
        await connection.end();
    } catch (e2) {
        console.error('Failed core_system:', e2.message);
    }
}

check();
