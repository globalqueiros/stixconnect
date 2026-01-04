const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { initializeDatabase, execute } = require('../config/database');

// SQLite schema conversion from MySQL
const createSQLiteTables = `
-- Patients table
CREATE TABLE IF NOT EXISTS pacientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cpf TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    telefone TEXT,
    data_nascimento TEXT,
    senha_hash TEXT, -- Password for patient login
    ativo INTEGER DEFAULT 1 CHECK(ativo IN (0, 1)),
    ultimo_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Healthcare professionals table
CREATE TABLE IF NOT EXISTS profissionais (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK(tipo IN ('enfermeira', 'medico')),
    crm_coren TEXT UNIQUE,
    email TEXT UNIQUE NOT NULL,
    senha_hash TEXT NOT NULL,
    disponivel INTEGER DEFAULT 1 CHECK(disponivel IN (0, 1)),
    ativo INTEGER DEFAULT 1 CHECK(ativo IN (0, 1)),
    ultimo_login DATETIME,
    especialidade TEXT, -- Doctor specialty
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User sessions table for authentication
CREATE TABLE IF NOT EXISTS user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    user_type TEXT NOT NULL CHECK(user_type IN ('paciente', 'profissional')),
    token_hash TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES profissionais(id) ON DELETE CASCADE
);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_resets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    user_type TEXT NOT NULL CHECK(user_type IN ('paciente', 'profissional')),
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    used INTEGER DEFAULT 0 CHECK(used IN (0, 1)),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Available schedules for professionals
CREATE TABLE IF NOT EXISTS escalas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profissional_id INTEGER NOT NULL,
    dia_semana INTEGER NOT NULL CHECK(dia_semana IN (0, 1, 2, 3, 4, 5, 6)), -- 0 = Sunday
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,
    ativo INTEGER DEFAULT 1 CHECK(ativo IN (0, 1)),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (profissional_id) REFERENCES profissionais(id) ON DELETE CASCADE
);

-- Scheduled appointments slots
CREATE TABLE IF NOT EXISTS agendamento_slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profissional_id INTEGER NOT NULL,
    data DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,
    duracao_minutos INTEGER DEFAULT 30,
    disponivel INTEGER DEFAULT 1 CHECK(disponivel IN (0, 1)),
    consulta_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (profissional_id) REFERENCES profissionais(id) ON DELETE CASCADE,
    FOREIGN KEY (consulta_id) REFERENCES consultas(id) ON DELETE SET NULL,
    UNIQUE (profissional_id, data, hora_inicio)
);

-- Login attempts for security
CREATE TABLE IF NOT EXISTS login_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    ip_address TEXT,
    success INTEGER NOT NULL CHECK(success IN (0, 1)),
    user_type TEXT,
    attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Consultations table
CREATE TABLE IF NOT EXISTS consultas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo TEXT NOT NULL CHECK(tipo IN ('urgente', 'agendada')),
    paciente_id INTEGER NOT NULL,
    enfermeira_id INTEGER,
    medico_id INTEGER,
    status TEXT DEFAULT 'triagem' CHECK(status IN (
        'triagem',
        'aguardando_enfermeira',
        'atendimento_enfermagem',
        'aguardando_medico',
        'atendimento_medico',
        'finalizada',
        'cancelada'
    )),
    zoom_meeting_id TEXT,
    zoom_link TEXT,
    data_hora_inicio DATETIME,
    data_hora_fim DATETIME,
    duracao_minutos INTEGER,
    dados_triagem TEXT, -- JSON stored as TEXT in SQLite
    observacoes TEXT,
    data_agendamento DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE RESTRICT,
    FOREIGN KEY (enfermeira_id) REFERENCES profissionais(id) ON DELETE SET NULL,
    FOREIGN KEY (medico_id) REFERENCES profissionais(id) ON DELETE SET NULL
);

-- Zoom meetings log table
CREATE TABLE IF NOT EXISTS zoom_meetings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    consulta_id INTEGER NOT NULL,
    meeting_id TEXT NOT NULL,
    topic TEXT,
    start_url TEXT,
    join_url TEXT,
    password TEXT,
    settings TEXT, -- JSON stored as TEXT in SQLite
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (consulta_id) REFERENCES consultas(id) ON DELETE CASCADE,
    UNIQUE (consulta_id)
);

-- Consultation status history (audit trail)
CREATE TABLE IF NOT EXISTS consulta_status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    consulta_id INTEGER NOT NULL,
    status_anterior TEXT,
    status_novo TEXT NOT NULL,
    profissional_id INTEGER,
    observacao TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (consulta_id) REFERENCES consultas(id) ON DELETE CASCADE,
    FOREIGN KEY (profissional_id) REFERENCES profissionais(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pacientes_cpf ON pacientes(cpf);
CREATE INDEX IF NOT EXISTS idx_pacientes_email ON pacientes(email);
CREATE INDEX IF NOT EXISTS idx_profissionais_tipo ON profissionais(tipo);
CREATE INDEX IF NOT EXISTS idx_profissionais_disponivel ON profissionais(disponivel);
CREATE INDEX IF NOT EXISTS idx_profissionais_email ON profissionais(email);
CREATE INDEX IF NOT EXISTS idx_consultas_status ON consultas(status);
CREATE INDEX IF NOT EXISTS idx_consultas_tipo ON consultas(tipo);
CREATE INDEX IF NOT EXISTS idx_consultas_paciente ON consultas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_consultas_enfermeira ON consultas(enfermeira_id);
CREATE INDEX IF NOT EXISTS idx_consultas_medico ON consultas(medico_id);
CREATE INDEX IF NOT EXISTS idx_consultas_data_inicio ON consultas(data_hora_inicio);
CREATE INDEX IF NOT EXISTS idx_consultas_data_agendamento ON consultas(data_agendamento);
CREATE INDEX IF NOT EXISTS idx_consultas_created_at ON consultas(created_at);
CREATE INDEX IF NOT EXISTS idx_zoom_meetings_meeting_id ON zoom_meetings(meeting_id);
CREATE INDEX IF NOT EXISTS idx_consulta_status_history_consulta ON consulta_status_history(consulta_id);
CREATE INDEX IF NOT EXISTS idx_consulta_status_history_status_novo ON consulta_status_history(status_novo);
CREATE INDEX IF NOT EXISTS idx_consulta_status_history_created_at ON consulta_status_history(created_at);

-- Indexes for new tables
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON password_resets(user_id);
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);
CREATE INDEX IF NOT EXISTS idx_password_resets_expires_at ON password_resets(expires_at);
CREATE INDEX IF NOT EXISTS idx_escalas_profissional_id ON escalas(profissional_id);
CREATE INDEX IF NOT EXISTS idx_escalas_dia_semana ON escalas(dia_semana);
CREATE INDEX IF NOT EXISTS idx_agendamento_slots_profissional_id ON agendamento_slots(profissional_id);
CREATE INDEX IF NOT EXISTS idx_agendamento_slots_data ON agendamento_slots(data);
CREATE INDEX IF NOT EXISTS idx_agendamento_slots_disponivel ON agendamento_slots(disponivel);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_attempted_at ON login_attempts(attempted_at);
`;

// Sample data insertions
const insertSampleData = `
INSERT OR IGNORE INTO profissionais (id, nome, tipo, crm_coren, email, senha_hash) VALUES
(1, 'Dra. Ana Silva', 'medico', 'CRM/SP 123456', 'ana@stixmed.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
(2, 'Enf. João Santos', 'enfermeira', 'COREN/SP 789012', 'joao@stixmed.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
(3, 'Dr. Carlos Oliveira', 'medico', 'CRM/SP 345678', 'carlos@stixmed.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
(4, 'Enf. Maria Costa', 'enfermeira', 'COREN/SP 901234', 'maria@stixmed.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

INSERT OR IGNORE INTO pacientes (id, nome, cpf, email, telefone, data_nascimento) VALUES
(1, 'José da Silva', '123.456.789-00', 'jose@email.com', '(11) 99999-8888', '1980-05-15'),
(2, 'Maria Oliveira', '987.654.321-00', 'maria@email.com', '(11) 97777-6666', '1992-08-22'),
(3, 'Pedro Santos', '456.789.123-00', 'pedro@email.com', '(11) 95555-4444', '1975-12-10'),
(4, 'Ana Costa', '789.123.456-00', 'ana@email.com', '(11) 93333-2222', '1988-03-28');

-- Insert sample work schedules for professionals
INSERT OR IGNORE INTO escalas (profissional_id, dia_semana, hora_inicio, hora_fim) VALUES
(1, 1, '08:00', '12:00'), -- Monday morning
(1, 1, '14:00', '18:00'), -- Monday afternoon
(1, 2, '08:00', '12:00'), -- Tuesday morning
(1, 3, '08:00', '12:00'), -- Wednesday morning
(1, 4, '08:00', '12:00'), -- Thursday morning
(1, 5, '08:00', '12:00'), -- Friday morning
(3, 2, '14:00', '18:00'), -- Tuesday afternoon
(3, 3, '14:00', '18:00'), -- Wednesday afternoon
(3, 4, '14:00', '18:00'); -- Thursday afternoon

-- Insert sample consultation slots
INSERT OR IGNORE INTO agendamento_slots (profissional_id, data, hora_inicio, hora_fim, duracao_minutos) VALUES
(1, '2026-01-06', '08:00', '08:30', 30),
(1, '2026-01-06', '08:30', '09:00', 30),
(1, '2026-01-06', '09:00', '09:30', 30),
(1, '2026-01-06', '09:30', '10:00', 30),
(1, '2026-01-06', '10:00', '10:30', 30),
(3, '2026-01-07', '14:00', '14:30', 30),
(3, '2026-01-07', '14:30', '15:00', 30),
(3, '2026-01-07', '15:00', '15:30', 30),
(3, '2026-01-07', '15:30', '16:00', 30);
`;

async function initializeSQLite() {
  console.log('Initializing SQLite database...');
  
  try {
    // Initialize database connection
    await initializeDatabase();
    
    // Create tables
    console.log('Creating tables...');
    const statements = createSQLiteTables.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await execute(statement);
      }
    }
    
    // Insert sample data
    console.log('Inserting sample data...');
    const dataStatements = insertSampleData.split(';').filter(stmt => stmt.trim());
    
    for (const statement of dataStatements) {
      if (statement.trim()) {
        await execute(statement);
      }
    }
    
    console.log('SQLite database initialized successfully!');
    return true;
  } catch (error) {
    console.error('Error initializing SQLite database:', error);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  initializeSQLite()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Initialization failed:', error);
      process.exit(1);
    });
}

module.exports = { initializeSQLite };