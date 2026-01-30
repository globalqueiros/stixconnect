/**
 * Serviço de Zoom
 * Gerencia criação e acesso a reuniões Zoom
 */

import apiClient from '../lib/api-client';

export interface ZoomMeeting {
  meeting_id: string;
  join_url: string;
  start_url: string;
  password: string;
}

export interface ZoomParticipant {
  name: string;
  email?: string;
}

export const zoomService = {
  /**
   * Cria uma reunião Zoom para uma consulta
   */
  async createMeeting(consultaId: number): Promise<ZoomMeeting> {
    return apiClient.post<ZoomMeeting>(`/consultas/${consultaId}/create-zoom`);
  },
  
  /**
   * Obtém informações da reunião de uma consulta
   */
  async getMeetingInfo(consultaId: number): Promise<ZoomMeeting | null> {
    try {
      return await apiClient.get<ZoomMeeting>(`/consultas/${consultaId}/zoom`);
    } catch (error) {
      return null;
    }
  },
  
  /**
   * Gera URL de entrada para participante
   * @param meetingId ID da reunião
   * @param password Senha da reunião
   * @param participant Dados do participante
   */
  getJoinUrl(
    meetingId: string,
    password: string,
    participant: ZoomParticipant
  ): string {
    const baseUrl = 'https://zoom.us/j';
    const encodedName = encodeURIComponent(participant.name);
    return `${baseUrl}/${meetingId}?pwd=${password}&uname=${encodedName}`;
  },
  
  /**
   * Abre a reunião Zoom em nova aba
   */
  openMeeting(joinUrl: string): void {
    if (typeof window !== 'undefined') {
      window.open(joinUrl, '_blank', 'noopener,noreferrer');
    }
  },
  
  /**
   * Verifica se a reunião está ativa
   */
  async isMeetingActive(consultaId: number): Promise<boolean> {
    try {
      const meeting = await this.getMeetingInfo(consultaId);
      return !!meeting?.meeting_id;
    } catch {
      return false;
    }
  },
  
  /**
   * Encerra a reunião (apenas host)
   */
  async endMeeting(consultaId: number): Promise<void> {
    return apiClient.post(`/consultas/${consultaId}/end-zoom`);
  },
};

export default zoomService;
