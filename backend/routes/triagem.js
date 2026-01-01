const express = require('express');
const { triagemSchema } = require('../utils/validation');
const { execute, transaction } = require('../config/database');
const logger = require('../utils/logger');

const router = express.Router();

// POST /api/triagem - Create new triage
router.post('/', async (req, res) => {
  try {
    // Validate input
    const validatedData = triagemSchema.parse(req.body);

    // Check if patient exists
    const [paciente] = await execute(
      'SELECT id, nome FROM pacientes WHERE id = ?',
      [validatedData.pacienteId]
    );

    if (!paciente) {
      return res.status(404).json({
        error: 'Paciente não encontrado',
        code: 'PATIENT_NOT_FOUND'
      });
    }

    // Create consultation with triage data
    const result = await transaction(async (connection) => {
      const [consultaResult] = await connection.execute(
        `INSERT INTO consultas (
          tipo, paciente_id, status, dados_triagem, data_hora_inicio
        ) VALUES (?, ?, ?, ?, NOW())`,
        ['urgente', validatedData.pacienteId, 'triagem', JSON.stringify(validatedData)]
      );

      // Log status change
      await connection.execute(
        `INSERT INTO consulta_status_history (
          consulta_id, status_anterior, status_novo, observacao
        ) VALUES (?, NULL, ?, ?)`,
        [consultaResult.insertId, 'triagem', 'Triagem inicial registrada']
      );

      return consultaResult.insertId;
    });

    logger.info(`Triage created successfully`, {
      consultaId: result,
      pacienteId: validatedData.pacienteId,
      classificacaoUrgencia: validatedData.classificacaoUrgencia
    });

    res.status(201).json({
      success: true,
      data: {
        consultaId: result,
        status: 'triagem',
        mensagem: 'Triagem registrada com sucesso',
        proximoPasso: 'Aguardando atendimento da enfermeira'
      }
    });

  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors
      });
    }

    logger.error('Error creating triage:', error);
    res.status(500).json({
      error: 'Erro ao registrar triagem',
      message: error.message
    });
  }
});

// GET /api/triagem/:consultaId - Get triage data
router.get('/:consultaId', async (req, res) => {
  try {
    const { consultaId } = req.params;

    const consultas = await execute(
      `SELECT c.*, p.nome as paciente_nome, p.cpf as paciente_cpf
       FROM consultas c
       JOIN pacientes p ON c.paciente_id = p.id
       WHERE c.id = ? AND c.tipo = 'urgente'`,
      [consultaId]
    );

    if (consultas.length === 0) {
      return res.status(404).json({
        error: 'Consulta não encontrada',
        code: 'CONSULTATION_NOT_FOUND'
      });
    }

    const consulta = consultas[0];

    res.json({
      success: true,
      data: {
        ...consulta,
        dadosTriagem: consulta.dados_triagem ? JSON.parse(consulta.dados_triagem) : null
      }
    });

  } catch (error) {
    logger.error('Error getting triage:', error);
    res.status(500).json({
      error: 'Erro ao buscar triagem',
      message: error.message
    });
  }
});

// PUT /api/triagem/:consultaId - Update triage data
router.put('/:consultaId', async (req, res) => {
  try {
    const { consultaId } = req.params;

    // Validate input
    const validatedData = triagemSchema.parse(req.body);

    // Check if consultation exists and is in triage status
    const consultas = await execute(
      'SELECT id, status FROM consultas WHERE id = ?',
      [consultaId]
    );

    if (consultas.length === 0) {
      return res.status(404).json({
        error: 'Consulta não encontrada',
        code: 'CONSULTATION_NOT_FOUND'
      });
    }

    const consulta = consultas[0];
    if (consulta.status !== 'triagem') {
      return res.status(400).json({
        error: 'Consulta não está mais em status de triagem',
        code: 'INVALID_STATUS'
      });
    }

    // Update triage data
    await execute(
      'UPDATE consultas SET dados_triagem = ?, updated_at = NOW() WHERE id = ?',
      [JSON.stringify(validatedData), consultaId]
    );

    logger.info(`Triage updated successfully`, {
      consultaId,
      classificacaoUrgencia: validatedData.classificacaoUrgencia
    });

    res.json({
      success: true,
      message: 'Triagem atualizada com sucesso'
    });

  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors
      });
    }

    logger.error('Error updating triage:', error);
    res.status(500).json({
      error: 'Erro ao atualizar triagem',
      message: error.message
    });
  }
});

module.exports = router;