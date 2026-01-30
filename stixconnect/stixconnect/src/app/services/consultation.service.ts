/**
 * Serviço de Consultas
 * Gerencia CRUD de consultas e fluxo de teleconsulta
 */

import apiClient from '../lib/api-client';
import { User } from '../lib/api-client';

export type ConsultaStatus = 
  | 'aguardando'
  | 'em_triagem'
  | 'aguardando_medico'
  | 'em_atendimento'
  | 'finalizada'
  | 'cancelada';

export type ConsultaTipo = 'urgente' | 'agendada';

export type ClassificacaoUrgencia = 'baixa' | 'media' | 'alta' | 'critica';

export interface Triagem {
  id: number;
  consulta_id: number;
  paciente_id: number;
  sintomas: string;
  temperatura?: string;
  pressao_arterial?: string;
  frequencia_cardiaca?: string;
  saturacao_oxigenio?: string;
  dor_escala?: number;
  historico_medico?: string;
  medicamentos_uso?: string;
  alergias?: string;
  classificacao_automatica?: ClassificacaoUrgencia;
  classificacao_enfermeira?: ClassificacaoUrgencia;
  created_at: string;
}

export interface Consulta {
  id: number;
  paciente_id: number;
  enfermeira_id?: number;
  medico_id?: number;
  tipo: ConsultaTipo;
  status: ConsultaStatus;
  classificacao_urgencia?: ClassificacaoUrgencia;
  data_agendamento?: string;
  data_inicio?: string;
  data_fim?: string;
  duracao_minutos?: number;
  zoom_meeting_id?: string;
  zoom_join_url?: string;
  zoom_password?: string;
  observacoes?: string;
  diagnostico?: string;
  created_at: string;
  triagem?: Triagem;
  paciente?: User;
  enfermeira?: User;
  medico?: User;
}

export interface ConsultaCreate {
  tipo: ConsultaTipo;
  data_agendamento?: string;
  triagem?: {
    sintomas: string;
    temperatura?: string;
    pressao_arterial?: string;
    frequencia_cardiaca?: string;
    saturacao_oxigenio?: string;
    dor_escala?: number;
    historico_medico?: string;
    medicamentos_uso?: string;
    alergias?: string;
  };
}

export interface TriagemUpdate {
  classificacao_enfermeira?: ClassificacaoUrgencia;
  sintomas?: string;
  temperatura?: string;
  pressao_arterial?: string;
  frequencia_cardiaca?: string;
  saturacao_oxigenio?: string;
}

export interface ZoomMeeting {
  meeting_id: string;
  join_url: string;
  start_url: string;
  password: string;
}

export const consultationService = {
  /**
   * Cria uma nova consulta
   */
  async createConsultation(data: ConsultaCreate): Promise<Consulta> {
    return apiClient.post<Consulta>('/consultas/', data);
  },
  
  /**
   * Lista consultas (filtradas por role do usuário)
   */
  async getConsultations(
    status?: ConsultaStatus,
    skip: number = 0,
    limit: number = 100
  ): Promise<Consulta[]> {
    let endpoint = `/consultas/?skip=${skip}&limit=${limit}`;
    if (status) {
      endpoint += `&status=${status}`;
    }
    return apiClient.get<Consulta[]>(endpoint);
  },
  
  /**
   * Busca uma consulta por ID
   */
  async getConsultationById(id: number): Promise<Consulta> {
    return apiClient.get<Consulta>(`/consultas/${id}`);
  },
  
  /**
   * Lista consultas de um paciente específico
   */
  async getPatientConsultations(patientId: number): Promise<Consulta[]> {
    return apiClient.get<Consulta[]>(`/consultas/paciente/${patientId}`);
  },
  
  /**
   * Enfermeira inicia atendimento de triagem
   */
  async startTriage(consultaId: number): Promise<Consulta> {
    return apiClient.post<Consulta>(`/consultas/${consultaId}/iniciar-atendimento`);
  },
  
  /**
   * Enfermeira atualiza triagem
   */
  async updateTriage(consultaId: number, data: TriagemUpdate): Promise<Consulta> {
    return apiClient.put<Consulta>(`/consultas/${consultaId}/triagem`, data);
  },
  
  /**
   * Enfermeira transfere para médico
   */
  async transferToDoctor(consultaId: number, medicoId: number): Promise<Consulta> {
    return apiClient.post<Consulta>(`/consultas/${consultaId}/transferir-medico/${medicoId}`);
  },
  
  /**
   * Médico inicia atendimento
   */
  async startMedicalAttendance(consultaId: number): Promise<Consulta> {
    return apiClient.post<Consulta>(`/consultas/${consultaId}/iniciar-medico`);
  },
  
  /**
   * Médico finaliza consulta
   */
  async finalizeConsultation(
    consultaId: number,
    diagnostico: string,
    observacoes?: string
  ): Promise<Consulta> {
    return apiClient.post<Consulta>(`/consultas/${consultaId}/finalizar`, {
      diagnostico,
      observacoes,
    });
  },
  
  /**
   * Cancela uma consulta
   */
  async cancelConsultation(consultaId: number, motivo?: string): Promise<Consulta> {
    return apiClient.post<Consulta>(`/consultas/${consultaId}/cancelar`, { motivo });
  },
  
  /**
   * Cria reunião Zoom para a consulta
   */
  async createZoomMeeting(consultaId: number): Promise<ZoomMeeting> {
    return apiClient.post<ZoomMeeting>(`/consultas/${consultaId}/create-zoom`);
  },
  
  /**
   * Lista consultas aguardando triagem (para enfermeiras)
   */
  async getPendingTriage(): Promise<Consulta[]> {
    return this.getConsultations('aguardando');
  },
  
  /**
   * Lista consultas aguardando médico
   */
  async getPendingDoctor(): Promise<Consulta[]> {
    return this.getConsultations('aguardando_medico');
  },
  
  /**
   * Lista consultas em atendimento
   */
  async getInProgress(): Promise<Consulta[]> {
    return this.getConsultations('em_atendimento');
  },
  
  /**
   * Estatísticas de consultas (admin)
   */
  async getStatistics(): Promise<{
    total: number;
    aguardando: number;
    em_triagem: number;
    aguardando_medico: number;
    em_atendimento: number;
    finalizadas: number;
    canceladas: number;
  }> {
    return apiClient.get('/admin/estatisticas');
  },
};

export default consultationService;
