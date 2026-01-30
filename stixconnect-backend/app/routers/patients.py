"""
Router de Pacientes
CRUD completo para gerenciamento de pacientes
"""

from typing import Optional, List
from datetime import datetime
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.core.database import get_db
from app.core.security import get_current_user, require_clinical, get_password_hash
from app.models.models import User, UserRole
from app.schemas.patients import PatientCreate, PatientUpdate, PatientResponse

router = APIRouter(prefix="/patients", tags=["Pacientes"])


def generate_prontuario() -> str:
    """Gera um número de prontuário único"""
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    unique_id = str(uuid.uuid4())[:8].upper()
    return f"STIX-{timestamp}-{unique_id}"


@router.get("/", response_model=dict)
def list_patients(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lista pacientes com paginação e busca opcional"""
    
    query = db.query(User).filter(User.role == UserRole.PATIENT)
    
    # Busca por nome, email ou CPF
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                User.nome.ilike(search_term),
                User.email.ilike(search_term),
                User.cpf.ilike(search_term),
                User.num_prontuario.ilike(search_term)
            )
        )
    
    # Contagem total
    total = query.count()
    
    # Paginação
    patients = query.offset(skip).limit(limit).all()
    
    return {
        "items": [PatientResponse.model_validate(p) for p in patients],
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Busca um paciente por ID"""
    
    patient = db.query(User).filter(
        User.id == patient_id,
        User.role == UserRole.PATIENT
    ).first()
    
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paciente não encontrado"
        )
    
    return patient


@router.get("/prontuario/{num_prontuario}", response_model=PatientResponse)
def get_patient_by_prontuario(
    num_prontuario: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Busca um paciente por número de prontuário"""
    
    patient = db.query(User).filter(
        User.num_prontuario == num_prontuario,
        User.role == UserRole.PATIENT
    ).first()
    
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paciente não encontrado"
        )
    
    return patient


@router.post("/", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_patient(
    patient_data: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_clinical)
):
    """Cria um novo paciente"""
    
    # Verificar se email já existe
    existing_email = db.query(User).filter(User.email == patient_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email já cadastrado"
        )
    
    # Verificar se CPF já existe
    if patient_data.cpf:
        existing_cpf = db.query(User).filter(User.cpf == patient_data.cpf).first()
        if existing_cpf:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CPF já cadastrado"
            )
    
    # Gerar número de prontuário único
    num_prontuario = generate_prontuario()
    while db.query(User).filter(User.num_prontuario == num_prontuario).first():
        num_prontuario = generate_prontuario()
    
    # Criar paciente
    new_patient = User(
        nome=patient_data.nome,
        email=patient_data.email,
        senha_hash=get_password_hash(patient_data.senha),
        role=UserRole.PATIENT,  # Sempre paciente
        telefone=patient_data.telefone,
        cpf=patient_data.cpf,
        data_nascimento=patient_data.data_nascimento,
        num_prontuario=num_prontuario,
        ativo=True
    )
    
    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)
    
    return new_patient


@router.put("/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: int,
    patient_data: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_clinical)
):
    """Atualiza um paciente"""
    
    patient = db.query(User).filter(
        User.id == patient_id,
        User.role == UserRole.PATIENT
    ).first()
    
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paciente não encontrado"
        )
    
    # Atualizar campos
    update_data = patient_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(patient, field, value)
    
    patient.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(patient)
    
    return patient


@router.patch("/{patient_id}", response_model=PatientResponse)
def patch_patient(
    patient_id: int,
    patient_data: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_clinical)
):
    """Atualiza parcialmente um paciente"""
    return update_patient(patient_id, patient_data, db, current_user)


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_clinical)
):
    """Desativa um paciente (soft delete)"""
    
    patient = db.query(User).filter(
        User.id == patient_id,
        User.role == UserRole.PATIENT
    ).first()
    
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paciente não encontrado"
        )
    
    patient.ativo = False
    patient.updated_at = datetime.utcnow()
    db.commit()
    
    return None
