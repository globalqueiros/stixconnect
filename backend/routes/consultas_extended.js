const express = require('express');
const { execute, transaction } = require('../config/database');
const logger = require('../utils/logger');

const router = express.Router();

// POST /api/consultas/urgente/iniciar - Start urgent consultation process
router.post('/urgente/iniciar', async (req, res) => {
  try {
    const { consultationId } = req.body;

    if (!consultationId) {
      return res.status(400).json({
        error: 'ID da consulta é obrigatório',
        code: 'MISSING_CONSULTATION_ID'
      });
    }

    // Check if consultation exists and is urgent
    const [consulta] = await execute(
      'SELECT * FROM consultas WHERE id = ? AND tipo = ?',
      [consultationId, 'urgente']
    );

    if (!consulta) {
      return res.status(404).json({
        error: 'Consulta urgente não encontrada',
        code: 'CONSULTA_NOT_FOUND'
      });
    }

    // Update status to indicate triage process is starting
    await execute(
      'UPDATE consultas SET status = ?, updated_at = NOW() WHERE id = ?',
      ['aguardando_enfermeira', consultationId]
    );

    logger.info('Urgent consultation triage started', { consultationId });

    res.json({
      success: true,
      message: 'Processo de triagem iniciado',
      data: {
        consultationId,
        status: 'aguardando_enfermeira',
        nextStep: 'triagem'
      }
    });

  } catch (error) {
    logger.error('Error starting urgent consultation:', error);
    res.status(500).json({
      error: 'Erro ao iniciar consulta urgente',
      message: error.message
    });
  }
});

// POST /api/consultas/:id/iniciar-consulta - Start medical consultation
router.post('/:id/iniciar-consulta', async (req, res) => {
  try {
    const { id } = req.params;
    const { role, profissionalId } = req.body;

    if (!role) {
      return res.status(400).json({
        error: 'Perfil (role) é obrigatório',
        code: 'MISSING_ROLE'
      });
    }

    if (role !== 'doctor') {
      return res.status(403).json({
        error: 'Apenas médicos podem iniciar consultas médicas',
        code: 'UNAUTHORIZED'
      });
    }

    // Check if consultation exists
    const [consulta] = await execute(
      'SELECT * FROM consultas WHERE id = ?',
      [id]
    );

    if (!consulta) {
      return res.status(404).json({
        error: 'Consulta não encontrada',
        code: 'CONSULTA_NOT_FOUND'
      });
    }

    if (consulta.status !== 'aguardando_medico') {
      return res.status(400).json({
        error: 'Consulta não está aguardando atendimento médico',
        code: 'INVALID_STATUS'
      });
    }

    // Update consultation status
    await execute(
      `UPDATE consultas 
       SET status = 'atendimento_medico',
           medico_id = ?,
           data_atendimento = NOW(),
           updated_at = NOW()
       WHERE id = ?`,
      [profissionalId || null, id]
    );

    logger.info('Medical consultation started', {
      consultationId: id,
      medicoId: profissionalId
    });

    res.json({
      success: true,
      message: 'Consulta médica iniciada com sucesso',
      data: {
        consultationId: id,
        status: 'atendimento_medico'
      }
    });

  } catch (error) {
    logger.error('Error starting medical consultation:', error);
    res.status(500).json({
      error: 'Erro ao iniciar consulta médica',
      message: error.message
    });
  }
});

// POST /api/consultas/:id/encerrar - End consultation from any role
router.post('/:id/encerrar', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({
        error: 'Perfil (role) é obrigatório',
        code: 'MISSING_ROLE'
      });
    }

    // Check if consultation exists
    const [consulta] = await execute(
      'SELECT * FROM consultas WHERE id = ?',
      [id]
    );

    if (!consulta) {
      return res.status(404).json({
        error: 'Consulta não encontrada',
        code: 'CONSULTA_NOT_FOUND'
      });
    }

    let newStatus;
    if (role === 'nurse' && consulta.status === 'atendimento_enfermagem') {
      newStatus = 'aguardando_medico';
    } else if (role === 'doctor' && consulta.status === 'atendimento_medico') {
      newStatus = 'finalizada';
    } else {
      return res.status(400).json({
        error: 'Status inválido para encerramento pelo perfil informado',
        code: 'INVALID_STATUS_FOR_ROLE'
      });
    }

    // Update consultation status
    await execute(
      `UPDATE consultas 
       SET status = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [newStatus, id]
    );

    logger.info('Consultation ended by role', {
      consultationId: id,
      role,
      newStatus
    });

    res.json({
      success: true,
      message: 'Consulta encerrada com sucesso',
      data: {
        consultationId: id,
        status: newStatus
      }
    });

  } catch (error) {
    logger.error('Error ending consultation:', error);
    res.status(500).json({
      error: 'Erro ao encerrar consulta',
      message: error.message
    });
  }
});

// GET /api/consultas/:id - Get consultation details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT c.*, 
             p.nome as paciente_nome, 
             p.cpf as paciente_cpf,
             p.email as paciente_email,
             prof_enf.nome as enfermeiro_nome,
             prof_med.nome as medico_nome,
             DATE_FORMAT(c.data_hora_inicio, '%d/%m/%Y %H:%i') as data_inicio_formatada,
             DATE_FORMAT(c.data_hora_fim, '%d/%m/%Y %H:%i') as data_fim_formatada
      FROM consultas c
      JOIN pacientes p ON c.paciente_id = p.id
      LEFT JOIN profissionais prof_enf ON c.enfermeiro_id = prof_enf.id
      LEFT JOIN profissionais prof_med ON c.medico_id = prof_med.id
      WHERE c.id = ?
    `;

    const [consulta] = await execute(query, [id]);

    if (!consulta) {
      return res.status(404).json({
        error: 'Consulta não encontrada',
        code: 'CONSULTA_NOT_FOUND'
      });
    }

    // Format response
    const consultaFormatada = {
      id: consulta.id,
      tipo: consulta.tipo,
      status: consulta.status,
      paciente: {
        id: consulta.paciente_id,
        nome: consulta.paciente_nome,
        cpf: consulta.paciente_cpf,
        email: consulta.paciente_email
      },
      enfermeiro: consulta.enfermeiro_nome,
      medico: consulta.medico_nome,
      dataHoraInicio: consulta.data_hora_inicio,
      dataHoraFim: consulta.data_hora_fim,
      dataInicioFormatada: consulta.data_inicio_formatada,
      dataFimFormatada: consulta.data_fim_formatada,
      dadosTriagem: consulta.dados_triagem ? JSON.parse(consulta.dados_triagem) : null,
      dadosAnamnese: consulta.dados_anamnese ? JSON.parse(consulta.dados_anamnese) : null,
      dadosPrescricao: consulta.dados_prescricao ? JSON.parse(consulta.dados_prescricao) : null,
      dadosAtestado: consulta.dados_atestado ? JSON.parse(consulta.dados_atestado) : null,
      zoomMeetingId: consulta.zoom_meeting_id,
      zoomLink: consulta.zoom_link
    };

    res.json({
      success: true,
      data: consultaFormatada
    });

  } catch (error) {
    logger.error('Error getting consultation:', error);
    res.status(500).json({
      error: 'Erro ao buscar consulta',
      message: error.message
    });
  }
});

module.exports = router;