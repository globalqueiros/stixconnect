const { execute } = require('../config/database');
const logger = require('../utils/logger');

async function adicionarIndicesPerformance() {
  const indices = [
    // Índices compostos para consultas frequentes
    {
      nome: 'idx_consultas_tipo_status',
      tabela: 'consultas',
      colunas: 'tipo, status',
      query: 'CREATE INDEX IF NOT EXISTS idx_consultas_tipo_status ON consultas(tipo, status)'
    },
    {
      nome: 'idx_consultas_data_status',
      tabela: 'consultas',
      colunas: 'COALESCE(data_agendamento, data_hora_inicio, created_at), status',
      query: 'CREATE INDEX IF NOT EXISTS idx_consultas_data_status ON consultas(COALESCE(data_agendamento, data_hora_inicio, created_at), status)'
    },
    {
      nome: 'idx_consultas_paciente_status',
      tabela: 'consultas',
      colunas: 'paciente_id, status',
      query: 'CREATE INDEX IF NOT EXISTS idx_consultas_paciente_status ON consultas(paciente_id, status)'
    },
    {
      nome: 'idx_consultas_medico_status',
      tabela: 'consultas',
      colunas: 'medico_id, status',
      query: 'CREATE INDEX IF NOT EXISTS idx_consultas_medico_status ON consultas(medico_id, status)'
    },
    {
      nome: 'idx_consultas_enfermeira_status',
      tabela: 'consultas',
      colunas: 'enfermeira_id, status',
      query: 'CREATE INDEX IF NOT EXISTS idx_consultas_enfermeira_status ON consultas(enfermeira_id, status)'
    },
    
    // Índices para atribuição automática
    {
      nome: 'idx_profissionais_tipo_disponivel',
      tabela: 'profissionais',
      colunas: 'tipo, disponivel, ativo',
      query: 'CREATE INDEX IF NOT EXISTS idx_profissionais_tipo_disponivel ON profissionais(tipo, disponivel, ativo)'
    },
    {
      nome: 'idx_profissionais_tipo_especialidade',
      tabela: 'profissionais',
      colunas: 'tipo, especialidade',
      query: 'CREATE INDEX IF NOT EXISTS idx_profissionais_tipo_especialidade ON profissionais(tipo, especialidade)'
    },
    
    // Índices para agendamento
    {
      nome: 'idx_agendamento_slots_disponiveis',
      tabela: 'agendamento_slots',
      colunas: 'disponivel, data, profissional_id',
      query: 'CREATE INDEX IF NOT EXISTS idx_agendamento_slots_disponiveis ON agendamento_slots(disponivel, data, profissional_id)'
    },
    {
      nome: 'idx_agendamento_slots_profissional_data',
      tabela: 'agendamento_slots',
      colunas: 'profissional_id, data, hora_inicio',
      query: 'CREATE INDEX IF NOT EXISTS idx_agendamento_slots_profissional_data ON agendamento_slots(profissional_id, data, hora_inicio)'
    },
    
    // Índices para histórico de status
    {
      nome: 'idx_status_history_consulta_data',
      tabela: 'consulta_status_history',
      colunas: 'consulta_id, created_at',
      query: 'CREATE INDEX IF NOT EXISTS idx_status_history_consulta_data ON consulta_status_history(consulta_id, created_at)'
    },
    {
      nome: 'idx_status_history_profissional_data',
      tabela: 'consulta_status_history',
      colunas: 'profissional_id, created_at',
      query: 'CREATE INDEX IF NOT EXISTS idx_status_history_profissional_data ON consulta_status_history(profissional_id, created_at)'
    },
    
    // Índices para escalas
    {
      nome: 'idx_escalas_profissional_dia',
      tabela: 'escalas',
      colunas: 'profissional_id, dia_semana',
      query: 'CREATE INDEX IF NOT EXISTS idx_escalas_profissional_dia ON escalas(profissional_id, dia_semana)'
    },
    
    // Índices para pacientes
    {
      nome: 'idx_pacientes_cpf_ativo',
      tabela: 'pacientes',
      colunas: 'cpf, ativo',
      query: 'CREATE INDEX IF NOT EXISTS idx_pacientes_cpf_ativo ON pacientes(cpf, ativo)'
    },
    
    // Índices para Zoom meetings
    {
      nome: 'idx_zoom_consulta_meeting',
      tabela: 'zoom_meetings',
      colunas: 'consulta_id, meeting_id',
      query: 'CREATE INDEX IF NOT EXISTS idx_zoom_consulta_meeting ON zoom_meetings(consulta_id, meeting_id)'
    },
    
    // Índices para tentativas de login (segurança)
    {
      nome: 'idx_login_attempts_email_data',
      tabela: 'login_attempts',
      colunas: 'email, attempted_at',
      query: 'CREATE INDEX IF NOT EXISTS idx_login_attempts_email_data ON login_attempts(email, attempted_at)'
    },
    
    // Índices para sessões de usuário
    {
      nome: 'idx_user_sessions_expires',
      tabela: 'user_sessions',
      colunas: 'expires_at, user_type',
      query: 'CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at, user_type)'
    }
  ];

  const resultados = [];
  
  try {
    for (const indice of indices) {
      try {
        await execute(indice.query);
        resultados.push({
          nome: indice.nome,
          tabela: indice.tabela,
          colunas: indice.colunas,
          status: 'sucesso'
        });
        logger.info(`Index created successfully: ${indice.nome}`);
      } catch (error) {
        resultados.push({
          nome: indice.nome,
          tabela: indice.tabela,
          colunas: indice.colunas,
          status: 'erro',
          erro: error.message
        });
        logger.warn(`Failed to create index ${indice.nome}:`, error);
      }
    }
    
    // Estatísticas dos índices
    const sucesso = resultados.filter(r => r.status === 'sucesso').length;
    const erro = resultados.filter(r => r.status === 'erro').length;
    
    logger.info(`Database indexes optimization completed`, {
      total: resultados.length,
      sucesso,
      erro
    });
    
    return {
      success: true,
      totalIndices: resultados.length,
      criados: sucesso,
      falhas: erro,
      detalhes: resultados
    };
    
  } catch (error) {
    logger.error('Error creating database indexes:', error);
    return {
      success: false,
      error: error.message,
      detalhes: resultados
    };
  }
}

// Criar views para consultas otimizadas
async function criarViewsConsulta() {
  const views = [
    {
      nome: 'v_consultas_ativas',
      query: `
        CREATE OR REPLACE VIEW v_consultas_ativas AS
        SELECT 
          c.*,
          p.nome as paciente_nome,
          p.cpf as paciente_cpf,
          p.telefone as paciente_telefone,
          e.nome as enfermeira_nome,
          m.nome as medico_nome,
          TIMESTAMPDIFF(MINUTE, c.created_at, NOW()) as tempo_espera_minutos,
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
        CREATE OR REPLACE VIEW v_profissionais_disponiveis AS
        SELECT 
          p.*,
          COUNT(c.id) as consultas_ativas,
          COUNT(CASE WHEN c.status = 'atendimento_medico' OR c.status = 'atendimento_enfermagem' THEN 1 END) as em_atendimento,
          AVG(TIMESTAMPDIFF(MINUTE, c.created_at, COALESCE(c.updated_at, NOW()))) as tempo_medio_atendimento
        FROM profissionais p
        LEFT JOIN consultas c ON (p.id = c.medico_id OR p.id = c.enfermeira_id)
          AND c.status IN ('atendimento_medico', 'atendimento_enfermagem', 'aguardando_medico', 'aguardando_enfermeira')
        WHERE p.ativo = 1
        GROUP BY p.id
        HAVING consultas_ativas < 5 -- Limite máximo de consultas simultâneas
        ORDER BY consultas_ativas ASC, p.nome ASC
      `
    },
    {
      nome: 'v_estatisticas_diarias',
      query: `
        CREATE OR REPLACE VIEW v_estatisticas_diarias AS
        SELECT 
          DATE(created_at) as data,
          COUNT(*) as total_consultas,
          COUNT(CASE WHEN tipo = 'urgente' THEN 1 END) as urgentes,
          COUNT(CASE WHEN tipo = 'agendada' THEN 1 END) as agendadas,
          COUNT(CASE WHEN status = 'finalizada' THEN 1 END) as finalizadas,
          AVG(TIMESTAMPDIFF(MINUTE, created_at, updated_at)) as tempo_medio_atendimento_minutos,
          COUNT(DISTINCT paciente_id) as pacientes_unicos,
          COUNT(DISTINCT medico_id) as medicos_atendidos
        FROM consultas
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY DATE(created_at)
        ORDER BY data DESC
      `
    }
  ];

  const resultados = [];
  
  try {
    for (const view of views) {
      try {
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
    
    logger.info(`Database views optimization completed`, {
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
    logger.error('Error creating database views:', error);
    return {
      success: false,
      error: error.message,
      detalhes: resultados
    };
  }
}

// Função principal de otimização
async function otimizarBancoDados() {
  logger.info('Starting database optimization...');
  
  const [indicesResult, viewsResult] = await Promise.all([
    adicionarIndicesPerformance(),
    criarViewsConsulta()
  ]);
  
  const resultado = {
    indices: indicesResult,
    views: viewsResult,
    success: indicesResult.success && viewsResult.success
  };
  
  logger.info('Database optimization completed', resultado);
  return resultado;
}

// Executar se chamado diretamente
if (require.main === module) {
  otimizarBancoDados()
    .then(result => {
      console.log('✅ Database optimization completed successfully!');
      console.log(`📊 Indices: ${result.indices.criados}/${result.indices.totalIndices}`);
      console.log(`👁️  Views: ${result.views.criadas}/${result.views.totalViews}`);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Database optimization failed:', error);
      process.exit(1);
    });
}

module.exports = {
  adicionarIndicesPerformance,
  criarViewsConsulta,
  otimizarBancoDados
};