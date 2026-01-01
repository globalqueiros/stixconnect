const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { profissionalSchema } = require('../utils/validation');
const { execute, transaction } = require('../config/database');
const logger = require('../utils/logger');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Token de autenticação não fornecido',
      code: 'MISSING_TOKEN'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
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

// POST /api/auth/login - Professional login
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({
        error: 'Email e senha são obrigatórios',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Find professional by email
    const profissionais = await execute(
      'SELECT * FROM profissionais WHERE email = ?',
      [email]
    );

    if (profissionais.length === 0) {
      return res.status(401).json({
        error: 'Credenciais inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const profissional = profissionais[0];

    // Verify password (simplified - in production use proper password hashing)
    const senhaCorreta = await bcrypt.compare(senha, profissional.senha_hash);
    if (!senhaCorreta) {
      return res.status(401).json({
        error: 'Credenciais inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check if professional is available
    if (!profissional.disponivel) {
      return res.status(401).json({
        error: 'Profissional não está disponível no momento',
        code: 'UNAVAILABLE'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: profissional.id,
        nome: profissional.nome,
        tipo: profissional.tipo,
        email: profissional.email
      },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    logger.info(`Professional logged in`, {
      profissionalId: profissional.id,
      nome: profissional.nome,
      tipo: profissional.tipo
    });

    res.json({
      success: true,
      token,
      user: {
        id: profissional.id,
        nome: profissional.nome,
        tipo: profissional.tipo,
        email: profissional.email,
        crmCoren: profissional.crm_coren
      }
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      error: 'Erro interno no servidor',
      message: error.message
    });
  }
});

// POST /api/auth/register - Register new professional (admin only)
router.post('/register', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin (you might want to add an 'admin' role to professionals table)
    if (req.user.tipo !== 'medico') {
      return res.status(403).json({
        error: 'Apenas administradores podem registrar novos profissionais',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Validate input
    const validatedData = profissionalSchema.parse(req.body);

    // Check if email already exists
    const existingProfissionais = await execute(
      'SELECT id FROM profissionais WHERE email = ?',
      [validatedData.email]
    );

    if (existingProfissionais.length > 0) {
      return res.status(409).json({
        error: 'Email já cadastrado',
        code: 'EMAIL_EXISTS'
      });
    }

    // Check if CRM/COREN already exists
    const existingCRM = await execute(
      'SELECT id FROM profissionais WHERE crm_coren = ?',
      [validatedData.crmCoren]
    );

    if (existingCRM.length > 0) {
      return res.status(409).json({
        error: 'CRM/COREN já cadastrado',
        code: 'CRM_EXISTS'
      });
    }

    // Hash password
    const senhaHash = await bcrypt.hash(validatedData.senha, 10);

    // Insert new professional
    const result = await execute(
      `INSERT INTO profissionais (
        nome, tipo, crm_coren, email, senha_hash, disponivel
      ) VALUES (?, ?, ?, ?, ?, true)`,
      [
        validatedData.nome,
        validatedData.tipo,
        validatedData.crmCoren,
        validatedData.email,
        senhaHash
      ]
    );

    logger.info(`New professional registered`, {
      profissionalId: result.insertId,
      nome: validatedData.nome,
      tipo: validatedData.tipo,
      registeredBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Profissional cadastrado com sucesso',
      data: {
        id: result.insertId,
        nome: validatedData.nome,
        tipo: validatedData.tipo,
        email: validatedData.email
      }
    });

  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors
      });
    }

    logger.error('Registration error:', error);
    res.status(500).json({
      error: 'Erro ao registrar profissional',
      message: error.message
    });
  }
});

// GET /api/auth/me - Get current user info
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const profissionais = await execute(
      'SELECT id, nome, tipo, email, crm_coren, disponivel FROM profissionais WHERE id = ?',
      [req.user.id]
    );

    if (profissionais.length === 0) {
      return res.status(404).json({
        error: 'Profissional não encontrado',
        code: 'PROFESSIONAL_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: profissionais[0]
    });

  } catch (error) {
    logger.error('Get user info error:', error);
    res.status(500).json({
      error: 'Erro ao buscar informações do usuário',
      message: error.message
    });
  }
});

// POST /api/auth/logout - Logout (client-side token removal)
router.post('/logout', authenticateToken, (req, res) => {
  logger.info(`Professional logged out`, {
    profissionalId: req.user.id,
    nome: req.user.nome
  });

  res.json({
    success: true,
    message: 'Logout realizado com sucesso'
  });
});

module.exports = { router, authenticateToken };