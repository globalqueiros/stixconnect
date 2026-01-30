/**
 * Exporta todos os serviços do frontend
 */

export { default as authService } from './auth.service';
export { default as patientService } from './patient.service';
export { default as consultationService } from './consultation.service';
export { default as userService } from './user.service';
export { default as zoomService } from './zoom.service';
export { default as fileService } from './file.service';

// Re-exportar tipos
export type { LoginCredentials, RegisterData } from './auth.service';
export type { Patient, PatientCreate, PatientUpdate, PaginatedResponse } from './patient.service';
export type { 
  Consulta, 
  ConsultaCreate, 
  Triagem, 
  TriagemUpdate, 
  ConsultaStatus, 
  ConsultaTipo,
  ClassificacaoUrgencia,
  ZoomMeeting 
} from './consultation.service';
export type { User, UserCreate, UserUpdate, PaginatedUsers } from './user.service';
export type { FileUploadResponse, PatientFile } from './file.service';
