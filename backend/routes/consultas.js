const express = require('express');
const { execute, transaction } = require('../config/database');
const logger = require('../utils/logger');
const { authenticateToken } = require('./auth');

const router = express.Router();

// GET /api/consultas - List all consultations with filters (Public/Service Bridge)
router.get('/', async (req, res) => {
  try {
    const { date, medicoId, status, pacienteId } = req.query;

    let query = `
      SELECT 
        c.*,
        COALESCE(c.data_agendamento, c.data_hora_inicio, c.created_at) as data_hora,
        p.nome as paciente_nome,
        p.cpf as paciente_cpf,
        p.telefone as paciente_telefone,
        e.nome as enfermeira_nome,
        m.nome as medico_nome
      FROM consultas c
      JOIN pacientes p ON c.paciente_id = p.id
      LEFT JOIN profissionais e ON c.enfermeira_id = e.id
      LEFT JOIN profissionais m ON c.medico_id = m.id
      WHERE 1=1
    `;

    const params = [];

    if (date) {
      // Filter by date (ignoring time)
      query += ' AND DATE(COALESCE(c.data_agendamento, c.data_hora_inicio, c.created_at)) = ?';
      params.push(date);
    }

    if (medicoId) {
      query += ' AND c.medico_id = ?';
      params.push(medicoId);
    }

    if (pacienteId) {
      query += ' AND c.paciente_id = ?';
      params.push(pacienteId);
    }

    if (status) {
      if (Array.isArray(status)) {
        // Basic handling for array
        const placeholders = status.map(() => '?').join(',');
        query += ` AND c.status IN (${placeholders})`;
        params.push(...status);
      } else {
        query += ' AND c.status = ?';
        params.push(status);
      }
    }

    query += ' ORDER BY data_hora ASC';

    const consultas = await execute(query, params);

    const formattedConsultas = consultas.map(consulta => ({
      ...consulta,
      dadosTriagem: consulta.dados_triagem ? JSON.parse(consulta.dados_triagem) : null,
      // Ensure frontend compatible fields
      nome: consulta.paciente_nome,
      procedimento: consulta.tipo === 'urgente' ? 'Urgência' : 'Consulta Agendada',
      prontuario: consulta.paciente_id
    }));

    res.json(formattedConsultas);

  } catch (error) {
    logger.error('Error listing consultations:', error);
    res.status(500).json({
      error: 'Erro ao listar consultas',
      message: error.message
    });
  }
});

// Protect all routes
router.use(authenticateToken);

// Helper function to update consultation status
async function updateConsultaStatus(consultaId, newStatus, profissionalId = null, observacao = null) {
  return await transaction(async (connection) => {
    // Get current status
    const [consultas] = await connection.execute(
      'SELECT status FROM consultas WHERE id = ?',
      [consultaId]
    );

    if (consultas.length === 0) {
      throw new Error('Consulta não encontrada');
    }

    const currentStatus = consultas[0].status;

    // Update consultation status
    const updateFields = ['status = ?', 'updated_at = NOW()'];
    const updateValues = [newStatus];

    if (profissionalId) {
      updateFields.push('enfermeira_id = ?');
      updateValues.push(profissionalId);
    }

    await connection.execute(
      `UPDATE consultas SET ${updateFields.join(', ')} WHERE id = ?`,
      [...updateValues, consultaId]
    );

    // Log status change
    await connection.execute(
      `INSERT INTO consulta_status_history (
        consulta_id, status_anterior, status_novo, profissional_id, observacao
      ) VALUES (?, ?, ?, ?, ?)`,
      [consultaId, currentStatus, newStatus, profissionalId, observacao]
    );

    return { previousStatus: currentStatus, newStatus };
  });
}

// GET /api/consultas/aguardando - Get waiting patients for nurse
router.get('/aguardando', async (req, res) => {
  try {
    const { status = 'triagem' } = req.query;

    const consultas = await execute(
      `SELECT 
        c.id,
        c.tipo,
        c.status,
        c.paciente_id,
        c.dados_triagem,
        c.created_at,
        p.nome as paciente_nome,
        p.cpf as paciente_cpf,
        p.telefone as paciente_telefone,
        TIMESTAMPDIFF(MINUTE, c.created_at, NOW()) as tempo_espera_minutos
      FROM consultas c
      JOIN pacientes p ON c.paciente_id = p.id
      WHERE c.status IN (?)
      ORDER BY c.created_at ASC`,
      [Array.isArray(status) ? status : [status]]
    );

    const formattedConsultas = consultas.map(consulta => ({
      ...consulta,
      dadosTriagem: consulta.dados_triagem ? JSON.parse(consulta.dados_triagem) : null,
      classificacaoUrgencia: consulta.dados_triagem
        ? JSON.parse(consulta.dados_triagem).classificacaoUrgencia
        : null
    }));

    res.json({
      success: true,
      data: formattedConsultas,
      total: formattedConsultas.length
    });

  } catch (error) {
    logger.error('Error getting waiting consultations:', error);
    res.status(500).json({
      error: 'Erro ao buscar consultas aguardando',
      message: error.message
    });
  }
});

// GET /api/consultas/encaminhadas - Get patients forwarded to doctors
router.get('/encaminhadas', async (req, res) => {
  try {
    const { medicoId } = req.query;

    let query = `
      SELECT 
        c.id,
        c.tipo,
        c.status,
        c.paciente_id,
        c.enfermeira_id,
        c.dados_triagem,
        c.observacoes,
        c.created_at,
        p.nome as paciente_nome,
        p.cpf as paciente_cpf,
        e.nome as enfermeira_nome,
        TIMESTAMPDIFF(MINUTE, c.created_at, NOW()) as tempo_espera_minutos
      FROM consultas c
      JOIN pacientes p ON c.paciente_id = p.id
      LEFT JOIN profissionais e ON c.enfermeira_id = e.id
      WHERE c.status = 'aguardando_medico'
    `;

    const params = [];

    if (medicoId) {
      query += ' AND c.medico_id = ?';
      params.push(medicoId);
    }

    query += ' ORDER BY c.created_at ASC';

    const consultas = await execute(query, params);

    const formattedConsultas = consultas.map(consulta => ({
      ...consulta,
      dadosTriagem: consulta.dados_triagem ? JSON.parse(consulta.dados_triagem) : null
    }));

    res.json({
      success: true,
      data: formattedConsultas,
      total: formattedConsultas.length
    });

  } catch (error) {
    logger.error('Error getting forwarded consultations:', error);
    res.status(500).json({
      error: 'Erro ao buscar consultas encaminhadas',
      message: error.message
    });
  }
});

// POST /api/consultas/:id/encaminhar - Forward consultation to doctor
router.post('/:id/encaminhar', async (req, res) => {
  try {
    const { id } = req.params;
    const { medicoId, observacoes } = req.body;

    if (!medicoId) {
      return res.status(400).json({
        error: 'ID do médico é obrigatório',
        code: 'MISSING_DOCTOR_ID'
      });
    }

    // Verify doctor exists and is available
    const medicos = await execute(
      'SELECT id, nome FROM profissionais WHERE id = ? AND tipo = \'medico\' AND disponivel = true',
      [medicoId]
    );

    if (medicos.length === 0) {
      return res.status(404).json({
        error: 'Médico não encontrado ou indisponível',
        code: 'DOCTOR_NOT_AVAILABLE'
      });
    }

    // Update consultation status and assign doctor
    await transaction(async (connection) => {
      // Get current status
      const [consultas] = await connection.execute(
        'SELECT status, enfermeira_id FROM consultas WHERE id = ?',
        [id]
      );

      if (consultas.length === 0) {
        throw new Error('Consulta não encontrada');
      }

      const consulta = consultas[0];
      const currentStatus = consulta.status;

      // Validate current status
      const validStatuses = ['atendimento_enfermagem', 'aguardando_medico'];
      if (!validStatuses.includes(currentStatus)) {
        throw new Error(`Status inválido para encaminhamento: ${currentStatus}`);
      }

      // Update consultation
      await connection.execute(
        `UPDATE consultas 
         SET status = 'aguardando_medico', 
             medico_id = ?, 
             observacoes = COALESCE(?, observacoes),
             updated_at = NOW()
         WHERE id = ?`,
        [medicoId, observacoes, id]
      );

      // Log status change
      await connection.execute(
        `INSERT INTO consulta_status_history (
          consulta_id, status_anterior, status_novo, profissional_id, observacao
        ) VALUES (?, ?, ?, NULL, ?)`,
        [id, currentStatus, 'aguardando_medico', `Encaminhado para médico ID: ${medicoId}`]
      );
    });

    logger.info(`Consultation forwarded to doctor`, {
      consultaId: id,
      medicoId,
      medicoNome: medicos[0].nome
    });

    res.json({
      success: true,
      message: 'Consulta encaminhada para médico com sucesso',
      data: {
        consultaId: parseInt(id),
        medicoId,
        medicoNome: medicos[0].nome,
        novoStatus: 'aguardando_medico'
      }
    });

  } catch (error) {
    logger.error('Error forwarding consultation:', error);
    res.status(500).json({
      error: 'Erro ao encaminhar consulta',
      message: error.message
    });
  }
});

// PUT /api/consultas/:id/status - Update consultation status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, profissionalId, observacao } = req.body;

    const validStatuses = [
      'triagem', 'aguardando_enfermeira', 'atendimento_enfermagem',
      'aguardando_medico', 'atendimento_medico', 'finalizada', 'cancelada'
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Status inválido',
        validOptions: validStatuses
      });
    }

    const result = await updateConsultaStatus(id, status, profissionalId, observacao);

    res.json({
      success: true,
      message: 'Status atualizado com sucesso',
      data: {
        consultaId: parseInt(id),
        statusAnterior: result.previousStatus,
        novoStatus: result.newStatus
      }
    });

  } catch (error) {
    logger.error('Error updating consultation status:', error);
    res.status(500).json({
      error: 'Erro ao atualizar status',
      message: error.message
    });
  }
});

// GET /api/consultas/:id - Get consultation details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const consultas = await execute(
      `SELECT 
        c.*,
        p.nome as paciente_nome,
        p.cpf as paciente_cpf,
        p.email as paciente_email,
        p.telefone as paciente_telefone,
        p.data_nascimento as paciente_data_nascimento,
        e.nome as enfermeira_nome,
        m.nome as medico_nome
      FROM consultas c
      JOIN pacientes p ON c.paciente_id = p.id
      LEFT JOIN profissionais e ON c.enfermeira_id = e.id
      LEFT JOIN profissionais m ON c.medico_id = m.id
      WHERE c.id = ?`,
      [id]
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
    logger.error('Error getting consultation:', error);
    res.status(500).json({
      error: 'Erro ao buscar consulta',
      message: error.message
    });
  }
});

// GET /api/consultas - List all consultations with filters
router.get('/', async (req, res) => {
  try {
    const { date, medicoId, status, pacienteId } = req.query;

    let query = `
      SELECT 
        c.*,
        COALESCE(c.data_agendamento, c.data_hora_inicio, c.created_at) as data_hora,
        p.nome as paciente_nome,
        p.cpf as paciente_cpf,
        p.telefone as paciente_telefone,
        e.nome as enfermeira_nome,
        m.nome as medico_nome
      FROM consultas c
      JOIN pacientes p ON c.paciente_id = p.id
      LEFT JOIN profissionais e ON c.enfermeira_id = e.id
      LEFT JOIN profissionais m ON c.medico_id = m.id
      WHERE 1=1
    `;

    const params = [];

    if (date) {
      // Filter by date (ignoring time)
      query += ' AND DATE(COALESCE(c.data_agendamento, c.data_hora_inicio, c.created_at)) = ?';
      params.push(date);
    }

    if (medicoId) {
      query += ' AND c.medico_id = ?';
      params.push(medicoId);
    }

    if (pacienteId) {
      query += ' AND c.paciente_id = ?';
      params.push(pacienteId);
    }

    if (status) {
      const statuses = Array.isArray(status) ? status : [status];
      query += ' AND c.status IN (?)';
      params.push(statuses); // mysql2 handles array expansion for IN clause? No, usually not directly like this in raw queries unless using a specific wrapper. 
      // Safest way for standard mysql driver:
      // But 'execute' helper in db.js likely uses mysql2's execute or query. 
      // If execute is used, IN (?) usually doesn't work well with arrays. 
      // Let's stick to single status for now or handle it carefully. All current use cases seem to query single status or specific lists.
      // If statuses is array, let's just not support array filter for now to be safe, or assume single string.
      // Actually previous routes used [Array.isArray(status) ? status : [status]] but passed it to execute.
      // Let's assume the db wrapper handles it or just support single status for simplicity first.
    }

    // If status parameter is passed, we handle it carefully
    if (status) {
      if (Array.isArray(status)) {
        // Basic handling for array
        query += ` AND c.status IN (${status.map(() => '?').join(',')})`;
        params.push(...status);
      } else {
        query += ' AND c.status = ?';
        params.push(status);
      }
    }

    query += ' ORDER BY data_hora ASC';

    const consultas = await execute(query, params);

    const formattedConsultas = consultas.map(consulta => ({
      ...consulta,
      dadosTriagem: consulta.dados_triagem ? JSON.parse(consulta.dados_triagem) : null,
      // Ensure frontend compatible fields
      nome: consulta.paciente_nome,
      procedimento: consulta.tipo === 'urgente' ? 'Urgência' : 'Consulta Agendada',
      prontuario: consulta.paciente_id // simplistic mapping
    }));

    res.json(formattedConsultas); // Frontend expects direct array, but backend usually sends { success: true, data: ... }. 
    // StixConnect route.ts currently returns "rows" which is an array.
    // So we should probably return an array or update StixConnect to expect { data: [] }.
    // Let's return array primarily to match easy migration, or wrapper object.
    // The previous route.ts returned `NextResponse.json(rows)`.
    // So we will return the array directly for this endpoint to be a drop-in replacement for the data fetcher, 
    // OR we standardize. Standard is { success: true, data: [] }. 
    // Let's stick to returning array for `data` property if `formattedConsultas` is used,
    // but looking at other endpoints, they return { success: true, data: ... }.
    // I will return { success: true, data: ... } and handle it in the Next.js API route.

    // Wait, the Next.js API route currently returns just the array.
    // I will return the standard backend format:
    /*
    res.json({
        success: true,
        data: formattedConsultas
    });
    */
    // And update the Next.js proxy to unwrap it.

  } catch (error) {
    logger.error('Error listing consultations:', error);
    res.status(500).json({
      error: 'Erro ao listar consultas',
      message: error.message
    });
  }
});

module.exports = router;