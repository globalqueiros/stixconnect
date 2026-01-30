/**
 * Serviço de Usuários
 * Gerencia CRUD de usuários (admin)
 */

import apiClient from '../lib/api-client';
import { BackendRole } from '../lib/role-mapping';

export interface User {
  id: number;
  nome: string;
  email: string;
  role: BackendRole;
  telefone?: string;
  cpf?: string;
  data_nascimento?: string;
  num_prontuario?: string;
  endereco?: string;
  especialidade?: string;
  crm?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserCreate {
  nome: string;
  email: string;
  senha: string;
  role: BackendRole;
  telefone?: string;
  cpf?: string;
  data_nascimento?: string;
  especialidade?: string;
  crm?: string;
}

export interface UserUpdate {
  nome?: string;
  telefone?: string;
  data_nascimento?: string;
  especialidade?: string;
  crm?: string;
  ativo?: boolean;
}

export interface PaginatedUsers {
  items: User[];
  total: number;
  skip: number;
  limit: number;
}

export const userService = {
  /**
   * Lista todos os usuários (admin only)
   */
  async getUsers(
    skip: number = 0,
    limit: number = 100,
    role?: BackendRole
  ): Promise<PaginatedUsers> {
    let endpoint = `/admin/users?skip=${skip}&limit=${limit}`;
    if (role) {
      endpoint += `&role=${role}`;
    }
    return apiClient.get<PaginatedUsers>(endpoint);
  },
  
  /**
   * Busca um usuário por ID
   */
  async getUserById(id: number): Promise<User> {
    return apiClient.get<User>(`/admin/users/${id}`);
  },
  
  /**
   * Cria um novo usuário
   */
  async createUser(data: UserCreate): Promise<User> {
    return apiClient.post<User>('/auth/register', data);
  },
  
  /**
   * Atualiza um usuário
   */
  async updateUser(id: number, data: UserUpdate): Promise<User> {
    return apiClient.put<User>(`/admin/users/${id}`, data);
  },
  
  /**
   * Desativa um usuário (soft delete)
   */
  async deactivateUser(id: number): Promise<void> {
    return apiClient.patch(`/admin/users/${id}`, { ativo: false });
  },
  
  /**
   * Reativa um usuário
   */
  async reactivateUser(id: number): Promise<void> {
    return apiClient.patch(`/admin/users/${id}`, { ativo: true });
  },
  
  /**
   * Lista médicos disponíveis
   */
  async getDoctors(): Promise<User[]> {
    const response = await this.getUsers(0, 500, 'doctor');
    return response.items.filter(u => u.ativo);
  },
  
  /**
   * Lista enfermeiras disponíveis
   */
  async getNurses(): Promise<User[]> {
    const response = await this.getUsers(0, 500, 'nurse');
    return response.items.filter(u => u.ativo);
  },
  
  /**
   * Lista profissionais de saúde (todas as roles clínicas)
   */
  async getHealthProfessionals(): Promise<User[]> {
    const clinicalRoles: BackendRole[] = [
      'doctor', 'nurse', 'physiotherapist', 'nutritionist',
      'psychologist', 'speech_therapist', 'acupuncturist', 'clinical_psypedagogist'
    ];
    
    const response = await this.getUsers(0, 500);
    return response.items.filter(
      u => u.ativo && clinicalRoles.includes(u.role)
    );
  },
  
  /**
   * Atualiza perfil do usuário atual
   */
  async updateProfile(data: UserUpdate): Promise<User> {
    return apiClient.put<User>('/users/me', data);
  },
  
  /**
   * Altera senha do usuário atual
   */
  async changePassword(senhaAtual: string, novaSenha: string): Promise<void> {
    return apiClient.post('/users/me/change-password', {
      senha_atual: senhaAtual,
      nova_senha: novaSenha,
    });
  },
};

export default userService;
