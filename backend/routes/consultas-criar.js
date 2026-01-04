const express = require('express');
const { criarConsultaSchema, atribuirProfissionalSchema } = require('../utils/validation-consultas');
const ProfissionalService = require('../services/profissional-service');
const { execute, transaction } = require('../config/database');
const logger = require('../utils/logger');
const { authenticateToken } = require('./auth');

const router = express.Router();

// POST /api/consultas/criar - Endpoint unificado para criação
router.post('/criar', async (req, res) => {
  try {
    // Validar dados de entrada
    const validatedData = criarConsultaSchema.parse(req.body);

    // Verificar se paciente existe
    const [paciente] = await execute(
      'SELECT id, nome, email FROM pacientes WHERE id = ?',
      [validatedData.pacienteId]
    );

    if (!paciente) {
      return res.status(404).json({
        error: 'Paciente não encontrado',
        code: 'PATIENT_NOT_FOUND'
      });
    }

    let consultaId, novoStatus;

    await transaction(async (connection) => {
      if (validatedData.tipo === 'urgente') {
        // Criar consulta urgente com dados de triagem
        const [result] = await connection.execute(
          `INSERT INTO consultas (
            tipo, paciente_id, status, dados_triagem, data_hora_inicio, created_at
          ) VALUES (?, ?, ?, ?, NOW(), NOW())`,
          [
            'urgente',
            validatedData.pacienteId,
            'triagem',
            JSON.stringify(validatedData.dadosTriagem)
          ]
        );
        
        consultaId = result.insertId;
        novoStatus = 'triagem';

        // Tentar atribuir enfermeira automaticamente
        try {
          const enfermeira = await ProfissionalService.getAvailableProfissional('enfermeira');
          if (enfermeira) {
            await connection.execute(
              `UPDATE consultas SET enfermeira_id = ?, status = 'aguardando_enfermeira', updated_at = NOW() WHERE id = ?`,
              [enfermeira.id, consultaId]
            );
            
            await connection.execute(
              `INSERT INTO consulta_status_history (
                consulta_id, status_anterior, status_novo, profissional_id, observacao
              ) VALUES (?, ?, ?, ?, ?)`,
              [consultaId, 'triagem', 'aguardando_enfermeira', enfermeira.id, `Atribuição automática: ${enfermeira.nome}`]
            );
            
            novoStatus = 'aguardando_enfermeira';
          }
        } catch (error) {
          logger.warn('Could not assign nurse automatically:', error);
        }

      } else if (validatedData.tipo === 'agendada') {
        // Validar se profissional existe e está disponível
        const [profissional] = await execute(
          'SELECT id, nome, tipo, disponivel FROM profissionais WHERE id = ? AND ativo = 1',
          [validatedData.dadosAgendamento.profissionalId]
        );

        if (!profissional) {
          throw new Error('Profissional não encontrado ou inativo');
        }

        // Verificar conflito de horário
        const dataHora = new Date(validatedData.dadosAgendamento.dataHora);
        const temConflito = await ProfissionalService.verificarConflitoHorario(
          profissional.id,
          dataHora,
          validatedData.dadosAgendamento.duracaoMinutos
        );

        if (temConflito) {
          throw new Error('Profissional já possui consulta agendada neste horário');
        }

        const dataHoraFim = new Date(
          dataHora.getTime() + validatedData.dadosAgendamento.duracaoMinutos * 60000
        );

        // Criar consulta agendada
        const [result] = await connection.execute(
          `INSERT INTO consultas (
            tipo, paciente_id, medico_id, status, data_agendamento, 
            data_hora_inicio, data_hora_fim, duracao_minutos, 
            observacoes, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            'agendada',
            validatedData.pacienteId,
            profissional.id,
            'aguardando_medico',
            dataHora,
            dataHora,
            dataHoraFim,
            validatedData.dadosAgendamento.duracaoMinutos,
            `Motivo: ${validatedData.dadosAgendamento.motivo}`
          ]
        );

        consultaId = result.insertId;
        novoStatus = 'aguardando_medico';

        // Registrar no histórico
        await connection.execute(
          `INSERT INTO consulta_status_history (
            consulta_id, status_anterior, status_novo, profissional_id, observacao
          ) VALUES (?, NULL, ?, ?, ?)`,
          [consultaId, 'aguardando_medico', profissional.id, `Consulta agendada com ${profissional.nome}`]
        );
      }
    });

    // Registrar log
    logger.info(`Consulta criada com sucesso`, {
      consultaId,
      tipo: validatedData.tipo,
      pacienteId: validatedData.pacienteId,
      pacienteNome: paciente.nome,
      status: novoStatus,
      timestamp: new Date().toISOString()
    });

    // Retornar resposta
    const response = {
      success: true,
      data: {
        consultaId,
        tipo: validatedData.tipo,
        status: novoStatus,
        paciente: {
          id: paciente.id,
          nome: paciente.nome,
          email: paciente.email
        },
        mensagem: validatedData.tipo === 'urgente' 
          ? 'Triagem registrada com sucesso. Aguardando atribuição de profissional.'
          : 'Consulta agendada com sucesso.',
        proximoPasso: validatedData.tipo === 'urgente' 
          ? 'Aguardando atendimento da enfermeira'
          : 'Confirme seu comparecimento no horário agendado'
      }
    };

    res.status(201).json(response);

  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Dados inválidos',
        code: 'VALIDATION_ERROR',
        details: error.errors
      });
    }

    logger.error('Error creating consultation:', error);
    res.status(500).json({
      error: 'Erro ao criar consulta',
      code: 'CREATION_ERROR',
      message: error.message
    });
  }
});

// POST /api/consultas/:id/atribuir-profissional - Atribuição manual
router.post('/:id/atribuir-profissional', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = atribuirProfissionalSchema.parse({ ...req.body, consultaId: parseInt(id) });

    const resultado = await ProfissionalService.atribuirAutomaticamente(
      validatedData.consultaId,
      validatedData.tipoProfissional,
      validatedData.especialidade,
      validatedData.forcarAtribuicao
    );

    logger.info(`Professional assigned manually`, {
      consultaId: resultado.consultaId,
      profissionalId: resultado.profissional.id,
      profissionalNome: resultado.profissional.nome,
      status: resultado.novoStatus
    });

    res.json({
      success: true,
      data: {
        consultaId: resultado.consultaId,
        profissional: resultado.profissional,
        statusAnterior: resultado.statusAnterior,
        novoStatus: resultado.novoStatus,
        mensagem: `Profissional ${resultado.profissional.nome} atribuído com sucesso`
      }
    });

  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors
      });
    }

    logger.error('Error assigning professional:', error);
    res.status(500).json({
      error: 'Erro ao atribuir profissional',
      message: error.message
    });
  }
});

// GET /api/consultas/profissionais-disponiveis - Listar profissionais disponíveis
router.get('/profissionais-disponiveis', authenticateToken, async (req, res) => {
  try {
    const { tipo, especialidade } = req.query;

    if (!tipo || !['enfermeira', 'medico'].includes(tipo)) {
      return res.status(400).json({
        error: 'Tipo de profissional inválido',
        code: 'INVALID_TYPE'
      });
    }

    const profissionais = await ProfissionalService.getAvailableProfissionais(tipo, especialidade);

    res.json({
      success: true,
      data: profissionais,
      total: profissionais.length
    });

  } catch (error) {
    logger.error('Error getting available professionals:', error);
    res.status(500).json({
      error: 'Erro ao buscar profissionais disponíveis',
      message: error.message
    });
  }
});

// GET /api/consultas/estatisticas - Estatísticas do sistema
router.get('/estatisticas', authenticateToken, async (req, res) => {
  try {
    const { tipo } = req.query;

    const [estatisticasProfissionais, estatisticasConsultas] = await Promise.all([
      ProfissionalService.getEstatisticasProfissionais(tipo),
      execute(`
        SELECT 
          tipo,
          status,
          COUNT(*) as total,
          AVG(TIMESTAMPDIFF(MINUTE, created_at, updated_at)) as tempo_medio_minutos
        FROM consultas
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        GROUP BY tipo, status
        ORDER BY tipo, status
      `)
    ]);

    res.json({
      success: true,
      data: {
        profissionais: estatisticasProfissionais,
        consultas: estatisticasConsultas
      }
    });

  } catch (error) {
    logger.error('Error getting statistics:', error);
    res.status(500).json({
      error: 'Erro ao obter estatísticas',
      message: error.message
    });
  }
});

module.exports = router;