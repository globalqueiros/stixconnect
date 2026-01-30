// Serviços de Consultas Médicas
import apiClient, { ApiResponse } from '@/lib/api-client';

export interface Consulta {
  id: number;
  patient_id: number;
  paciente?: {
    id: number;
    nome: string;
    email: string;
    telefone: string;
  };
  nurse_id?: number;
  enfermeiro?: {
    id: number;
    nome: string;
    email: string;
  };
  doctor_id?: number;
  medico?: {
    id: number;
    nome: string;
    email: string;
  };
  status: 'aguardando' | 'em_triagem' | 'aguardando_medico' | 'em_atendimento' | 'finalizada' | 'cancelada';
  data_consulta: string;
  hora_consulta?: string;
  data_inicio?: string;
  data_fim?: string;
  queixa_principal?: string;
  dor_escala?: number;
  temperatura?: string;
  pressao?: string;
  saturacao_oxigenio?: string;
  classificacao_urgencia?: 'verde' | 'amarelo' | 'vermelho';
  zoom_meeting_id?: string;
  zoom_join_url?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateConsultaRequest {
  patient_id: number;
  queixa_principal: string;
  dor_escala?: number;
  temperatura?: string;
  pressao?: string;
  saturacao_oxigenio?: string;
  observacoes?: string;
}

export interface UpdateConsultaRequest {
  status?: string;
  queixa_principal?: string;
  dor_escala?: number;
  temperatura?: string;
  pressao?: string;
  saturacao_oxigenio?: string;
  observacoes?: string;
  classificacao_urgencia?: 'verde' | 'amarelo' | 'vermelho';
}

export interface ZoomMeetingRequest {
  consultation_id: number;
  topic?: string;
  duration?: number;
}

export class ConsultationService {
  // Listar consultas (baseado no papel do usuário)
  async getConsultations(role?: string, status?: string): Promise<Consulta[]> {
    const params: any = {};
    if (role) params.role = role;
    if (status) params.status = status;

    const response = await apiClient.get<Consulta[]>('/consultas/', params);
    
    if (response.success && response.data) {
      return response.data;
    } else {
      throw new Error(response.error || 'Erro ao buscar consultas');
    }
  }

  // Buscar consulta específica
  async getConsultation(id: number): Promise<Consulta> {
    const response = await apiClient.get<Consulta>(`/consultas/${id}`);
    
    if (response.success && response.data) {
      return response.data;
    } else {
      throw new Error(response.error || 'Erro ao buscar consulta');
    }
  }

  // Criar nova consulta (paciente)
  async createConsulta(data: CreateConsultaRequest): Promise<Consulta> {
    const response = await apiClient.post<Consulta>('/consultas/', data);
    
    if (response.success && response.data) {
      return response.data;
    } else {
      throw new Error(response.error || 'Erro ao criar consulta');
    }
  }

  // Atualizar consulta
  async updateConsulta(id: number, data: UpdateConsultaRequest): Promise<Consulta> {
    const response = await apiClient.put<Consulta>(`/consultas/${id}`, data);
    
    if (response.success && response.data) {
      return response.data;
    } else {
      throw new Error(response.error || 'Erro ao atualizar consulta');
    }
  }

  // Iniciar triagem (enfermeiro)
  async startTriage(consultationId: number): Promise<Consulta> {
    const response = await apiClient.post<Consulta>(`/consultas/${consultationId}/iniciar-atendimento`);
    
    if (response.success && response.data) {
      return response.data;
    } else {
      throw new Error(response.error || 'Erro ao iniciar triagem');
    }
  }

  // Finalizar triagem (enfermeiro)
  async completeTriage(consultationId: number, triageData: UpdateConsultaRequest): Promise<Consulta> {
    const response = await apiClient.post<Consulta>(`/consultas/${consultationId}/finalizar-triagem`, triageData);
    
    if (response.success && response.data) {
      return response.data;
    } else {
      throw new Error(response.error || 'Erro ao finalizar triagem');
    }
  }

  // Iniciar atendimento (médico)
  async startConsultation(consultationId: number): Promise<Consulta> {
    const response = await apiClient.post<Consulta>(`/consultas/${consultationId}/iniciar-consulta`);
    
    if (response.success && response.data) {
      return response.data;
    } else {
      throw new Error(response.error || 'Erro ao iniciar consulta');
    }
  }

  // Finalizar consulta (médico)
  async completeConsultation(consultationId: number, finalData: any): Promise<Consulta> {
    const response = await apiClient.post<Consulta>(`/consultas/${consultationId}/finalizar-consulta`, finalData);
    
    if (response.success && response.data) {
      return response.data;
    } else {
      throw new Error(response.error || 'Erro ao finalizar consulta');
    }
  }

  // Cancelar consulta
  async cancelConsultation(consultationId: number, reason?: string): Promise<Consulta> {
    const response = await apiClient.post<Consulta>(`/consultas/${consultationId}/cancelar`, { reason });
    
    if (response.success && response.data) {
      return response.data;
    } else {
      throw new Error(response.error || 'Erro ao cancelar consulta');
    }
  }

  // Criar reunião Zoom
  async createZoomMeeting(data: ZoomMeetingRequest): Promise<any> {
    const response = await apiClient.post(`/consultas/${data.consultation_id}/create-zoom`, {
      topic: data.topic || `Consulta Médica #${data.consultation_id}`,
      duration: data.duration || 30,
    });
    
    if (response.success && response.data) {
      return response.data;
    } else {
      throw new Error(response.error || 'Erro ao criar reunião Zoom');
    }
  }

  // Obter estatísticas (admin)
  async getStatistics(dateRange?: { start: string; end: string }): Promise<any> {
    const params: any = {};
    if (dateRange) {
      params.start_date = dateRange.start;
      params.end_date = dateRange.end;
    }

    const response = await apiClient.get('/admin/estatisticas', params);
    
    if (response.success && response.data) {
      return response.data;
    } else {
      throw new Error(response.error || 'Erro ao buscar estatísticas');
    }
  }

  // Buscar consultas do paciente
  async getPatientConsultations(patientId: number): Promise<Consulta[]> {
    const response = await apiClient.get<Consulta[]>(`/consultas/patient/${patientId}`);
    
    if (response.success && response.data) {
      return response.data;
    } else {
      throw new Error(response.error || 'Erro ao buscar consultas do paciente');
    }
  }

  // Buscar consultas pendentes (enfermeiro/médico)
  async getPendingConsultations(role: string): Promise<Consulta[]> {
    const response = await apiClient.get<Consulta[]>(`/consultas/pending/${role}`);
    
    if (response.success && response.data) {
      return response.data;
    } else {
      throw new Error(response.error || 'Erro ao buscar consultas pendentes');
    }
  }

  // Atualizar status da consulta
  async updateStatus(consultationId: number, status: string): Promise<Consulta> {
    const response = await apiClient.patch<Consulta>(`/consultas/${consultationId}/status`, { status });
    
    if (response.success && response.data) {
      return response.data;
    } else {
      throw new Error(response.error || 'Erro ao atualizar status');
    }
  }

  // Adicionar observações
  async addObservations(consultationId: number, observations: string): Promise<Consulta> {
    const response = await apiClient.post<Consulta>(`/consultas/${consultationId}/observacoes`, {
      observacoes,
    });
    
    if (response.success && response.data) {
      return response.data;
    } else {
      throw new Error(response.error || 'Erro ao adicionar observações');
    }
  }
}

// Exportar instância singleton
export const consultationService = new ConsultationService();