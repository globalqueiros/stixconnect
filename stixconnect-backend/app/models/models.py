from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base

class UserRole(str, enum.Enum):
    """14 roles de usuário do sistema StixConnect"""
    # Roles administrativas
    ADMIN = "admin"
    SUPERVISOR = "supervisor"
    
    # Roles clínicas principais
    DOCTOR = "doctor"
    NURSE = "nurse"
    RECEPTIONIST = "receptionist"
    
    # Roles de profissionais de saúde especializados
    PHYSIOTHERAPIST = "physiotherapist"
    NUTRITIONIST = "nutritionist"
    PSYCHOLOGIST = "psychologist"
    SPEECH_THERAPIST = "speech_therapist"
    ACUPUNCTURIST = "acupuncturist"
    CLINICAL_PSYPEDAGOGIST = "clinical_psypedagogist"
    
    # Outras roles
    HAIRDRESSER = "hairdresser"
    CAREGIVER = "caregiver"
    PATIENT = "patient"

class ConsultaStatus(str, enum.Enum):
    AGUARDANDO = "aguardando"
    EM_TRIAGEM = "em_triagem"
    AGUARDANDO_MEDICO = "aguardando_medico"
    EM_ATENDIMENTO = "em_atendimento"
    FINALIZADA = "finalizada"
    CANCELADA = "cancelada"

class ConsultaTipo(str, enum.Enum):
    URGENTE = "urgente"
    AGENDADA = "agendada"

class ClassificacaoUrgencia(str, enum.Enum):
    BAIXA = "baixa"
    MEDIA = "media"
    ALTA = "alta"
    CRITICA = "critica"

class AvailabilityStatus(str, enum.Enum):
    """Status de disponibilidade de profissionais para roteamento"""
    ONLINE = "online"
    BUSY = "busy"
    OFFLINE = "offline"


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    senha_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    telefone = Column(String(20))
    cpf = Column(String(14), unique=True, index=True)
    data_nascimento = Column(DateTime)
    ativo = Column(Boolean, default=True)
    # Disponibilidade para roteamento em tempo real
    disponibilidade = Column(Enum(AvailabilityStatus), default=AvailabilityStatus.ONLINE, nullable=False)
    pacientes_atuais = Column(Integer, default=0, nullable=False)
    limite_pacientes = Column(Integer, default=3, nullable=False)
    
    # Refresh token para renovação de sessão
    refresh_token = Column(String(512), nullable=True)
    refresh_token_expires = Column(DateTime, nullable=True)
    
    # Campos adicionais para perfil
    num_prontuario = Column(String(50), unique=True, index=True, nullable=True)
    endereco = Column(String(512), nullable=True)
    especialidade = Column(String(255), nullable=True)  # Para médicos/profissionais
    crm = Column(String(50), nullable=True)  # Para médicos
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    consultas_paciente = relationship("Consulta", back_populates="paciente", foreign_keys="Consulta.paciente_id")
    consultas_enfermeira = relationship("Consulta", back_populates="enfermeira", foreign_keys="Consulta.enfermeira_id")
    consultas_medico = relationship("Consulta", back_populates="medico", foreign_keys="Consulta.medico_id")
    triagens = relationship("Triagem", back_populates="paciente")

class Consulta(Base):
    __tablename__ = "consultas"
    
    id = Column(Integer, primary_key=True, index=True)
    paciente_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    enfermeira_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    medico_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    tipo = Column(Enum(ConsultaTipo), nullable=False)
    status = Column(Enum(ConsultaStatus), default=ConsultaStatus.AGUARDANDO)
    classificacao_urgencia = Column(Enum(ClassificacaoUrgencia))
    
    data_agendamento = Column(DateTime, nullable=True)
    data_inicio = Column(DateTime, nullable=True)
    data_fim = Column(DateTime, nullable=True)
    duracao_minutos = Column(Integer, nullable=True)
    
    zoom_meeting_id = Column(String(255), unique=True)
    zoom_join_url = Column(String(512))
    zoom_start_url = Column(String(512))
    zoom_password = Column(String(50))
    
    observacoes = Column(Text)
    diagnostico = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    paciente = relationship("User", back_populates="consultas_paciente", foreign_keys=[paciente_id])
    enfermeira = relationship("User", back_populates="consultas_enfermeira", foreign_keys=[enfermeira_id])
    medico = relationship("User", back_populates="consultas_medico", foreign_keys=[medico_id])
    triagem = relationship("Triagem", back_populates="consulta", uselist=False)

class Triagem(Base):
    __tablename__ = "triagens"
    
    id = Column(Integer, primary_key=True, index=True)
    consulta_id = Column(Integer, ForeignKey("consultas.id"), nullable=False)
    paciente_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    sintomas = Column(Text, nullable=False)
    temperatura = Column(String(10))
    pressao_arterial = Column(String(20))
    frequencia_cardiaca = Column(String(10))
    saturacao_oxigenio = Column(String(10))
    dor_escala = Column(Integer)
    historico_medico = Column(Text)
    medicamentos_uso = Column(Text)
    alergias = Column(Text)
    
    classificacao_automatica = Column(Enum(ClassificacaoUrgencia))
    classificacao_enfermeira = Column(Enum(ClassificacaoUrgencia))
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    consulta = relationship("Consulta", back_populates="triagem")
    paciente = relationship("User", back_populates="triagens")