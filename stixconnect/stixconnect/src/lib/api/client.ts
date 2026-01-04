import axios, { AxiosError } from 'axios';

// Interface para erros da API
export interface APIError {
  message: string;
  code?: string;
  status?: number;
}

// Tratamento centralizado de erros
export const handleAPIError = (error: AxiosError): APIError => {
  if (error.response?.status === 401) {
    // Limpar tokens e redirecionar
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return { message: 'Sessão expirada', code: 'SESSION_EXPIRED', status: 401 };
  }

  if (error.response?.status === 429) {
    return { message: 'Muitas tentativas. Tente novamente.', code: 'RATE_LIMIT', status: 429 };
  }

  return {
    message: error.response?.data?.message || error.response?.data?.error || 'Erro ao conectar com o servidor',
    code: error.code,
    status: error.response?.status
  };
};

// Configuração centralizada do Axios
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000, // 10 segundos timeout
});

// Interceptor de requisição para autenticação
api.interceptors.request.use((config) => {
  // Adicionar token de autenticação se existir
  const token = typeof window !== 'undefined' 
    ? localStorage.getItem('auth_token')
    : null;
    
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

// Interceptor de resposta para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Lançar erro formatado
    throw handleAPIError(error);
  }
);

export default api;