const { execute } = require('../config/database');
const logger = require('../utils/logger');

async function criarViewsSQLite() {
  const views = [
    {
      nome: 'v_consultas_ativas',
      query: `
        CREATE VIEW IF NOT EXISTS v_consultas_ativas AS
        SELECT 
          c.*,
          p.nome as paciente_nome,
          p.cpf as paciente_cpf,
          p.telefone as paciente_telefone,
          e.nome as enfermeira_nome,
          m.nome as medico_nome,
          (julianday('now') - julianday(c.created_at)) * 24 * 60 as tempo_espera_minutos,
          CASE 
            WHEN c.status IN ('atendimento_enfermagem', 'atendimento_medico') THEN 'em_atendimento'
            WHEN c.status IN ('triagem', 'aguardando_enfermeira', 'aguardando_medico') THEN 'aguardando'
            ELSE 'finalizada'
          END as categoria_status
        FROM consultas c
        JOIN pacientes p ON c.paciente_id = p.id
        LEFT JOIN profissionais e ON c.enfermeira_id = e.id
        LEFT JOIN profissionais m ON c.medico_id = m.id
        WHERE c.status NOT IN ('finalizada', 'cancelada')
        ORDER BY 
          CASE c.status 
            WHEN 'triagem' THEN 1
            WHEN 'aguardando_enfermeira' THEN 2
            WHEN 'atendimento_enfermagem' THEN 3
            WHEN 'aguardando_medico' THEN 4
            WHEN 'atendimento_medico' THEN 5
            ELSE 6
          END,
          c.created_at ASC
      `
    },
    {
      nome: 'v_profissionais_disponiveis',
      query: `
        CREATE VIEW IF NOT EXISTS v_profissionais_disponiveis AS
        SELECT 
          p.*,
          COUNT(c.id) as consultas_ativas,
          SUM(CASE WHEN c.status = 'atendimento_medico' OR c.status = 'atendimento_enfermagem' THEN 1 ELSE 0 END) as em_atendimento,
          AVG((julianday(COALESCE(c.updated_at, 'now')) - julianday(c.created_at)) * 24 * 60) as tempo_medio_atendimento
        FROM profissionais p
        LEFT JOIN consultas c ON (p.id = c.medico_id OR p.id = c.enfermeira_id)
          AND c.status IN ('atendimento_medico', 'atendimento_enfermagem', 'aguardando_medico', 'aguardando_enfermeira')
        WHERE p.disponivel = 1
        GROUP BY p.id
        HAVING consultas_ativas < 5
        ORDER BY consultas_ativas ASC, p.nome ASC
      `
    },
    {
      nome: 'v_estatisticas_diarias',
      query: `
        CREATE VIEW IF NOT EXISTS v_estatisticas_diarias AS
        SELECT 
          DATE(c.created_at) as data,
          COUNT(*) as total_consultas,
          SUM(CASE WHEN c.tipo = 'urgente' THEN 1 ELSE 0 END) as urgentes,
          SUM(CASE WHEN c.tipo = 'agendada' THEN 1 ELSE 0 END) as agendadas,
          SUM(CASE WHEN c.status = 'finalizada' THEN 1 ELSE 0 END) as finalizadas,
          AVG((julianday(c.updated_at) - julianday(c.created_at)) * 24 * 60) as tempo_medio_atendimento_minutos,
          COUNT(DISTINCT c.paciente_id) as pacientes_unicos,
          COUNT(DISTINCT c.medico_id) as medicos_atendidos
        FROM consultas c
        WHERE c.created_at >= DATE('now', '-30 days')
        GROUP BY DATE(c.created_at)
        ORDER BY data DESC
      `
    }
  ];

  const resultados = [];
  
  try {
    for (const view of views) {
      try {
        // Primeiro, remove a view se existir (SQLite não suporta OR REPLACE em views)
        await execute(`DROP VIEW IF EXISTS ${view.nome}`);
        
        // Depois, cria a view
        await execute(view.query);
        
        resultados.push({
          nome: view.nome,
          status: 'sucesso'
        });
        logger.info(`View created successfully: ${view.nome}`);
      } catch (error) {
        resultados.push({
          nome: view.nome,
          status: 'erro',
          erro: error.message
        });
        logger.warn(`Failed to create view ${view.nome}:`, error);
      }
    }
    
    const sucesso = resultados.filter(r => r.status === 'sucesso').length;
    const erro = resultados.filter(r => r.status === 'erro').length;
    
    logger.info(`SQLite views optimization completed`, {
      total: resultados.length,
      sucesso,
      erro
    });
    
    return {
      success: true,
      totalViews: resultados.length,
      criadas: sucesso,
      falhas: erro,
      detalhes: resultados
    };
    
  } catch (error) {
    logger.error('Error creating SQLite views:', error);
    return {
      success: false,
      error: error.message,
      detalhes: resultados
    };
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  criarViewsSQLite()
    .then(result => {
      console.log('✅ SQLite views optimization completed successfully!');
      console.log(`👁️  Views: ${result.criadas}/${result.totalViews}`);
      if (result.falhas > 0) {
        console.log(`⚠️  ${result.falhas} views failed to create`);
      }
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ SQLite views optimization failed:', error);
      process.exit(1);
    });
}

module.exports = { criarViewsSQLite };