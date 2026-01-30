/**
 * Helper para migração gradual de API Routes para serviços backend
 * Permite usar tanto a API antiga quanto a nova durante a transição
 */

import { consultationService, patientService, userService } from '../services';
import apiClient from './api-client';

/**
 * Proxy para migração gradual - tenta backend primeiro, fallback para API route
 */
export const migrationHelper = {
  /**
   * Buscar consultas com fallback automático
   */
  async getConsultationsWithFallback(status?: string) {
    try {
      // Tentar backend primeiro
      return await consultationService.getConsultations(
        status as any,
        0,
        100
      );
    } catch (error) {
      console.warn('Backend não disponível, usando API route legada:', error);
      // Fallback para API route antiga
      const response = await fetch('/api/agenda');
      if (!response.ok) throw new Error('Falha ao buscar consultas');
      return await response.json();
    }
  },

  /**
   * Buscar pacientes com fallback
   */
  async getPatientsWithFallback(search?: string) {
    try {
      const response = await patientService.getPatients(0, 100, search);
      return response.items;
    } catch (error) {
      console.warn('Backend não disponível, usando API route legada:', error);
      const response = await fetch('/api/pacientes');
      if (!response.ok) throw new Error('Falha ao buscar pacientes');
      return await response.json();
    }
  },

  /**
   * Buscar usuários com fallback
   */
  async getUsersWithFallback() {
    try {
      const response = await userService.getUsers(0, 100);
      return response.items;
    } catch (error) {
      console.warn('Backend não disponível, usando API route legada:', error);
      const response = await fetch('/api/usuario');
      if (!response.ok) throw new Error('Falha ao buscar usuários');
      return await response.json();
    }
  },
};

/**
 * Wrapper para componentes que ainda usam fetch direto
 * Deprecado: Use os serviços diretamente
 */
export async function fetchWithBackend(url: string, options?: RequestInit) {
  // Se a URL começa com /api e não é login, tentar backend primeiro
  if (url.startsWith('/api/') && !url.includes('/login')) {
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${url.replace('/api', '')}`;
    
    try {
      const response = await apiClient.request(backendUrl, {
        ...options,
        method: options?.method || 'GET',
      });
      return { ok: true, json: () => Promise.resolve(response) };
    } catch (error) {
      // Fallback para API route antiga
      console.warn(`Backend falhou para ${url}, usando API route legada`);
    }
  }
  
  // Usar API route original
  return fetch(url, options);
}
