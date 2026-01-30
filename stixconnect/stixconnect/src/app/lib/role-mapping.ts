/**
 * Mapeamento de roles entre frontend (português) e backend (inglês)
 */

// Roles disponíveis no backend
export type BackendRole = 
  | 'admin'
  | 'supervisor'
  | 'doctor'
  | 'nurse'
  | 'receptionist'
  | 'physiotherapist'
  | 'nutritionist'
  | 'psychologist'
  | 'speech_therapist'
  | 'acupuncturist'
  | 'clinical_psypedagogist'
  | 'hairdresser'
  | 'caregiver'
  | 'patient';

// Roles em português usadas no frontend
export type FrontendRole = 
  | 'Administrador'
  | 'Supervisor'
  | 'Médico'
  | 'Enfermeiro'
  | 'Atendente'
  | 'Fisioterapeuta'
  | 'Nutricionista'
  | 'Psicóloga'
  | 'Fonoaudióloga'
  | 'Acupuntura'
  | 'Psicopedagoga_clinica'
  | 'Cabeleireiro'
  | 'Cuidador'
  | 'Paciente';

// Mapeamento de português para inglês
const ROLE_PT_TO_EN: Record<FrontendRole, BackendRole> = {
  'Administrador': 'admin',
  'Supervisor': 'supervisor',
  'Médico': 'doctor',
  'Enfermeiro': 'nurse',
  'Atendente': 'receptionist',
  'Fisioterapeuta': 'physiotherapist',
  'Nutricionista': 'nutritionist',
  'Psicóloga': 'psychologist',
  'Fonoaudióloga': 'speech_therapist',
  'Acupuntura': 'acupuncturist',
  'Psicopedagoga_clinica': 'clinical_psypedagogist',
  'Cabeleireiro': 'hairdresser',
  'Cuidador': 'caregiver',
  'Paciente': 'patient',
};

// Mapeamento de inglês para português
const ROLE_EN_TO_PT: Record<BackendRole, FrontendRole> = {
  'admin': 'Administrador',
  'supervisor': 'Supervisor',
  'doctor': 'Médico',
  'nurse': 'Enfermeiro',
  'receptionist': 'Atendente',
  'physiotherapist': 'Fisioterapeuta',
  'nutritionist': 'Nutricionista',
  'psychologist': 'Psicóloga',
  'speech_therapist': 'Fonoaudióloga',
  'acupuncturist': 'Acupuntura',
  'clinical_psypedagogist': 'Psicopedagoga_clinica',
  'hairdresser': 'Cabeleireiro',
  'caregiver': 'Cuidador',
  'patient': 'Paciente',
};

// Roles administrativas (acesso total)
export const ADMIN_ROLES: BackendRole[] = ['admin', 'supervisor'];

// Roles clínicas (podem atender pacientes)
export const CLINICAL_ROLES: BackendRole[] = [
  'doctor',
  'nurse',
  'physiotherapist',
  'nutritionist',
  'psychologist',
  'speech_therapist',
  'acupuncturist',
  'clinical_psypedagogist',
];

// Roles de suporte (atendimento não clínico)
export const SUPPORT_ROLES: BackendRole[] = [
  'receptionist',
  'hairdresser',
  'caregiver',
];

/**
 * Converte role do frontend (português) para backend (inglês)
 */
export function mapFrontendRole(rolePt: string): BackendRole {
  return ROLE_PT_TO_EN[rolePt as FrontendRole] || 'patient';
}

/**
 * Converte role do backend (inglês) para frontend (português)
 */
export function mapBackendRole(roleEn: string): FrontendRole {
  return ROLE_EN_TO_PT[roleEn as BackendRole] || 'Paciente';
}

/**
 * Verifica se a role tem permissões administrativas
 */
export function isAdminRole(role: BackendRole | string): boolean {
  return ADMIN_ROLES.includes(role as BackendRole);
}

/**
 * Verifica se a role é clínica
 */
export function isClinicalRole(role: BackendRole | string): boolean {
  return CLINICAL_ROLES.includes(role as BackendRole);
}

/**
 * Verifica se a role pode acessar determinada área
 */
export function canAccessArea(role: BackendRole | string, area: 'admin' | 'clinical' | 'patient'): boolean {
  switch (area) {
    case 'admin':
      return isAdminRole(role);
    case 'clinical':
      return isClinicalRole(role) || isAdminRole(role);
    case 'patient':
      return true; // Todos podem acessar área de paciente
    default:
      return false;
  }
}

/**
 * Retorna o caminho do dashboard para cada role
 */
export function getDashboardPath(role: BackendRole | string): string {
  const roleMap: Record<BackendRole, string> = {
    'admin': '/administrador',
    'supervisor': '/supervisor',
    'doctor': '/medico',
    'nurse': '/enfermagem',
    'receptionist': '/atendente',
    'physiotherapist': '/fisioterapeuta',
    'nutritionist': '/nutricionista',
    'psychologist': '/psicologa',
    'speech_therapist': '/fonoaudiologa',
    'acupuncturist': '/acupuntura',
    'clinical_psypedagogist': '/psicopedagoga_clinica',
    'hairdresser': '/cabeleireiro',
    'caregiver': '/cuidador',
    'patient': '/paciente',
  };
  
  return roleMap[role as BackendRole] || '/';
}

/**
 * Retorna lista de todas as roles disponíveis
 */
export function getAllRoles(): { value: BackendRole; label: FrontendRole }[] {
  return Object.entries(ROLE_EN_TO_PT).map(([value, label]) => ({
    value: value as BackendRole,
    label: label as FrontendRole,
  }));
}

/**
 * Retorna ícone para cada role (para uso em UI)
 */
export function getRoleIcon(role: BackendRole | string): string {
  const iconMap: Record<BackendRole, string> = {
    'admin': '👨‍💼',
    'supervisor': '👨‍💻',
    'doctor': '👨‍⚕️',
    'nurse': '👩‍⚕️',
    'receptionist': '👨‍💼',
    'physiotherapist': '🏃',
    'nutritionist': '🥗',
    'psychologist': '🧠',
    'speech_therapist': '🗣️',
    'acupuncturist': '📍',
    'clinical_psypedagogist': '📚',
    'hairdresser': '💇',
    'caregiver': '🤝',
    'patient': '🏥',
  };
  
  return iconMap[role as BackendRole] || '👤';
}
