/**
 * Cliente HTTP para comunicação com o backend FastAPI
 * Gerencia tokens JWT, refresh automático e interceptors
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Tipos para respostas de autenticação
export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface User {
  id: number;
  nome: string;
  email: string;
  role: string;
  telefone?: string;
  cpf?: string;
  ativo: boolean;
  created_at: string;
}

export interface LoginResponse extends AuthTokens {
  user: User;
}

export interface ApiError {
  detail: string;
  status: number;
}

// Storage keys
const ACCESS_TOKEN_KEY = 'stixconnect_access_token';
const REFRESH_TOKEN_KEY = 'stixconnect_refresh_token';
const USER_KEY = 'stixconnect_user';

/**
 * Armazenamento de tokens (localStorage)
 */
export const tokenStorage = {
  getAccessToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  
  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  
  getUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },
  
  setTokens: (tokens: AuthTokens, user?: User): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  },
  
  clearTokens: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  
  isAuthenticated: (): boolean => {
    return !!tokenStorage.getAccessToken();
  }
};

/**
 * Flag para evitar múltiplas tentativas de refresh simultâneas
 */
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
}

/**
 * Tenta renovar o access token usando o refresh token
 */
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefreshToken();
  
  if (!refreshToken) {
    return null;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    
    if (!response.ok) {
      throw new Error('Refresh failed');
    }
    
    const data: AuthTokens = await response.json();
    tokenStorage.setTokens(data);
    return data.access_token;
  } catch (error) {
    tokenStorage.clearTokens();
    return null;
  }
}

/**
 * Cliente HTTP principal
 */
class ApiClient {
  private baseUrl: string;
  
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }
  
  /**
   * Faz uma requisição HTTP ao backend
   */
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Adicionar headers padrão
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    };
    
    // Adicionar token de autenticação se disponível
    const accessToken = tokenStorage.getAccessToken();
    if (accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
    }
    
    const config: RequestInit = {
      ...options,
      headers,
    };
    
    let response = await fetch(url, config);
    
    // Se receber 401, tentar refresh do token
    if (response.status === 401 && !endpoint.includes('/auth/')) {
      if (!isRefreshing) {
        isRefreshing = true;
        const newToken = await refreshAccessToken();
        isRefreshing = false;
        
        if (newToken) {
          onTokenRefreshed(newToken);
          // Retry a requisição original com o novo token
          (headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
          response = await fetch(url, { ...config, headers });
        } else {
          // Refresh falhou, redirecionar para login
          this.redirectToLogin();
          throw new Error('Sessão expirada. Faça login novamente.');
        }
      } else {
        // Aguardar o refresh em andamento
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh(async (token) => {
            (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
            try {
              const retryResponse = await fetch(url, { ...config, headers });
              const data = await retryResponse.json();
              resolve(data);
            } catch (error) {
              reject(error);
            }
          });
        });
      }
    }
    
    // Parsear resposta
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Erro desconhecido' }));
      const error: ApiError = {
        detail: errorData.detail || 'Erro na requisição',
        status: response.status,
      };
      throw error;
    }
    
    // Verificar se a resposta tem conteúdo
    const text = await response.text();
    if (!text) {
      return {} as T;
    }
    
    return JSON.parse(text);
  }
  
  /**
   * Redireciona para a página de login
   */
  private redirectToLogin(): void {
    if (typeof window !== 'undefined') {
      tokenStorage.clearTokens();
      window.location.href = '/';
    }
  }
  
  // Métodos de conveniência
  
  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }
  
  async post<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
  
  async put<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
  
  async patch<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
  
  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
  
  /**
   * Upload de arquivo
   */
  async uploadFile<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, string>
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }
    
    const headers: HeadersInit = {};
    const accessToken = tokenStorage.getAccessToken();
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Erro no upload' }));
      throw { detail: errorData.detail, status: response.status } as ApiError;
    }
    
    return response.json();
  }
}

// Instância singleton do cliente
export const apiClient = new ApiClient(API_BASE_URL);

export default apiClient;
