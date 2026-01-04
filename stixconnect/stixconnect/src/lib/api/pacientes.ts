import api from '../client';
import { Paciente, PacienteCompleto, PacienteSearchResult, PacienteClinico } from '../types/pacientes';

export const pacientesService = {
  /**
   * Buscar paciente por ID
   */
  async getPatient(id: string): Promise<Paciente> {
    const { data } = await api.get<Paciente>(`/usuario/${id}`);
    return data;
  },

  /**
   * Criar novo paciente
   */
  async createPatient(patientData: Partial<Paciente>, clinicoData: Partial<PacienteClinico>): Promise<void> {
    await api.post('/pacientes', {
      ...patientData,
      ...clinicoData
    });
  },

  /**
   * Buscar prontuário do paciente
   */
  async getProntuario(numProntuario: string): Promise<PacienteCompleto | null> {
    const { data } = await api.get<PacienteCompleto>(`/enfermagem/api/prontuario/${numProntuario}`);
    return data;
  },

  /**
   * Buscar pacientes com paginação e filtro
   */
  async searchPatients(query: string, page: number = 1): Promise<PacienteSearchResult> {
    const { data } = await api.get<PacienteSearchResult>('/enfermagem/api/prontuario', {
      params: { 
        q: query, 
        page,
        limit: 10 
      }
    });
    return data;
  },

  /**
   * Atualizar dados do paciente
   */
  async updatePatient(id: string, patientData: Partial<Paciente>): Promise<void> {
    await api.put(`/pacientes/${id}`, patientData);
  },

  /**
   * Excluir paciente
   */
  async deletePatient(id: string): Promise<void> {
    await api.delete(`/pacientes/${id}`);
  }
};