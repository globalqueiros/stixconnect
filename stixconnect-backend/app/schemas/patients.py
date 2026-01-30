"""
Schemas Pydantic para endpoints de pacientes
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from app.models.models import UserRole


class PatientBase(BaseModel):
    nome: str
    email: EmailStr
    telefone: Optional[str] = None
    cpf: Optional[str] = None
    data_nascimento: Optional[datetime] = None
    num_prontuario: Optional[str] = None
    endereco: Optional[str] = None


class PatientCreate(PatientBase):
    senha: str = Field(..., min_length=8, description="Senha do paciente (mínimo 8 caracteres)")


class PatientUpdate(BaseModel):
    nome: Optional[str] = None
    telefone: Optional[str] = None
    data_nascimento: Optional[datetime] = None
    endereco: Optional[str] = None
    ativo: Optional[bool] = None


class PatientResponse(PatientBase):
    id: int
    role: UserRole
    ativo: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
