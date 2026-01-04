// Tipos para triagem e criação de consultas
export interface TriageData {
  pacienteId: number;
  sintomas: string;
  duracaoSintomas: string;
  intensidadeDor: 'leve' | 'moderada' | 'intensa';
  historicoDoencas?: string;
  medicamentosUso?: string;
  alergias?: string;
  pressaoArterial?: string;
  frequenciaCardiaca?: number;
  temperatura?: number;
  saturacaoOxigenio?: number;
  classificacaoUrgencia: 'verde' | 'amarelo' | 'laranja' | 'vermelho';
  observacoes?: string;
}

export interface ScheduleData {
  profissionalId: number;
  dataHora: string;
  duracaoMinutos?: number;
  especialidade?: string;
  motivo: string;
}

export interface CriarConsultaData {
  tipo: 'urgente' | 'agendada';
  pacienteId: number;
  dadosTriagem?: TriageData;
  dadosAgendamento?: ScheduleData;
  observacoes?: string;
}

export interface ConsultaResponse {
  success: boolean;
  data: {
    consultaId: number;
    tipo: 'urgente' | 'agendada';
    status: string;
    paciente: {
      id: number;
      nome: string;
      email: string;
    };
    mensagem: string;
    proximoPasso: string;
  };
}

export interface ProfissionalDisponivel {
  id: number;
  nome: string;
  tipo: 'enfermeira' | 'medico';
  especialidade?: string;
  consultas_ativas: number;
  em_atendimento: number;
  tempo_medio_atendimento?: number;
}

export interface Patient {
  id: number;
  nome: string;
  cpf: string;
  email?: string;
  telefone?: string;
  data_nascimento?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

// Opções para formulários
export const INTENSIDADE_DOR_OPTIONS = [
  { value: 'leve', label: 'Leve', color: 'green' },
  { value: 'moderada', label: 'Moderada', color: 'yellow' },
  { value: 'intensa', label: 'Intensa', color: 'red' }
];

export const CLASSIFICACAO_URGENCIA_OPTIONS = [
  { 
    value: 'verde', 
    label: 'Verde - Baixa Prioridade', 
    description: 'Não urgente, pode aguardar',
    color: 'green',
    maxWaitTime: '240 minutos'
  },
  { 
    value: 'amarelo', 
    label: 'Amarelo - Prioridade Moderada', 
    description: 'Urgência baixa',
    color: 'yellow',
    maxWaitTime: '120 minutos'
  },
  { 
    value: 'laranja', 
    label: 'Laranja - Prioridade Alta', 
    description: 'Urgência moderada',
    color: 'orange',
    maxWaitTime: '60 minutos'
  },
  { 
    value: 'vermelho', 
    label: 'Vermelho - Emergência', 
    description: 'Urgência alta',
    color: 'red',
    maxWaitTime: '0 minutos'
  }
];