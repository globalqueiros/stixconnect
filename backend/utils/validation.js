const { z } = require('zod');

const triagemSchema = z.object({
  pacienteId: z.number().positive(),
  sintomas: z.string().min(1, 'Sintomas são obrigatórios'),
  duracaoSintomas: z.string().min(1, 'Duração dos sintomas é obrigatória'),
  intensidadeDor: z.enum(['leve', 'moderada', 'intensa'], {
    errorMap: () => ({ message: 'Intensidade deve ser: leve, moderada ou intensa' })
  }),
  historicoDoencas: z.string().optional(),
  medicamentosUso: z.string().optional(),
  alergias: z.string().optional(),
  pressaoArterial: z.string().optional(),
  frequenciaCardiaca: z.number().positive().optional(),
  temperatura: z.number().positive().optional(),
  saturacaoOxigenio: z.number().min(0).max(100).optional(),
  classificacaoUrgencia: z.enum(['verde', 'amarelo', 'laranja', 'vermelho'], {
    errorMap: () => ({ message: 'Classificação deve ser: verde, amarelo, laranja ou vermelho' })
  }),
  observacoes: z.string().optional()
});

const consultaSchema = z.object({
  id: z.number(),
  tipo: z.enum(['urgente', 'agendada']),
  status: z.enum([
    'triagem', 
    'aguardando_enfermeira', 
    'atendimento_enfermagem', 
    'aguardando_medico', 
    'atendimento_medico', 
    'finalizada', 
    'cancelada'
  ]),
  pacienteId: z.number(),
  enfermeiraId: z.number().optional(),
  medicoId: z.number().optional(),
  zoomMeetingId: z.string().optional(),
  zoomLink: z.string().optional(),
  dataHoraInicio: z.date().optional(),
  dataHoraFim: z.date().optional(),
  duracaoMinutos: z.number().optional(),
  dadosTriagem: z.record(z.any()).optional(),
  observacoes: z.string().optional()
});

const profissionalSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  tipo: z.enum(['enfermeira', 'medico']),
  crmCoren: z.string().min(1, 'CRM/COREN é obrigatório'),
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres')
});

const pacienteSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido'),
  email: z.string().email('Email inválido').optional(),
  telefone: z.string().optional(),
  dataNascimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de nascimento inválida')
});

module.exports = {
  triagemSchema,
  consultaSchema,
  profissionalSchema,
  pacienteSchema
};