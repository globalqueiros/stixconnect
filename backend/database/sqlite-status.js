const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'stixconnect_test.db');

function queryDatabase(sql, params = []) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
    
    db.close();
  });
}

async function showDatabaseInfo() {
  try {
    console.log('🗄️  StixConnect SQLite Database Info');
    console.log('=====================================\n');
    
    // Show tables
    const tables = await queryDatabase(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name
    `);
    
    console.log('📋 Tables:');
    tables.forEach(table => {
      console.log(`  • ${table.name}`);
    });
    
    console.log('\n👥 Patients:');
    const pacientes = await queryDatabase('SELECT id, nome, cpf FROM pacientes ORDER BY id');
    pacientes.forEach(p => {
      console.log(`  ${p.id}. ${p.nome} (${p.cpf})`);
    });
    
    console.log('\n👨‍⚕️ Professionals:');
    const profissionais = await queryDatabase('SELECT id, nome, tipo FROM profissionais ORDER BY id');
    profissionais.forEach(p => {
      console.log(`  ${p.id}. ${p.nome} (${p.tipo})`);
    });
    
    console.log('\n📅 Available Slots:');
    const slots = await queryDatabase(`
      SELECT COUNT(*) as total FROM agendamento_slots 
      WHERE disponivel = 1
    `);
    console.log(`  ${slots[0].total} slots available`);
    
    console.log('\n💾 Database file:');
    console.log(`  ${dbPath}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

if (require.main === module) {
  showDatabaseInfo();
}

module.exports = { queryDatabase };