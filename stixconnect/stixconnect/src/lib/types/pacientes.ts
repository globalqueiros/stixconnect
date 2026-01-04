// Tipos para pacientes
export interface Paciente {
  id: number;
  numProntuario?: string;
  nome: string;
  dataNascimento?: string;
  email?: string;
  cpf?: string;
  wappNumber?: string;
  estadocivil?: string;
  genero?: string;
  endereco?: string;
  bairro?: string;
  complemento?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  nomePlano?: string;
}

export interface PacienteClinico {
  paciente_id: number;
  alergias?: string;
  medicacoes?: string;
  condicoes_especiais?: string;
  habitos?: string;
  saude_mental?: string;
  vacinacao?: string;
  observacoes?: string;
}

export interface PacienteCompleto extends Paciente {
  clinicoHistorico?: string;
  clinicoAlergias?: string;
  clinicoMedicacoes?: string;
  clinicoCondicoes?: string;
  clinicoHabitos?: string;
  clinicoSaudeMental?: string;
  clinicoVacinacao?: string;
  clinicoObservacoes?: string;
}

export interface PacienteSearchResult {
  results: Paciente[];
  total: number;
  totalPages: number;
}