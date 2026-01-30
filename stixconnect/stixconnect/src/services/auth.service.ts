// Serviços de Autenticação
import apiClient, { LoginResponse, UserProfile } from '@/lib/api-client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  nome: string;
  role: string;
  codPerfil: number;
}

export class AuthService {
  // Login do usuário
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', {
      email: credentials.email,
      senha: credentials.password, // Backend espera 'senha'
    });

    if (response.success && response.data) {
      const { access_token, refresh_token, user } = response.data;
      
      // Salvar tokens e usuário
      apiClient.setTokens(access_token, refresh_token);
      apiClient.setCurrentUser(user);
      
      // Salvar em sessionStorage para compatibilidade com código existente
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('userLevel', String(user.codPerfil));
      }

      return response.data;
    } else {
      throw new Error(response.error || 'Erro ao fazer login');
    }
  }

  // Registro de novo usuário
  async register(userData: RegisterRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/register', userData);

    if (response.success && response.data) {
      const { access_token, refresh_token, user } = response.data;
      
      apiClient.setTokens(access_token, refresh_token);
      apiClient.setCurrentUser(user);
      
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('userLevel', String(user.codPerfil));
      }

      return response.data;
    } else {
      throw new Error(response.error || 'Erro ao registrar usuário');
    }
  }

  // Refresh token
  async refreshToken(): Promise<string | null> {
    try {
      const newToken = await (apiClient as any).refreshAccessToken();
      return newToken;
    } catch (error) {
      throw new Error('Erro ao atualizar token');
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      // Chamar endpoint de logout do backend se existir
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Ignorar erro se endpoint não existir
    } finally {
      // Limpar dados locais
      apiClient.logout();
      
      // Redirecionar para login
      if (typeof window !== 'undefined') {
        // Adicionar mensagem de sucesso
        sessionStorage.setItem('flashMessage', 'Sessão encerrada com sucesso!');
        window.location.href = '/login';
      }
    }
  }

  // Verificar se usuário está autenticado
  isAuthenticated(): boolean {
    return apiClient.isAuthenticated();
  }

  // Obter usuário atual
  getCurrentUser(): UserProfile | null {
    return apiClient.getCurrentUser();
  }

  // Obter token atual
  getAccessToken(): string | null {
    return (apiClient as any).getAccessToken();
  }

  // Verificar permissão baseada no perfil
  hasPermission(requiredRole: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    // Mapeamento de permissões (ajustar conforme necessário)
    const roleHierarchy: { [key: string]: number } = {
      'Administrador': 10,
      'Médico': 8,
      'Enfermeiro': 6,
      'Atendente': 4,
      'Paciente': 2,
    };

    const userLevel = roleHierarchy[user.nomePerfil] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    return userLevel >= requiredLevel;
  }

  // Verificar se usuário pode acessar rota específica
  canAccessRoute(route: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    // Permitir acesso se rota do usuário bater com a rota perfil
    if (user.rota === route) return true;

    // Administradores acessam tudo
    if (user.nomePerfil === 'Administrador') return true;

    // Regras específicas por rota
    const routePermissions: { [key: string]: string[] } = {
      '/medico': ['Médico', 'Administrador'],
      '/enfermagem': ['Enfermeiro', 'Administrador'],
      '/administrador': ['Administrador'],
      '/paciente': ['Paciente', 'Administrador', 'Médico', 'Enfermeiro'],
    };

    const allowedRoles = routePermissions[route];
    if (!allowedRoles) return true; // Rotas públicas

    return allowedRoles.includes(user.nomePerfil);
  }
}

// Exportar instância singleton
export const authService = new AuthService();