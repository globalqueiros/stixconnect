// Cliente API para comunicação com backend FastAPI
import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

// Tipos para respostas do backend
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  status_code?: number;
}

export interface LoginResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  user: {
    id: number;
    email: string;
    nome: string;
    role: string;
    codPerfil: number;
    nomePerfil: string;
    rota: string;
    ativo: boolean;
  };
}

export interface UserProfile {
  id: number;
  email: string;
  nome: string;
  role: string;
  codPerfil: number;
  nomePerfil: string;
  rota: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

// Configuração do cliente Axios
class ApiClient {
  private client: AxiosInstance;
  private refreshTokenPromise: Promise<string> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Interceptor de request para adicionar token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Interceptor de response para tratamento de erros e refresh token
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // Se erro for 401 e não for uma tentativa de refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshAccessToken();
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Se refresh falhar, redirecionar para login
            this.logout();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Métodos para gestão de tokens
  private getAccessToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  }

  private getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refresh_token');
    }
    return null;
  }

  private setTokens(accessToken: string, refreshToken?: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', accessToken);
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      }
    }
  }

  // Refresh token com retry único
  private async refreshAccessToken(): Promise<string | null> {
    // Evitar múltiplas tentativas simultâneas
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    this.refreshTokenPromise = this.performTokenRefresh(refreshToken);

    try {
      const newAccessToken = await this.refreshTokenPromise;
      return newAccessToken;
    } finally {
      this.refreshTokenPromise = null;
    }
  }

  private async performTokenRefresh(refreshToken: string): Promise<string> {
    try {
      const response = await this.client.post('/auth/refresh', {
        refresh_token: refreshToken,
      });

      const { access_token, refresh_token: newRefreshToken } = response.data;
      this.setTokens(access_token, newRefreshToken);
      return access_token;
    } catch (error) {
      throw new Error('Failed to refresh token');
    }
  }

  // Logout
  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      sessionStorage.clear();
    }
  }

  // Métodos HTTP genéricos
  async get<T = any>(url: string, params?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.get(url, { params });
      return {
        success: true,
        data: response.data,
        status_code: response.status,
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async post<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.post(url, data);
      return {
        success: true,
        data: response.data,
        status_code: response.status,
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async put<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.put(url, data);
      return {
        success: true,
        data: response.data,
        status_code: response.status,
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async patch<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.patch(url, data);
      return {
        success: true,
        data: response.data,
        status_code: response.status,
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async delete<T = any>(url: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.delete(url);
      return {
        success: true,
        data: response.data,
        status_code: response.status,
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  // Upload de arquivos
  async upload<T = any>(url: string, file: File, additionalData?: any): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });
    }

    try {
      const response = await this.client.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return {
        success: true,
        data: response.data,
        status_code: response.status,
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  // Tratamento de erros
  private handleError(error: any): ApiResponse {
    if (error.response) {
      // Erro da API
      return {
        success: false,
        error: error.response.data?.detail || error.response.data?.message || 'Erro na API',
        status_code: error.response.status,
      };
    } else if (error.request) {
      // Erro de rede
      return {
        success: false,
        error: 'Erro de conexão com o servidor',
        status_code: 0,
      };
    } else {
      // Erro desconhecido
      return {
        success: false,
        error: error.message || 'Erro desconhecido',
        status_code: 0,
      };
    }
  }

  // Verificar se usuário está autenticado
  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    try {
      // Verificar expiração do token (simples)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  }

  // Obter informações do usuário atual
  getCurrentUser(): UserProfile | null {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  }

  // Setar usuário atual
  setCurrentUser(user: UserProfile): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }
}

// Exportar instância única do cliente
const apiClient = new ApiClient();
export default apiClient;

// Exportar tipos e utilities
export { apiClient };