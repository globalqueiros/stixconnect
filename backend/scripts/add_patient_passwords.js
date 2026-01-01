const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function addPasswordToPatients() {
    const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'stixuser',
        password: process.env.DB_PASSWORD || 'stix123',
        database: process.env.DB_NAME || 'stixconnect',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    };

    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database');

        // Check if senha_hash column exists
        const [columns] = await connection.execute(
            `SHOW COLUMNS FROM pacientes LIKE 'senha_hash'`
        );

        if (columns.length === 0) {
            console.log('⚠️ Column senha_hash does not exist. Running migration...');
            await connection.execute(`
                ALTER TABLE pacientes 
                ADD COLUMN senha_hash VARCHAR(255) AFTER email
            `);
            console.log('✅ Column senha_hash added successfully');
        } else {
            console.log('✅ Column senha_hash already exists');
        }

        // Get all patients without passwords
        const [patients] = await connection.execute(
            'SELECT id, nome, email, cpf FROM pacientes WHERE senha_hash IS NULL OR senha_hash = ""'
        );

        console.log(`Found ${patients.length} patients without passwords`);

        if (patients.length === 0) {
            console.log('🎉 All patients already have passwords!');
            await connection.end();
            return;
        }

        // Create passwords for each patient
        for (const patient of patients) {
            // Generate default password: cpf without punctuation
            const defaultPassword = patient.cpf.replace(/\D/g, '').slice(-6);
            
            // Hash the password
            const senhaHash = await bcrypt.hash(defaultPassword, 10);
            
            // Update patient record
            await connection.execute(
                'UPDATE pacientes SET senha_hash = ? WHERE id = ?',
                [senhaHash, patient.id]
            );
            
            console.log(`✅ Password created for patient: ${patient.nome} (ID: ${patient.id})`);
            console.log(`   Email: ${patient.email}`);
            console.log(`   Default password: ${defaultPassword}`);
            console.log('');
        }

        console.log(`🎉 Successfully created passwords for ${patients.length} patients!`);
        console.log('\nLogin credentials:');
        patients.forEach(patient => {
            const defaultPassword = patient.cpf.replace(/\D/g, '').slice(-6);
            console.log(`Email: ${patient.email} | Password: ${defaultPassword}`);
        });

        await connection.end();

    } catch (error) {
        console.error('❌ Error adding passwords:', error);
    }
}

addPasswordToPatients();