// Tipos para consultas
export interface WaitingPatient {
  id: string;
  pacienteId: number;
  nome: string;
  tipo: 'urgente' | 'agendada';
  dataChegada: string;
  dados_triagem?: any;
  status: string;
}

export interface Consulta {
  id: string;
  tipo: 'urgente' | 'agendada';
  status: string;
  dados_triagem?: any;
  data_hora_chegada?: string;
  data_hora_atendimento?: string;
  data_hora_finalizacao?: string;
  paciente: {
    id: number;
    nome: string;
    cpf?: string;
    email?: string;
    whatsapp?: string;
  };
  enfermeira?: {
    id: number;
    nome: string;
  };
  medico?: {
    id: number;
    nome: string;
  };
  zoom_meeting?: {
    id: number;
    meeting_id: string;
    start_url: string;
    join_url: string;
    topic: string;
  };
}

export interface ConsultaResponse {
  success: boolean;
  data: Consulta;
}

export interface WaitingPatientsResponse {
  success: boolean;
  patients: WaitingPatient[];
}