const { z } = require('zod');

// Schema para criação unificada de consulta
const criarConsultaSchema = z.object({
  tipo: z.enum(['urgente', 'agendada'], {
    errorMap: () => ({ message: 'Tipo deve ser: urgente ou agendada' })
  }),
  pacienteId: z.number().positive('ID do paciente é obrigatório'),
  
  // Dados específicos para urgente
  dadosTriagem: z.object({
    sintomas: z.string().min(1, 'Sintomas são obrigatórios'),
    duracaoSintomas: z.string().min(1, 'Duração dos sintomas é obrigatória'),
    intensidadeDor: z.enum(['leve', 'moderada', 'intensa']),
    historicoDoencas: z.string().optional(),
    medicamentosUso: z.string().optional(),
    alergias: z.string().optional(),
    pressaoArterial: z.string().optional(),
    frequenciaCardiaca: z.number().positive().optional(),
    temperatura: z.number().positive().optional(),
    saturacaoOxigenio: z.number().min(0).max(100).optional(),
    classificacaoUrgencia: z.enum(['verde', 'amarelo', 'laranja', 'vermelho']),
    observacoes: z.string().optional()
  }).optional(),
  
  // Dados específicos para agendada
  dadosAgendamento: z.object({
    profissionalId: z.number().positive(),
    dataHora: z.string().datetime('Data e hora inválida'),
    duracaoMinutos: z.number().positive().default(30),
    especialidade: z.string().optional(),
    motivo: z.string().min(1, 'Motivo da consulta é obrigatório')
  }).optional(),
  
  // Dados gerais
  observacoes: z.string().optional(),
  
  // Para agendamentos recorrentes (futuro)
  recorrencia: z.object({
    frequencia: z.enum(['diaria', 'semanal', 'mensal']).optional(),
    quantidade: z.number().positive().optional(),
    termino: z.string().datetime().optional()
  }).optional()
}).refine((data) => {
  // Validação condicional: urgente requer dadosTriagem, agendada requer dadosAgendamento
  if (data.tipo === 'urgente' && !data.dadosTriagem) {
    return false;
  }
  if (data.tipo === 'agendada' && !data.dadosAgendamento) {
    return false;
  }
  return true;
}, {
  message: "Dados específicos do tipo de consulta são obrigatórios",
  path: []
});

// Schema para atualização de status
const atualizarStatusSchema = z.object({
  status: z.enum([
    'triagem', 'aguardando_enfermeira', 'atendimento_enfermagem',
    'aguardando_medico', 'atendimento_medico', 'finalizada', 'cancelada'
  ]),
  profissionalId: z.number().positive().optional(),
  observacao: z.string().optional()
});

// Schema para atribuição automática
const atribuirProfissionalSchema = z.object({
  consultaId: z.number().positive(),
  tipoProfissional: z.enum(['enfermeira', 'medico']),
  especialidade: z.string().optional(),
  forcarAtribuicao: z.boolean().default(false) // Ignorar disponibilidade se true
});

// Schema para agendamento
const agendarConsultaSchema = z.object({
  pacienteId: z.number().positive(),
  profissionalId: z.number().positive(),
  dataHora: z.string().datetime(),
  duracaoMinutos: z.number().positive().default(30),
  motivo: z.string().min(1, 'Motivo é obrigatório'),
  especialidade: z.string().optional(),
  observacoes: z.string().optional()
});

module.exports = {
  criarConsultaSchema,
  atualizarStatusSchema,
  atribuirProfissionalSchema,
  agendarConsultaSchema
};