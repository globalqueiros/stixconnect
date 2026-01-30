/**
 * Serviço de Autenticação
 * Gerencia login, logout, registro e renovação de tokens
 */

import apiClient, { tokenStorage, LoginResponse, User, AuthTokens } from '../lib/api-client';
import { mapFrontendRole, getDashboardPath, BackendRole } from '../lib/role-mapping';

export interface LoginCredentials {
  email: string;
  senha: string;
  // Compatibilidade com código antigo
  password?: string;
}

export interface RegisterData {
  nome: string;
  email: string;
  senha: string;
  role: BackendRole;
  telefone?: string;
  cpf?: string;
  data_nascimento?: string;
}

export const authService = {
  /**
   * Realiza login do usuário
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    // Normalizar credenciais (suporta 'senha' ou 'password')
    const normalizedCredentials = {
      email: credentials.email,
      senha: credentials.senha || credentials.password || '',
    };
    
    const response = await apiClient.post<LoginResponse>('/auth/login', normalizedCredentials);
    
    // Armazenar tokens e dados do usuário
    tokenStorage.setTokens(
      {
        access_token: response.access_token,
        refresh_token: response.refresh_token,
        token_type: response.token_type,
        expires_in: response.expires_in,
      },
      response.user
    );
    
    return response;
  },
  
  /**
   * Registra um novo usuário
   */
  async register(data: RegisterData): Promise<User> {
    return apiClient.post<User>('/auth/register', data);
  },
  
  /**
   * Realiza logout do usuário
   */
  async logout(): Promise<void> {
    try {
      // Invalidar refresh token no backend
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Ignorar erro se o token já expirou
      console.warn('Erro ao fazer logout no servidor:', error);
    } finally {
      // Sempre limpar tokens locais
      tokenStorage.clearTokens();
    }
  },
  
  /**
   * Renova o access token
   */
  async refreshToken(): Promise<AuthTokens | null> {
    const refreshToken = tokenStorage.getRefreshToken();
    
    if (!refreshToken) {
      return null;
    }
    
    try {
      const response = await apiClient.post<AuthTokens>('/auth/refresh', {
        refresh_token: refreshToken,
      });
      
      tokenStorage.setTokens(response);
      return response;
    } catch (error) {
      tokenStorage.clearTokens();
      return null;
    }
  },
  
  /**
   * Obtém dados do usuário atual
   */
  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>('/auth/me');
  },
  
  /**
   * Verifica se o usuário está autenticado
   */
  isAuthenticated(): boolean {
    return tokenStorage.isAuthenticated();
  },
  
  /**
   * Obtém o usuário armazenado localmente
   */
  getStoredUser(): User | null {
    return tokenStorage.getUser();
  },
  
  /**
   * Obtém o caminho do dashboard baseado na role do usuário
   */
  getDashboardForCurrentUser(): string {
    const user = tokenStorage.getUser();
    if (!user) return '/';
    return getDashboardPath(user.role);
  },
  
  /**
   * Redireciona para o dashboard apropriado após login
   */
  redirectToDashboard(): void {
    if (typeof window !== 'undefined') {
      window.location.href = this.getDashboardForCurrentUser();
    }
  },
};

export default authService;
