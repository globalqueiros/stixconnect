/**
 * Serviço de Arquivos
 * Gerencia upload e download de arquivos via S3
 */

import apiClient from '../lib/api-client';

export interface FileUploadResponse {
  url: string;
  filename: string;
  content_type: string;
  size: number;
}

export interface PatientFile {
  id: number;
  patient_id: number;
  filename: string;
  original_name: string;
  url: string;
  content_type: string;
  size: number;
  uploaded_by: number;
  uploaded_at: string;
}

// Tipos de arquivo permitidos
export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/dicom',
  'application/dicom',
];

// Extensões permitidas
export const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.dcm'];

// Tamanho máximo (10MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const fileService = {
  /**
   * Faz upload de um arquivo
   */
  async uploadFile(
    file: File,
    patientId?: number
  ): Promise<FileUploadResponse> {
    // Validar tipo de arquivo
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      throw new Error(
        `Tipo de arquivo não permitido. Tipos aceitos: ${ALLOWED_EXTENSIONS.join(', ')}`
      );
    }
    
    // Validar tamanho
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(
        `Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`
      );
    }
    
    const additionalData: Record<string, string> = {};
    if (patientId) {
      additionalData.patient_id = patientId.toString();
    }
    
    return apiClient.uploadFile<FileUploadResponse>(
      '/files/upload',
      file,
      additionalData
    );
  },
  
  /**
   * Lista arquivos de um paciente
   */
  async getPatientFiles(patientId: number): Promise<PatientFile[]> {
    return apiClient.get<PatientFile[]>(`/files/patient/${patientId}`);
  },
  
  /**
   * Deleta um arquivo
   */
  async deleteFile(fileId: number): Promise<void> {
    return apiClient.delete(`/files/${fileId}`);
  },
  
  /**
   * Obtém URL de download assinada (temporária)
   */
  async getDownloadUrl(fileId: number): Promise<string> {
    const response = await apiClient.get<{ url: string }>(`/files/${fileId}/download-url`);
    return response.url;
  },
  
  /**
   * Abre arquivo em nova aba
   */
  openFile(url: string): void {
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  },
  
  /**
   * Valida se o arquivo é permitido
   */
  isValidFile(file: File): { valid: boolean; error?: string } {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Tipo não permitido. Use: ${ALLOWED_EXTENSIONS.join(', ')}`,
      };
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `Arquivo muito grande. Máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      };
    }
    
    return { valid: true };
  },
  
  /**
   * Formata tamanho do arquivo para exibição
   */
  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  },
};

export default fileService;
