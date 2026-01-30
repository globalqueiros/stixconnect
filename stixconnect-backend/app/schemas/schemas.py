from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from app.models.models import UserRole, ConsultaStatus, ConsultaTipo, ClassificacaoUrgencia, AvailabilityStatus

# User Schemas
class UserBase(BaseModel):
    nome: str
    email: EmailStr
    role: UserRole
    telefone: Optional[str] = None
    cpf: Optional[str] = None
    data_nascimento: Optional[datetime] = None

class UserCreate(UserBase):
    senha: str

class UserCreateAdmin(BaseModel):
    """Schema para criação de usuários por administradores"""
    nome: str = Field(..., min_length=1, description="Nome completo do usuário")
    email: EmailStr = Field(..., description="Email único do usuário")
    senha: str = Field(..., min_length=8, description="Senha do usuário (mínimo 8 caracteres)")
    role: UserRole = Field(..., description="Role/perfil do usuário")
    telefone: Optional[str] = Field(None, description="Telefone de contato")
    cpf: Optional[str] = Field(None, description="CPF do usuário (único)")
    data_nascimento: Optional[datetime] = Field(None, description="Data de nascimento")
    especialidade: Optional[str] = Field(None, description="Especialidade (para médicos/profissionais)")
    crm: Optional[str] = Field(None, description="CRM (para médicos)")
    endereco: Optional[str] = Field(None, description="Endereço completo")

class UserUpdate(BaseModel):
    nome: Optional[str] = None
    telefone: Optional[str] = None
    data_nascimento: Optional[datetime] = None
    ativo: Optional[bool] = None

class UserResponse(UserBase):
    id: int
    ativo: bool
    created_at: datetime
    # Campos de disponibilidade para roteamento em tempo real
    disponibilidade: Optional[AvailabilityStatus] = None
    pacientes_atuais: Optional[int] = None
    limite_pacientes: Optional[int] = None
    codPerfil: Optional[int] = None
    nomePerfil: Optional[str] = None
    rota: Optional[str] = None
    
    class Config:
        from_attributes = True

# Auth Schemas
class Token(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: Optional[int] = None  # segundos até expiração

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
    user_id: Optional[int] = None

class LoginRequest(BaseModel):
    email: str = Field(..., description="Email ou matrícula do usuário")
    senha: str = Field(..., description="Senha do usuário")

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse

# Triagem Schemas
class TriagemBase(BaseModel):
    sintomas: str
    temperatura: Optional[str] = None
    pressao_arterial: Optional[str] = None
    frequencia_cardiaca: Optional[str] = None
    saturacao_oxigenio: Optional[str] = None
    dor_escala: Optional[int] = Field(None, ge=0, le=10)
    historico_medico: Optional[str] = None
    medicamentos_uso: Optional[str] = None
    alergias: Optional[str] = None

class TriagemCreate(TriagemBase):
    pass

class TriagemUpdate(BaseModel):
    classificacao_enfermeira: Optional[ClassificacaoUrgencia] = None
    sintomas: Optional[str] = None
    temperatura: Optional[str] = None
    pressao_arterial: Optional[str] = None
    frequencia_cardiaca: Optional[str] = None
    saturacao_oxigenio: Optional[str] = None

class TriagemResponse(TriagemBase):
    id: int
    consulta_id: int
    paciente_id: int
    classificacao_automatica: Optional[ClassificacaoUrgencia]
    classificacao_enfermeira: Optional[ClassificacaoUrgencia]
    created_at: datetime
    
    class Config:
        from_attributes = True

# Consulta Schemas
class ConsultaBase(BaseModel):
    tipo: ConsultaTipo
    data_agendamento: Optional[datetime] = None

class ConsultaCreate(ConsultaBase):
    triagem: Optional[TriagemCreate] = None

class ConsultaUpdate(BaseModel):
    status: Optional[ConsultaStatus] = None
    enfermeira_id: Optional[int] = None
    medico_id: Optional[int] = None
    data_inicio: Optional[datetime] = None
    data_fim: Optional[datetime] = None
    observacoes: Optional[str] = None
    diagnostico: Optional[str] = None

class ConsultaResponse(ConsultaBase):
    id: int
    paciente_id: int
    enfermeira_id: Optional[int]
    medico_id: Optional[int]
    status: ConsultaStatus
    classificacao_urgencia: Optional[ClassificacaoUrgencia]
    data_inicio: Optional[datetime]
    data_fim: Optional[datetime]
    duracao_minutos: Optional[int]
    zoom_meeting_id: Optional[str]
    zoom_join_url: Optional[str]
    zoom_password: Optional[str]
    created_at: datetime
    triagem: Optional[TriagemResponse] = None
    
    class Config:
        from_attributes = True

class ConsultaDetailResponse(ConsultaResponse):
    paciente: UserResponse
    enfermeira: Optional[UserResponse] = None
    medico: Optional[UserResponse] = None

# Zoom Schemas
class ZoomMeetingCreate(BaseModel):
    topic: str
    duration: int = 60
    timezone: str = "Africa/Luanda"

class ZoomMeetingResponse(BaseModel):
    meeting_id: str
    join_url: str
    start_url: str
    password: str

# Patient Schemas
class PatientBase(BaseModel):
    num_prontuario: str
    data_nascimento: datetime
    telefone: Optional[str] = None
    cpf: Optional[str] = None

class PatientCreate(PatientBase):
    user_id: int

class PatientUpdate(BaseModel):
    num_prontuario: Optional[str] = None
    data_nascimento: Optional[datetime] = None
    telefone: Optional[str] = None
    cpf: Optional[str] = None

class PatientResponse(PatientBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    user: UserResponse
    
    class Config:
        from_attributes = True

# User List Response
class UserListResponse(BaseModel):
    users: list[UserResponse]
    total: int