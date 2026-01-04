const { execute } = require('../config/database');
const logger = require('../utils/logger');

async function criarViewsCompatibilidadeSQLite() {
  console.log('🔧 Criando views de compatibilidade no SQLite...');
  
  try {
    // View para compatibilidade de consultas
    await execute(`
      CREATE VIEW IF NOT EXISTS tb_consultas AS
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
    await execute(`
      CREATE VIEW IF NOT EXISTS tb_paciente AS
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
    await execute(`
      CREATE VIEW IF NOT EXISTS tb_atendimento AS
      SELECT 
        c.id,
        c.paciente_id as idPaciente,
        CASE 
          WHEN c.dados_triagem IS NOT NULL 
          THEN json_extract(c.dados_triagem, '$.classificacaoUrgencia')
          ELSE 'verde'
        END as classificacao,
        (julianday('now') - julianday(c.created_at)) * 24 * 60 as tempo_espera,
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
    await execute(`
      CREATE VIEW IF NOT EXISTS tb_profissionais AS
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
    await execute(`
      CREATE VIEW IF NOT EXISTS tb_prontuario AS
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
    
    const [testConsulta] = await execute('SELECT COUNT(*) as total FROM tb_consultas');
    console.log(`📊 tb_consultas: ${testConsulta.total} registros`);
    
    const [testPaciente] = await execute('SELECT COUNT(*) as total FROM tb_paciente');
    console.log(`👥 tb_paciente: ${testPaciente.total} registros`);
    
    const [testAtendimento] = await execute('SELECT COUNT(*) as total FROM tb_atendimento');
    console.log(`🏥 tb_atendimento: ${testAtendimento.total} registros pendentes`);
    
    const [testProfissionais] = await execute('SELECT COUNT(*) as total FROM tb_profissionais');
    console.log(`👨‍⚕️ tb_profissionais: ${testProfissionais.total} registros`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao criar views:', error);
    logger.error('Error creating compatibility views:', error);
    throw error;
  }
}

// Criar dados de teste se necessário
async function criarDadosTeste() {
  console.log('\n🎲 Verificando dados de teste...');
  
  try {
    // Verificar se há dados
    const [pacientesCount] = await execute('SELECT COUNT(*) as total FROM pacientes');
    
    if (pacientesCount.total === 0) {
      console.log('⚠️ Nenhum paciente encontrado. Execute o init-sqlite.js primeiro.');
      return false;
    }
    
    // Verificar se há consultas pendentes
    const [consultasPendentes] = await execute(`
      SELECT COUNT(*) as total FROM tb_atendimento WHERE status = 0
    `);
    
    if (consultasPendentes.total === 0) {
      // Criar uma consulta de teste para simular o fluxo
      console.log('📝 Criando consulta de teste...');
      
      const [result] = await execute(`
        INSERT INTO consultas (
          tipo, paciente_id, status, dados_triagem, created_at
        ) VALUES (?, ?, ?, ?, datetime('now'))
      `, [
        'urgente',
        1, // José da Silva
        'triagem',
        JSON.stringify({
          sintomas: 'Dor de cabeça e febre',
          duracaoSintomas: '2 dias',
          intensidadeDor: 'moderada',
          classificacaoUrgencia: 'amarelo',
          pressaoArterial: '130/85',
          frequenciaCardiaca: 88,
          temperatura: 37.8,
          saturacaoOxigenio: 96,
          observacoes: 'Paciente relata mal-estar geral'
        })
      ]);
      
      console.log(`✅ Consulta de teste criada com ID: ${result.lastID}`);
      
      // Registrar no histórico
      await execute(`
        INSERT INTO consulta_status_history (
          consulta_id, status_anterior, status_novo, observacao, created_at
        ) VALUES (?, NULL, ?, ?, datetime('now'))
      `, [result.lastID, 'triagem', 'Consulta de teste para demo']);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao criar dados de teste:', error);
    throw error;
  }
}

// Função principal
async function inicializarCompatibilidadeSQLite() {
  console.log('🚀 Inicializando sistema de compatibilidade SQLite...\n');
  
  try {
    await criarViewsCompatibilidadeSQLite();
    await criarDadosTeste();
    
    console.log('\n✅ Sistema de compatibilidade SQLite inicializado com sucesso!');
    console.log('📋 Frontend antigo agora pode usar views tb_* sem modificações');
    console.log('🔄 Sistema novo continua usando tabelas padrão (consultas, pacientes, etc.)');
    console.log('🌐 Frontend conectado via API poderá acessar dados corretamente');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ Falha na inicialização:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  inicializarCompatibilidadeSQLite()
    .then(success => {
      console.log('\n🎯 Compatibilidade pronta para uso!');
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = {
  criarViewsCompatibilidadeSQLite,
  criarDadosTeste,
  inicializarCompatibilidadeSQLite
};