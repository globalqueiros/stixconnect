const express = require('express');
const jwt = require('jsonwebtoken');
const { execute } = require('../config/database');
const logger = require('../utils/logger');

const router = express.Router();

// Authentication middleware (inline)
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Token de autenticação não fornecido',
      code: 'MISSING_TOKEN'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, user) => {
    if (err) {
      return res.status(403).json({
        error: 'Token inválido ou expirado',
        code: 'INVALID_TOKEN'
      });
    }
    req.user = user;
    next();
  });
}

// Apply authentication middleware to all admin routes
router.use(authenticateToken);

// GET /api/admin/dashboard - Get dashboard metrics
router.get('/dashboard', async (req, res) => {
  try {
    // Get total consultations by status
    const statusCounts = await execute(`
      SELECT 
        status,
        COUNT(*) as total,
        SUM(CASE WHEN tipo = 'urgente' THEN 1 ELSE 0 END) as urgentes,
        SUM(CASE WHEN tipo = 'agendada' THEN 1 ELSE 0 END) as agendadas
      FROM consultas
      WHERE DATE(created_at) = CURDATE()
      GROUP BY status
    `);

    // Get total consultations by period
    const periodCounts = await execute(`
      SELECT 
        CASE 
          WHEN DATE(created_at) = CURDATE() THEN 'hoje'
          WHEN DATE(created_at) = CURDATE() - INTERVAL 1 DAY THEN 'ontem'
          WHEN YEARWEEK(created_at) = YEARWEEK(CURDATE()) THEN 'esta_semana'
          WHEN MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE()) THEN 'este_mes'
          ELSE 'outros'
        END as periodo,
        COUNT(*) as total
      FROM consultas
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY 
        CASE 
          WHEN DATE(created_at) = CURDATE() THEN 'hoje'
          WHEN DATE(created_at) = CURDATE() - INTERVAL 1 DAY THEN 'ontem'
          WHEN YEARWEEK(created_at) = YEARWEEK(CURDATE()) THEN 'esta_semana'
          WHEN MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE()) THEN 'este_mes'
          ELSE 'outros'
        END
    `);

    // Get average consultation duration
    const durationStats = await execute(`
      SELECT 
        AVG(duracao_minutos) as media_duracao,
        MIN(duracao_minutos) as menor_duracao,
        MAX(duracao_minutos) as maior_duracao,
        COUNT(*) as total_com_duracao
      FROM consultas
      WHERE duracao_minutos IS NOT NULL
        AND data_hora_fim >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
    `);

    // Get professional performance
    const professionalStats = await execute(`
      SELECT 
        p.id,
        p.nome,
        p.tipo,
        COUNT(DISTINCT CASE WHEN c.status = 'finalizada' THEN c.id END) as consultas_finalizadas,
        AVG(CASE WHEN c.status = 'finalizada' THEN c.duracao_minutos END) as media_duracao,
        COUNT(DISTINCT c.id) as total_consultas
      FROM profissionais p
      LEFT JOIN consultas c ON (
        (p.tipo = 'enfermeira' AND c.enfermeira_id = p.id) OR
        (p.tipo = 'medico' AND c.medico_id = p.id)
      )
      WHERE c.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY p.id, p.nome, p.tipo
      ORDER BY consultas_finalizadas DESC
    `);

    // Get Zoom meetings statistics
    const zoomStats = await execute(`
      SELECT 
        COUNT(*) as total_reunioes,
        COUNT(DISTINCT consulta_id) as consultas_com_reuniao,
        COUNT(CASE WHEN zm.created_at >= CURDATE() THEN 1 END) as reunioes_hoje
      FROM zoom_meetings zm
      JOIN consultas c ON zm.consulta_id = c.id
      WHERE zm.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
    `);

    // Get waiting times
    const waitingTimes = await execute(`
      SELECT 
        AVG(TIMESTAMPDIFF(MINUTE, created_at, data_hora_inicio)) as media_espera_inicio,
        AVG(TIMESTAMPDIFF(MINUTE, created_at, data_hora_fim)) as media_espera_total,
        MIN(TIMESTAMPDIFF(MINUTE, created_at, data_hora_inicio)) as menor_espera,
        MAX(TIMESTAMPDIFF(MINUTE, created_at, data_hora_inicio)) as maior_espera
      FROM consultas
      WHERE status = 'finalizada'
        AND data_hora_inicio IS NOT NULL
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
    `);

    const dashboard = {
      consultasPorStatus: statusCounts.reduce((acc, item) => {
        acc[item.status] = {
          total: item.total,
          urgentes: item.urgentes,
          agendadas: item.agendadas
        };
        return acc;
      }, {}),
      consultasPorPeriodo: periodCounts.reduce((acc, item) => {
        acc[item.periodo] = item.total;
        return acc;
      }, {}),
      duracaoMedia: {
        media: Math.round(durationStats[0]?.media_duracao || 0),
        menor: durationStats[0]?.menor_duracao || 0,
        maior: durationStats[0]?.maior_duracao || 0
      },
      profissionais: professionalStats,
      reunioesZoom: {
        total: zoomStats[0]?.total_reunioes || 0,
        consultasComReuniao: zoomStats[0]?.consultas_com_reuniao || 0,
        hoje: zoomStats[0]?.reunioes_hoje || 0
      },
      temposEspera: {
        mediaInicio: Math.round(waitingTimes[0]?.media_espera_inicio || 0),
        mediaTotal: Math.round(waitingTimes[0]?.media_espera_total || 0),
        menor: waitingTimes[0]?.menor_espera || 0,
        maior: waitingTimes[0]?.maior_espera || 0
      }
    };

    res.json({
      success: true,
      data: dashboard
    });

  } catch (error) {
    logger.error('Error getting dashboard data:', error);
    res.status(500).json({
      error: 'Erro ao buscar dados do dashboard',
      message: error.message
    });
  }
});

// GET /api/admin/consultas - Get all consultations with pagination
router.get('/consultas', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      tipo,
      dataInicio,
      dataFim,
      pacienteId,
      profissionalId
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (status) {
      whereClause += ' AND c.status IN (?)';
      params.push(Array.isArray(status) ? status : [status]);
    }

    if (tipo) {
      whereClause += ' AND c.tipo = ?';
      params.push(tipo);
    }

    if (dataInicio) {
      whereClause += ' AND DATE(c.created_at) >= ?';
      params.push(dataInicio);
    }

    if (dataFim) {
      whereClause += ' AND DATE(c.created_at) <= ?';
      params.push(dataFim);
    }

    if (pacienteId) {
      whereClause += ' AND c.paciente_id = ?';
      params.push(pacienteId);
    }

    if (profissionalId) {
      whereClause += ' AND (c.enfermeira_id = ? OR c.medico_id = ?)';
      params.push(profissionalId, profissionalId);
    }

    // Get total count
    const countResult = await execute(`
      SELECT COUNT(*) as total
      FROM consultas c
      ${whereClause}
    `, params);

    // Get consultations
    const consultas = await execute(`
      SELECT 
        c.id,
        c.tipo,
        c.status,
        c.paciente_id,
        c.enfermeira_id,
        c.medico_id,
        c.zoom_meeting_id,
        c.zoom_link,
        c.data_hora_inicio,
        c.data_hora_fim,
        c.duracao_minutos,
        c.created_at,
        c.updated_at,
        p.nome as paciente_nome,
        p.cpf as paciente_cpf,
        en.nome as enfermeira_nome,
        m.nome as medico_nome,
        TIMESTAMPDIFF(MINUTE, c.created_at, COALESCE(c.data_hora_inicio, NOW())) as tempo_espera_minutos
      FROM consultas c
      JOIN pacientes p ON c.paciente_id = p.id
      LEFT JOIN profissionais en ON c.enfermeira_id = en.id
      LEFT JOIN profissionais m ON c.medico_id = m.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const totalPages = Math.ceil(countResult[0].total / parseInt(limit));

    res.json({
      success: true,
      data: {
        consultas: consultas.map(consulta => ({
          ...consulta,
          dadosTriagem: consulta.dados_triagem ? JSON.parse(consulta.dados_triagem) : null
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          totalPages
        }
      }
    });

  } catch (error) {
    logger.error('Error getting consultations:', error);
    res.status(500).json({
      error: 'Erro ao buscar consultas',
      message: error.message
    });
  }
});

// GET /api/admin/consultas/:id/history - Get consultation status history
router.get('/consultas/:id/history', async (req, res) => {
  try {
    const { id } = req.params;

    const history = await execute(`
      SELECT 
        csh.*,
        p.nome as profissional_nome
      FROM consulta_status_history csh
      LEFT JOIN profissionais p ON csh.profissional_id = p.id
      WHERE csh.consulta_id = ?
      ORDER BY csh.created_at ASC
    `, [id]);

    res.json({
      success: true,
      data: history
    });

  } catch (error) {
    logger.error('Error getting consultation history:', error);
    res.status(500).json({
      error: 'Erro ao buscar histórico da consulta',
      message: error.message
    });
  }
});

// GET /api/admin/profissionais - Get all professionals
router.get('/profissionais', async (req, res) => {
  try {
    const { tipo, disponivel } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (tipo) {
      whereClause += ' AND tipo = ?';
      params.push(tipo);
    }

    if (disponivel !== undefined) {
      whereClause += ' AND disponivel = ?';
      params.push(disponivel === 'true');
    }

    const profissionais = await execute(`
      SELECT 
        id,
        nome,
        tipo,
        crm_coren,
        email,
        disponivel,
        created_at,
        updated_at
      FROM profissionais
      ${whereClause}
      ORDER BY nome ASC
    `, params);

    res.json({
      success: true,
      data: profissionais
    });

  } catch (error) {
    logger.error('Error getting professionals:', error);
    res.status(500).json({
      error: 'Erro ao buscar profissionais',
      message: error.message
    });
  }
});

// PUT /api/admin/profissionais/:id/disponibilidade - Update professional availability
router.put('/profissionais/:id/disponibilidade', async (req, res) => {
  try {
    const { id } = req.params;
    const { disponivel } = req.body;

    if (typeof disponivel !== 'boolean') {
      return res.status(400).json({
        error: 'Disponibilidade deve ser true ou false',
        code: 'INVALID_AVAILABILITY'
      });
    }

    await execute(
      'UPDATE profissionais SET disponivel = ?, updated_at = NOW() WHERE id = ?',
      [disponivel, id]
    );

    logger.info(`Professional availability updated`, {
      profissionalId: id,
      disponivel,
      updatedBy: req.user.id
    });

    res.json({
      success: true,
      message: 'Disponibilidade atualizada com sucesso'
    });

  } catch (error) {
    logger.error('Error updating professional availability:', error);
    res.status(500).json({
      error: 'Erro ao atualizar disponibilidade',
      message: error.message
    });
  }
});

module.exports = router;