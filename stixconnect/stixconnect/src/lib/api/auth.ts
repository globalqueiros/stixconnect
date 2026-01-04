import api from '../client';

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export const authService = {
  /**
   * Realizar login
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', credentials);
    
    // Salvar token no localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', data.token);
    }
    
    return data;
  },

  /**
   * Realizar logout
   */
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      // Limpar token do localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
      }
    }
  },

  /**
   * Verificar sessão atual
   */
  async getSession(): Promise<User | null> {
    try {
      const { data } = await api.get<User>('/auth/session');
      return data;
    } catch (error) {
      // Se houver erro, limpar token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
      }
      return null;
    }
  },

  /**
   * Obter token de autenticação
   */
  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  },

  /**
   * Verificar se usuário está autenticado
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
};