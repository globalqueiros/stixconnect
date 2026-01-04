const mysql = require('mysql2/promise');

// Configuração do banco MySQL (produção)
const db = mysql.createPool({
  host: process.env.DB_HOST || '184.168.114.4',
  user: process.env.DB_USER || 'stix_prod_rw', 
  password: process.env.DB_PASSWORD || 't{UX9(x7s5*',
  database: process.env.DB_NAME || 'stixconnect',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function criarViewsCompatibilidade() {
  console.log('🔧 Criando views de compatibilidade...');
  
  try {
    const connection = await db.getConnection();
    
    try {
      // View para compatibilidade de consultas
      await connection.execute(`
        CREATE OR REPLACE VIEW tb_consultas AS
        SELECT 
          c.id as idConsulta,
          c.paciente_id as idPaciente,
          c.data_hora_inicio as data_consulta,
          TIME(c.data_hora_inicio) as hora_consulta,
          c.status,
          c.tipo,
          c.enfermeira_id,
          c.medico_id,
          c.duracao_minutos,
          c.observacoes,
          c.created_at
        FROM consultas c
      `);
      console.log('✅ View tb_consultas criada com sucesso');
      
      // View para compatibilidade de pacientes
      await connection.execute(`
        CREATE OR REPLACE VIEW tb_paciente AS
        SELECT 
          p.id as idPaciente,
          p.nome,
          p.cpf,
          p.email,
          p.telefone as wappNumber,
          p.data_nascimento,
          p.created_at
        FROM pacientes p
      `);
      console.log('✅ View tb_paciente criada com sucesso');
      
      // View para compatibilidade de atendimentos (usada no dashboard enfermagem)
      await connection.execute(`
        CREATE OR REPLACE VIEW tb_atendimento AS
        SELECT 
          c.id,
          c.paciente_id as idPaciente,
          CASE 
            WHEN c.dados_triagem IS NOT NULL AND JSON_VALID(c.dados_triagem)
            THEN JSON_UNQUOTE(JSON_EXTRACT(c.dados_triagem, '$.classificacaoUrgencia'))
            ELSE 'verde'
          END as classificacao,
          TIMESTAMPDIFF(MINUTE, c.created_at, NOW()) as tempo_espera,
          CASE 
            WHEN c.status IN ('triagem', 'aguardando_enfermeira') THEN 0
            ELSE 1
          END as status,
          c.created_at,
          c.status as consulta_status
        FROM consultas c
        WHERE c.status IN ('triagem', 'aguardando_enfermeira', 'atendimento_enfermagem')
        ORDER BY c.created_at ASC
      `);
      console.log('✅ View tb_atendimento criada com sucesso');
      
      // View para compatibilidade de profissionais
      await connection.execute(`
        CREATE OR REPLACE VIEW tb_profissionais AS
        SELECT 
          p.id as idProfissional,
          p.nome,
          p.tipo,
          p.crm_coren,
          p.email,
          p.disponivel,
          p.created_at
        FROM profissionais p
      `);
      console.log('✅ View tb_profissionais criada com sucesso');
      
      // View para prontuários (para compatibilidade)
      await connection.execute(`
        CREATE OR REPLACE VIEW tb_prontuario AS
        SELECT 
          c.id as numProntuario,
          c.paciente_id as idPaciente,
          c.tipo,
          c.status,
          c.dados_triagem,
          c.dados_anamnese,
          c.dados_prescricao,
          c.data_hora_inicio,
          c.created_at
        FROM consultas c
        WHERE c.status NOT IN ('finalizada', 'cancelada')
      `);
      console.log('✅ View tb_prontuario criada com sucesso');
      
      console.log('\n🎉 Todas as views de compatibilidade foram criadas com sucesso!');
      
      // Testar as views
      console.log('\n🧪 Testando views...');
      
      const [testConsulta] = await connection.execute('SELECT COUNT(*) as total FROM tb_consultas');
      console.log(`📊 tb_consultas: ${testConsulta[0].total} registros`);
      
      const [testPaciente] = await connection.execute('SELECT COUNT(*) as total FROM tb_paciente');
      console.log(`👥 tb_paciente: ${testPaciente[0].total} registros`);
      
      const [testAtendimento] = await connection.execute('SELECT COUNT(*) as total FROM tb_atendimento');
      console.log(`🏥 tb_atendimento: ${testAtendimento[0].total} registros pendentes`);
      
      const [testProfissionais] = await connection.execute('SELECT COUNT(*) as total FROM tb_profissionais');
      console.log(`👨‍⚕️ tb_profissionais: ${testProfissionais[0].total} registros`);
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('❌ Erro ao criar views:', error);
    throw error;
  }
}

// Criar trigger para atualização automática de tempo de espera
async function criarTriggers() {
  console.log('\n⚙️ Criando triggers...');
  
  try {
    const connection = await db.getConnection();
    
    try {
      // Trigger para atualizar timestamps automaticamente
      await connection.execute(`
        DROP TRIGGER IF EXISTS consultas_before_update
      `);
      
      await connection.execute(`
        CREATE TRIGGER consultas_before_update
        BEFORE UPDATE ON consultas
        FOR EACH ROW
        BEGIN
          SET NEW.updated_at = CURRENT_TIMESTAMP;
        END
      `);
      
      console.log('✅ Trigger consultas_before_update criado com sucesso');
      
      // Trigger para logging de mudanças de status
      await connection.execute(`
        DROP TRIGGER IF EXISTS consulta_status_change
      `);
      
      await connection.execute(`
        CREATE TRIGGER consulta_status_change
        BEFORE UPDATE ON consultas
        FOR EACH ROW
        BEGIN
          IF OLD.status != NEW.status THEN
            INSERT INTO consulta_status_history 
            (consulta_id, status_anterior, status_novo, profissional_id, created_at)
            VALUES (NEW.id, OLD.status, NEW.status, 
                    CASE 
                      WHEN NEW.enfermeira_id IS NOT NULL THEN NEW.enfermeira_id
                      WHEN NEW.medico_id IS NOT NULL THEN NEW.medico_id
                      ELSE NULL
                    END,
                    CURRENT_TIMESTAMP);
          END IF;
        END
      `);
      
      console.log('✅ Trigger consulta_status_change criado com sucesso');
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('❌ Erro ao criar triggers:', error);
    throw error;
  }
}

// Função principal
async function inicializarCompatibilidade() {
  console.log('🚀 Inicializando sistema de compatibilidade...\n');
  
  try {
    await criarViewsCompatibilidade();
    await criarTriggers();
    
    console.log('\n✅ Sistema de compatibilidade inicializado com sucesso!');
    console.log('📋 Frontend antigo agora pode usar views tb_* sem modificações');
    console.log('🔄 Sistema novo continua usando tabelas padrão (consultas, pacientes, etc.)');
    
  } catch (error) {
    console.error('\n❌ Falha na inicialização:', error);
    process.exit(1);
  } finally {
    await db.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  inicializarCompatibilidade();
}

module.exports = {
  criarViewsCompatibilidade,
  criarTriggers,
  inicializarCompatibilidade
};