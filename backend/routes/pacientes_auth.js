const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { execute } = require('../config/database');
const logger = require('../utils/logger');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// Middleware to verify patient JWT token
function authenticatePatientToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Token de autenticação não fornecido',
      code: 'MISSING_TOKEN'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, patient) => {
    if (err) {
      return res.status(403).json({
        error: 'Token inválido ou expirado',
        code: 'INVALID_TOKEN'
      });
    }

    req.patient = patient;
    next();
  });
}

// POST /api/pacientes/auth/login - Patient login
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({
        error: 'Email e senha são obrigatórios',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Find patient by email
    const pacientes = await execute(
      'SELECT * FROM pacientes WHERE email = ?',
      [email]
    );

    if (pacientes.length === 0) {
      return res.status(401).json({
        error: 'Credenciais inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const paciente = pacientes[0];

    // Check if patient has password
    if (!paciente.senha_hash) {
      return res.status(401).json({
        error: 'Paciente não possui senha cadastrada',
        code: 'NO_PASSWORD'
      });
    }

    // Verify password
    const senhaCorreta = await bcrypt.compare(senha, paciente.senha_hash);
    if (!senhaCorreta) {
      return res.status(401).json({
        error: 'Credenciais inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: paciente.id,
        nome: paciente.nome,
        email: paciente.email,
        tipo: 'paciente'
      },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    logger.info(`Patient logged in`, {
      pacienteId: paciente.id,
      nome: paciente.nome,
      email: paciente.email
    });

    res.json({
      success: true,
      token,
      user: {
        id: paciente.id,
        nome: paciente.nome,
        email: paciente.email,
        cpf: paciente.cpf,
        telefone: paciente.telefone,
        data_nascimento: paciente.data_nascimento
      }
    });

  } catch (error) {
    logger.error('Patient login error:', error);
    res.status(500).json({
      error: 'Erro interno no servidor',
      message: error.message
    });
  }
});

// POST /api/pacientes/auth/register - Register new patient
router.post('/register', async (req, res) => {
  try {
    const { nome, cpf, email, senha, telefone, data_nascimento } = req.body;

    // Basic validation
    if (!nome || !cpf || !email || !senha) {
      return res.status(400).json({
        error: 'Nome, CPF, email e senha são obrigatórios',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Check if CPF already exists
    const existingCPF = await execute(
      'SELECT id FROM pacientes WHERE cpf = ?',
      [cpf]
    );

    if (existingCPF.length > 0) {
      return res.status(409).json({
        error: 'CPF já cadastrado',
        code: 'CPF_EXISTS'
      });
    }

    // Check if email already exists
    const existingEmail = await execute(
      'SELECT id FROM pacientes WHERE email = ?',
      [email]
    );

    if (existingEmail.length > 0) {
      return res.status(409).json({
        error: 'Email já cadastrado',
        code: 'EMAIL_EXISTS'
      });
    }

    // Hash password
    const senhaHash = await bcrypt.hash(senha, 10);

    // Insert new patient
    const result = await execute(
      `INSERT INTO pacientes (
        nome, cpf, email, senha_hash, telefone, data_nascimento
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [nome, cpf, email, senhaHash, telefone || null, data_nascimento || null]
    );

    logger.info(`New patient registered`, {
      pacienteId: result.insertId,
      nome,
      email
    });

    res.status(201).json({
      success: true,
      message: 'Paciente cadastrado com sucesso',
      data: {
        id: result.insertId,
        nome,
        email
      }
    });

  } catch (error) {
    logger.error('Patient registration error:', error);
    res.status(500).json({
      error: 'Erro ao cadastrar paciente',
      message: error.message
    });
  }
});

// GET /api/pacientes/auth/me - Get current patient info
router.get('/me', authenticatePatientToken, async (req, res) => {
  try {
    const pacientes = await execute(
      'SELECT id, nome, email, cpf, telefone, data_nascimento, created_at FROM pacientes WHERE id = ?',
      [req.patient.id]
    );

    if (pacientes.length === 0) {
      return res.status(404).json({
        error: 'Paciente não encontrado',
        code: 'PATIENT_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: pacientes[0]
    });

  } catch (error) {
    logger.error('Get patient info error:', error);
    res.status(500).json({
      error: 'Erro ao buscar informações do paciente',
      message: error.message
    });
  }
});

// PUT /api/pacientes/auth/change-password - Change password
router.put('/change-password', authenticatePatientToken, async (req, res) => {
  try {
    const { senha_atual, nova_senha } = req.body;

    if (!senha_atual || !nova_senha) {
      return res.status(400).json({
        error: 'Senha atual e nova senha são obrigatórias',
        code: 'MISSING_PASSWORDS'
      });
    }

    // Get current patient data
    const pacientes = await execute(
      'SELECT senha_hash FROM pacientes WHERE id = ?',
      [req.patient.id]
    );

    if (pacientes.length === 0) {
      return res.status(404).json({
        error: 'Paciente não encontrado',
        code: 'PATIENT_NOT_FOUND'
      });
    }

    const paciente = pacientes[0];

    // Verify current password
    const senhaCorreta = await bcrypt.compare(senha_atual, paciente.senha_hash);
    if (!senhaCorreta) {
      return res.status(401).json({
        error: 'Senha atual incorreta',
        code: 'INVALID_CURRENT_PASSWORD'
      });
    }

    // Hash new password
    const novaSenhaHash = await bcrypt.hash(nova_senha, 10);

    // Update password
    await execute(
      'UPDATE pacientes SET senha_hash = ? WHERE id = ?',
      [novaSenhaHash, req.patient.id]
    );

    logger.info(`Patient password changed`, {
      pacienteId: req.patient.id,
      nome: req.patient.nome
    });

    res.json({
      success: true,
      message: 'Senha alterada com sucesso'
    });

  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({
      error: 'Erro ao alterar senha',
      message: error.message
    });
  }
});

// POST /api/pacientes/auth/logout - Logout (client-side token removal)
router.post('/logout', authenticatePatientToken, (req, res) => {
  logger.info(`Patient logged out`, {
    pacienteId: req.patient.id,
    nome: req.patient.nome
  });

  res.json({
    success: true,
    message: 'Logout realizado com sucesso'
  });
});

module.exports = { router, authenticatePatientToken };