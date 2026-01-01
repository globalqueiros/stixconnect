const express = require('express');
const { execute, transaction } = require('../config/database');
const logger = require('../utils/logger');

const router = express.Router();

// GET /api/consultas/aguardando - Get waiting patients by role
router.get('/aguardando', async (req, res) => {
  try {
    const { role } = req.query;

    let query;
    let params = [];

    if (role === 'nurse') {
      // For nurses: get urgent consultations needing triage and patients ready for nurse attention
      query = `
        SELECT c.*, 
               p.nome as paciente_nome, 
               p.cpf as paciente_cpf,
               DATE_FORMAT(c.data_hora_inicio, '%d/%m/%Y %H:%i') as data_formatada,
               TIMESTAMPDIFF(MINUTE, c.data_hora_inicio, NOW()) as tempo_espera_minutos
        FROM consultas c
        JOIN pacientes p ON c.paciente_id = p.id
        WHERE c.status IN ('aguardando_enfermeira', 'triagem', 'pronto_enfermagem')
        ORDER BY c.tipo = 'urgente' DESC, 
                 CASE 
                   WHEN JSON_EXTRACT(c.dados_triagem, '$.classificacaoUrgencia') = 'vermelho' THEN 1
                   WHEN JSON_EXTRACT(c.dados_triagem, '$.classificacaoUrgencia') = 'laranja' THEN 2
                   WHEN JSON_EXTRACT(c.dados_triagem, '$.classificacaoUrgencia') = 'amarelo' THEN 3
                   WHEN JSON_EXTRACT(c.dados_triagem, '$.classificacaoUrgencia') = 'verde' THEN 4
                   ELSE 5
                 END,
                 c.data_hora_inicio ASC
      `;
    } else if (role === 'doctor') {
      // For doctors: get patients forwarded by nurses
      query = `
        SELECT c.*, 
               p.nome as paciente_nome, 
               p.cpf as paciente_cpf,
               prof.nome as enfermeiro_nome,
               DATE_FORMAT(c.data_hora_inicio, '%d/%m/%Y %H:%i') as data_formatada,
               TIMESTAMPDIFF(MINUTE, c.data_hora_inicio, NOW()) as tempo_espera_minutos
        FROM consultas c
        JOIN pacientes p ON c.paciente_id = p.id
        LEFT JOIN profissionais prof ON c.enfermeiro_id = prof.id
        WHERE c.status IN ('aguardando_medico', 'pronto_medico')
        ORDER BY c.tipo = 'urgente' DESC,
                 CASE 
                   WHEN JSON_EXTRACT(c.dados_triagem, '$.classificacaoUrgencia') = 'vermelho' THEN 1
                   WHEN JSON_EXTRACT(c.dados_triagem, '$.classificacaoUrgencia') = 'laranja' THEN 2
                   WHEN JSON_EXTRACT(c.dados_triagem, '$.classificacaoUrgencia') = 'amarelo' THEN 3
                   WHEN JSON_EXTRACT(c.dados_triagem, '$.classificacaoUrgencia') = 'verde' THEN 4
                   ELSE 5
                 END,
                 c.data_hora_inicio ASC
      `;
    } else {
      // General waiting list
      query = `
        SELECT c.*, 
               p.nome as paciente_nome, 
               p.cpf as paciente_cpf,
               DATE_FORMAT(c.data_hora_inicio, '%d/%m/%Y %H:%i') as data_formatada,
               TIMESTAMPDIFF(MINUTE, c.data_hora_inicio, NOW()) as tempo_espera_minutos
        FROM consultas c
        JOIN pacientes p ON c.paciente_id = p.id
        WHERE c.status IN ('aguardando_enfermeira', 'aguardando_medico')
        ORDER BY c.tipo = 'urgente' DESC, c.data_hora_inicio ASC
      `;
    }

    const patients = await execute(query, params);

    const formattedPatients = patients.map(patient => ({
      id: patient.id,
      pacienteId: patient.paciente_id,
      nome: patient.paciente_nome,
      cpf: patient.paciente_cpf,
      tipo: patient.tipo,
      status: patient.status,
      dataChegada: patient.data_hora_inicio,
      dataFormatada: patient.data_formatada,
      tempoEspera: patient.tempo_espera_minutos,
      enfermeiro: patient.enfermeiro_nome,
      dadosTriagem: patient.dados_triagem ? JSON.parse(patient.dados_triagem) : null
    }));

    res.json({
      success: true,
      data: {
        patients: formattedPatients,
        total: formattedPatients.length,
        urgent: formattedPatients.filter(p => p.tipo === 'urgente').length,
        scheduled: formattedPatients.filter(p => p.tipo === 'agendada').length
      }
    });

  } catch (error) {
    logger.error('Error getting waiting patients:', error);
    res.status(500).json({
      error: 'Erro ao buscar pacientes aguardando',
      message: error.message
    });
  }
});

// GET /api/consultas/encaminhados - Get patients forwarded to doctor
router.get('/encaminhados', async (req, res) => {
  try {
    const { role } = req.query;

    if (role !== 'doctor') {
      return res.status(403).json({
        error: 'Acesso não autorizado',
        code: 'UNAUTHORIZED'
      });
    }

    const query = `
      SELECT c.*, 
             p.nome as paciente_nome, 
             p.cpf as paciente_cpf,
             prof.nome as enfermeiro_nome,
             DATE_FORMAT(c.data_hora_inicio, '%d/%m/%Y %H:%i') as data_formatada,
             DATE_FORMAT(c.data_encaminhamento, '%d/%m/%Y %H:%i') as data_encaminhamento_formatada,
             TIMESTAMPDIFF(MINUTE, c.data_encaminhamento, NOW()) as tempo_desde_encaminhamento
      FROM consultas c
      JOIN pacientes p ON c.paciente_id = p.id
      LEFT JOIN profissionais prof ON c.enfermeiro_id = prof.id
      WHERE c.status = 'aguardando_medico'
      ORDER BY c.tipo = 'urgente' DESC,
               CASE 
                 WHEN JSON_EXTRACT(c.dados_triagem, '$.classificacaoUrgencia') = 'vermelho' THEN 1
                 WHEN JSON_EXTRACT(c.dados_triagem, '$.classificacaoUrgencia') = 'laranja' THEN 2
                 WHEN JSON_EXTRACT(c.dados_triagem, '$.classificacaoUrgencia') = 'amarelo' THEN 3
                 WHEN JSON_EXTRACT(c.dados_triagem, '$.classificacaoUrgencia') = 'verde' THEN 4
                 ELSE 5
               END,
               c.data_encaminhamento ASC
    `;

    const patients = await execute(query);

    const formattedPatients = patients.map(patient => ({
      id: patient.id,
      pacienteId: patient.paciente_id,
      nome: patient.paciente_nome,
      cpf: patient.paciente_cpf,
      tipo: patient.tipo,
      status: patient.status,
      dataEncaminhamento: patient.data_encaminhamento,
      enfermeiro: patient.enfermeiro_nome,
      dadosTriagem: patient.dados_triagem ? JSON.parse(patient.dados_triagem) : null,
      tempoDesdeEncaminhamento: patient.tempo_desde_encaminhamento
    }));

    res.json({
      success: true,
      data: {
        patients: formattedPatients,
        total: formattedPatients.length
      }
    });

  } catch (error) {
    logger.error('Error getting forwarded patients:', error);
    res.status(500).json({
      error: 'Erro ao buscar pacientes encaminhados',
      message: error.message
    });
  }
});

// POST /api/consultas/:id/atender - Start attending a patient
router.post('/:id/atender', async (req, res) => {
  try {
    const { id } = req.params;
    const { role, profissionalId } = req.body;

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

    const newStatus = role === 'nurse' ? 'atendimento_enfermagem' : 'atendimento_medico';
    const updatedFields = ['status = ?', 'data_atendimento = NOW()'];

    if (role === 'nurse') {
      updatedFields.push('enfermeiro_id = ?');
    } else if (role === 'doctor') {
      updatedFields.push('medico_id = ?');
    }

    const updateQuery = `
      UPDATE consultas 
      SET ${updatedFields.join(', ')}, updated_at = NOW()
      WHERE id = ?
    `;

    const params = [newStatus, profissionalId || null, id];
    await execute(updateQuery, params);

    logger.info('Consultation attendance started', {
      consultationId: id,
      role,
      status: newStatus
    });

    res.json({
      success: true,
      message: 'Atendimento iniciado com sucesso',
      data: {
        id,
        status: newStatus
      }
    });

  } catch (error) {
    logger.error('Error starting attendance:', error);
    res.status(500).json({
      error: 'Erro ao iniciar atendimento',
      message: error.message
    });
  }
});

// POST /api/consultas/:id/encaminhar - Forward patient to next professional
router.post('/:id/encaminhar', async (req, res) => {
  try {
    const { id } = req.params;
    const { to, role } = req.body;

    if (!to || !role) {
      return res.status(400).json({
        error: 'Destino (to) e perfil (role) são obrigatórios',
        code: 'MISSING_PARAMS'
      });
    }

    if (to !== 'doctor') {
      return res.status(400).json({
        error: 'Atualmente só é possível encaminhar para médicos',
        code: 'INVALID_DESTINATION'
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

    if (consulta.status !== 'atendimento_enfermagem') {
      return res.status(400).json({
        error: 'Consulta não está em atendimento de enfermagem',
        code: 'INVALID_STATUS'
      });
    }

    // Update consultation status
    await execute(
      `UPDATE consultas 
       SET status = 'aguardando_medico',
           data_encaminhamento = NOW(),
           updated_at = NOW()
       WHERE id = ?`,
      [id]
    );

    logger.info('Patient forwarded to doctor', {
      consultationId: id,
      fromRole: role,
      toRole: 'doctor'
    });

    res.json({
      success: true,
      message: 'Paciente encaminhado para o médico com sucesso'
    });

  } catch (error) {
    logger.error('Error forwarding patient:', error);
    res.status(500).json({
      error: 'Erro ao encaminhar paciente',
      message: error.message
    });
  }
});

// POST /api/consultas/:id/anamnese - Save anamnesis data
router.post('/:id/anamnese', async (req, res) => {
  try {
    const { id } = req.params;
    const anamneseData = req.body;

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

    // Save anamnesis data
    await execute(
      `UPDATE consultas 
       SET dados_anamnese = ?, updated_at = NOW()
       WHERE id = ?`,
      [JSON.stringify(anamneseData), id]
    );

    logger.info('Anamnesis saved', { consultationId: id });

    res.json({
      success: true,
      message: 'Anamnese salva com sucesso'
    });

  } catch (error) {
    logger.error('Error saving anamnesis:', error);
    res.status(500).json({
      error: 'Erro ao salvar anamnese',
      message: error.message
    });
  }
});

// POST /api/consultas/:id/prescricao - Save prescription data
router.post('/:id/prescricao', async (req, res) => {
  try {
    const { id } = req.params;
    const prescriptionData = req.body;

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

    // Save prescription data
    await execute(
      `UPDATE consultas 
       SET dados_prescricao = ?, updated_at = NOW()
       WHERE id = ?`,
      [JSON.stringify(prescriptionData), id]
    );

    logger.info('Prescription saved', { consultationId: id });

    res.json({
      success: true,
      message: 'Prescrição salva com sucesso'
    });

  } catch (error) {
    logger.error('Error saving prescription:', error);
    res.status(500).json({
      error: 'Erro ao salvar prescrição',
      message: error.message
    });
  }
});

// POST /api/consultas/:id/atestado - Save medical certificate data
router.post('/:id/atestado', async (req, res) => {
  try {
    const { id } = req.params;
    const certificateData = req.body;

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

    // Save certificate data
    await execute(
      `UPDATE consultas 
       SET dados_atestado = ?, updated_at = NOW()
       WHERE id = ?`,
      [JSON.stringify(certificateData), id]
    );

    logger.info('Medical certificate saved', { consultationId: id });

    res.json({
      success: true,
      message: 'Atestado salvo com sucesso'
    });

  } catch (error) {
    logger.error('Error saving certificate:', error);
    res.status(500).json({
      error: 'Erro ao salvar atestado',
      message: error.message
    });
  }
});

// POST /api/consultas/:id/finalizar - Finalize consultation
router.post('/:id/finalizar', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

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

    // Update consultation status
    await execute(
      `UPDATE consultas 
       SET status = 'finalizada',
           data_hora_fim = NOW(),
           updated_at = NOW()
       WHERE id = ?`,
      [id]
    );

    logger.info('Consultation finalized', {
      consultationId: id,
      finalRole: role
    });

    res.json({
      success: true,
      message: 'Consulta finalizada com sucesso'
    });

  } catch (error) {
    logger.error('Error finalizing consultation:', error);
    res.status(500).json({
      error: 'Erro ao finalizar consulta',
      message: error.message
    });
  }
});

module.exports = router;