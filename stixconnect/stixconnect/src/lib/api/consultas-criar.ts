import api from '../client';
import { CriarConsultaData, ConsultaResponse, ProfissionalDisponivel, Patient } from '../types/consultas-criar';

export const consultasCriarService = {
  /**
   * Criar nova consulta (urgente ou agendada)
   */
  async criarConsulta(data: CriarConsultaData): Promise<ConsultaResponse> {
    const { data: response } = await api.post<ConsultaResponse>('/consultas/criar', data);
    return response;
  },

  /**
   * Obter profissionais disponíveis
   */
  async getProfissionaisDisponiveis(tipo: 'enfermeira' | 'medico', especialidade?: string): Promise<ProfissionalDisponivel[]> {
    const { data } = await api.get<{ success: boolean; data: ProfissionalDisponivel[] }>('/consultas/profissionais-disponiveis', {
      params: { tipo, especialidade }
    });
    return data.data || [];
  },

  /**
   * Buscar pacientes por nome ou CPF
   */
  async buscarPacientes(termo: string): Promise<Patient[]> {
    const { data } = await api.get<{ success: boolean; data: Patient[] }>('/pacientes/buscar', {
      params: { termo }
    });
    return data.data || [];
  },

  /**
   * Obter detalhes do paciente
   */
  async getPaciente(id: number): Promise<Patient> {
    const { data } = await api.get<{ success: boolean; data: Patient }>(`/pacientes/${id}`);
    return data.data;
  },

  /**
   * Verificar disponibilidade de profissional em horário específico
   */
  async verificarDisponibilidade(
    profissionalId: number, 
    dataHora: string, 
    duracaoMinutos: number = 30
  ): Promise<{ disponivel: boolean; conflitos?: any[] }> {
    const { data } = await api.post<{ disponivel: boolean; conflitos?: any[] }>(
      '/profissionais/verificar-disponibilidade',
      {
        profissionalId,
        dataHora,
        duracaoMinutos
      }
    );
    return data;
  },

  /**
   * Obter slots de agendamento disponíveis para um profissional
   */
  async getSlotsDisponiveis(profissionalId: number, data: string): Promise<any[]> {
    const { data } = await api.get<{ success: boolean; data: any[] }>(`/agendamento/slots/${profissionalId}`, {
      params: { data }
    });
    return data.data || [];
  }
};