/**
 * Serviço de Pacientes
 * Gerencia CRUD de pacientes
 */

import apiClient from '../lib/api-client';

export interface Patient {
  id: number;
  nome: string;
  email: string;
  telefone?: string;
  cpf?: string;
  data_nascimento?: string;
  num_prontuario?: string;
  endereco?: string;
  ativo: boolean;
  created_at: string;
}

export interface PatientCreate {
  nome: string;
  email: string;
  senha: string;
  telefone?: string;
  cpf?: string;
  data_nascimento?: string;
  endereco?: string;
}

export interface PatientUpdate {
  nome?: string;
  telefone?: string;
  data_nascimento?: string;
  endereco?: string;
  ativo?: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}

export const patientService = {
  /**
   * Lista pacientes com paginação
   */
  async getPatients(
    skip: number = 0,
    limit: number = 100,
    search?: string
  ): Promise<PaginatedResponse<Patient>> {
    let endpoint = `/patients?skip=${skip}&limit=${limit}`;
    if (search) {
      endpoint += `&search=${encodeURIComponent(search)}`;
    }
    return apiClient.get<PaginatedResponse<Patient>>(endpoint);
  },
  
  /**
   * Busca um paciente por ID
   */
  async getPatientById(id: number): Promise<Patient> {
    return apiClient.get<Patient>(`/patients/${id}`);
  },
  
  /**
   * Busca um paciente por número de prontuário
   */
  async getPatientByProntuario(numProntuario: string): Promise<Patient> {
    return apiClient.get<Patient>(`/patients/prontuario/${numProntuario}`);
  },
  
  /**
   * Cria um novo paciente
   */
  async createPatient(data: PatientCreate): Promise<Patient> {
    return apiClient.post<Patient>('/patients', {
      ...data,
      role: 'patient', // Sempre paciente
    });
  },
  
  /**
   * Atualiza um paciente
   */
  async updatePatient(id: number, data: PatientUpdate): Promise<Patient> {
    return apiClient.put<Patient>(`/patients/${id}`, data);
  },
  
  /**
   * Desativa um paciente (soft delete)
   */
  async deactivatePatient(id: number): Promise<void> {
    return apiClient.patch(`/patients/${id}`, { ativo: false });
  },
  
  /**
   * Reativa um paciente
   */
  async reactivatePatient(id: number): Promise<void> {
    return apiClient.patch(`/patients/${id}`, { ativo: true });
  },
  
  /**
   * Busca pacientes por termo
   */
  async searchPatients(term: string): Promise<Patient[]> {
    const response = await this.getPatients(0, 50, term);
    return response.items;
  },
};

export default patientService;
