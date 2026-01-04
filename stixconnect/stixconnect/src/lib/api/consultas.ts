import api from '../client';
import { WaitingPatient, WaitingPatientsResponse, Consulta, ConsultaResponse } from '../types/consultas';

export const consultasService = {
  /**
   * Obter pacientes aguardando atendimento
   */
  async getWaitingPatients(role: 'nurse' | 'doctor'): Promise<WaitingPatient[]> {
    const { data } = await api.get<WaitingPatientsResponse>('/consultas/aguardando', { 
      params: { role } 
    });
    return data.patients || [];
  },

  /**
   * Obter consulta específica por ID
   */
  async getConsulta(id: string): Promise<Consulta> {
    const { data } = await api.get<ConsultaResponse>(`/consultas/${id}`);
    return data.data;
  },

  /**
   * Atender paciente
   */
  async attendPatient(id: string, role: 'nurse' | 'doctor'): Promise<void> {
    await api.post(`/consultas/${id}/atender`, { role });
  },

  /**
   * Encaminhar paciente para próximo estágio
   */
  async forwardPatient(id: string, destination: string, role: string): Promise<void> {
    await api.post(`/consultas/${id}/encaminhar`, { 
      to: destination, 
      role 
    });
  },

  /**
   * Encerrar consulta
   */
  async closeConsulta(id: string, role: 'nurse' | 'doctor'): Promise<void> {
    await api.post(`/consultas/${id}/encerrar`, { role });
  },

  /**
   * Salvar dados da triagem
   */
  async saveTriagem(id: string, dadosTriagem: any): Promise<void> {
    await api.post(`/triagem/${id}`, dadosTriagem);
  },

  /**
   * Obter consultas de um paciente específico
   */
  async getConsultasByPaciente(pacienteId: string): Promise<WaitingPatient[]> {
    const { data } = await api.get<WaitingPatientsResponse>(`/consultas/paciente/${pacienteId}`);
    return data.patients || [];
  }
};