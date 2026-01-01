const express = require('express');
const { execute, transaction } = require('../config/database');
const logger = require('../utils/logger');
const { authenticateToken } = require('./auth');
const zoomService = require('../services/zoomService');

const router = express.Router();

// Protect all routes
router.use(authenticateToken);

// POST /api/zoom/create-meeting - Create Zoom meeting for consultation
router.post('/create-meeting', async (req, res) => {
  try {
    const { consultaId } = req.body;

    if (!consultaId) {
      return res.status(400).json({
        error: 'ID da consulta é obrigatório',
        code: 'MISSING_CONSULTATION_ID'
      });
    }

    // Check if consultation exists and is ready for meeting
    const consultas = await execute(
      `SELECT c.*, p.nome as paciente_nome
       FROM consultas c
       JOIN pacientes p ON c.paciente_id = p.id
       WHERE c.id = ? AND c.status IN ('aguardando_enfermeira', 'atendimento_enfermagem', 'aguardando_medico', 'atendimento_medico')`,
      [consultaId]
    );

    if (consultas.length === 0) {
      return res.status(404).json({
        error: 'Consulta não encontrada ou não está pronta para reunião',
        code: 'CONSULTATION_NOT_READY'
      });
    }

    const consulta = consultas[0];

    // Check if meeting already exists
    const existingMeetings = await execute(
      'SELECT * FROM zoom_meetings WHERE consulta_id = ?',
      [consultaId]
    );

    if (existingMeetings.length > 0) {
      const meeting = existingMeetings[0];
      return res.json({
        success: true,
        message: 'Reunião já existe',
        data: {
          meetingId: meeting.meeting_id,
          joinUrl: meeting.join_url,
          startUrl: meeting.start_url,
          password: meeting.password
        }
      });
    }

    // Create new Zoom meeting via service
    const zoomMeeting = await zoomService.createMeeting(
      consultaId,
      `Consulta ${consulta.tipo === 'urgente' ? 'Urgente' : 'Agendada'} - ${consulta.paciente_nome}`,
      consulta.paciente_nome
    );

    // Save meeting to database
    await transaction(async (connection) => {
      // Insert zoom meeting record
      await connection.execute(
        `INSERT INTO zoom_meetings (
          consulta_id, meeting_id, topic, start_url, join_url, password, settings
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          consultaId,
          zoomMeeting.id.toString(),
          zoomMeeting.topic,
          zoomMeeting.start_url,
          zoomMeeting.join_url,
          zoomMeeting.password || '',
          JSON.stringify(zoomMeeting.settings)
        ]
      );

      // Update consultation with meeting info
      await connection.execute(
        `UPDATE consultas 
         SET zoom_meeting_id = ?, zoom_link = ?, updated_at = NOW()
         WHERE id = ?`,
        [
          zoomMeeting.id.toString(),
          zoomMeeting.join_url,
          consultaId
        ]
      );
    });

    logger.info(`Zoom meeting created successfully`, {
      consultaId,
      meetingId: zoomMeeting.id,
      pacienteNome: consulta.paciente_nome
    });

    res.status(201).json({
      success: true,
      message: 'Reunião Zoom criada com sucesso',
      data: {
        meetingId: zoomMeeting.id.toString(),
        joinUrl: zoomMeeting.join_url,
        startUrl: zoomMeeting.start_url,
        password: zoomMeeting.password,
        pacienteNome: consulta.paciente_nome
      }
    });

  } catch (error) {
    logger.error('Error creating meeting:', error);
    res.status(500).json({
      error: 'Erro ao criar reunião Zoom',
      message: error.message
    });
  }
});

// GET /api/zoom/meeting/:consultaId - Get meeting details
router.get('/meeting/:consultaId', async (req, res) => {
  try {
    const { consultaId } = req.params;

    const meetings = await execute(
      `SELECT zm.*, c.paciente_id, p.nome as paciente_nome, c.status
       FROM zoom_meetings zm
       JOIN consultas c ON zm.consulta_id = c.id
       JOIN pacientes p ON c.paciente_id = p.id
       WHERE zm.consulta_id = ?`,
      [consultaId]
    );

    if (meetings.length === 0) {
      return res.status(404).json({
        error: 'Reunião não encontrada',
        code: 'MEETING_NOT_FOUND'
      });
    }

    const meeting = meetings[0];

    res.json({
      success: true,
      data: {
        ...meeting,
        settings: meeting.settings ? JSON.parse(meeting.settings) : null
      }
    });

  } catch (error) {
    logger.error('Error getting meeting:', error);
    res.status(500).json({
      error: 'Erro ao buscar reunião',
      message: error.message
    });
  }
});

// DELETE /api/zoom/meeting/:consultaId - End/delete meeting
router.delete('/meeting/:consultaId', async (req, res) => {
  try {
    const { consultaId } = req.params;

    // Check if meeting exists
    const meetings = await execute(
      'SELECT meeting_id FROM zoom_meetings WHERE consulta_id = ?',
      [consultaId]
    );

    if (meetings.length === 0) {
      return res.status(404).json({
        error: 'Reunião não encontrada',
        code: 'MEETING_NOT_FOUND'
      });
    }

    const meeting = meetings[0];

    // Delete meeting from Zoom via service
    await zoomService.deleteMeeting(meeting.meeting_id);

    // Remove from database
    await execute(
      'DELETE FROM zoom_meetings WHERE consulta_id = ?',
      [consultaId]
    );

    // Update consultation
    await execute(
      'UPDATE consultas SET zoom_meeting_id = NULL, zoom_link = NULL, updated_at = NOW() WHERE id = ?',
      [consultaId]
    );

    logger.info(`Zoom meeting deleted`, { consultaId, meetingId: meeting.meeting_id });

    res.json({
      success: true,
      message: 'Reunião removida com sucesso'
    });

  } catch (error) {
    logger.error('Error deleting meeting:', error);
    res.status(500).json({
      error: 'Erro ao remover reunião',
      message: error.message
    });
  }
});

// NOTE: Webhook handling removed from here as it should be a public endpoint or protected differently
// If needed, move to a separate public route file or exempt from auth middleware

module.exports = router;