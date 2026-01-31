"""
Router de Usuários
Gerenciamento de usuários (admin) e perfil próprio
"""

from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from pydantic import BaseModel
from app.core.database import get_db
from app.core.security import (
    get_current_user, require_admin, get_password_hash, verify_password
)
from app.models.models import User, UserRole, AvailabilityStatus
from app.schemas.schemas import UserResponse, UserUpdate, UserCreateAdmin

router = APIRouter(prefix="/users", tags=["Usuários"])


class PasswordChange(BaseModel):
    senha_atual: str
    nova_senha: str


class AvailabilityUpdate(BaseModel):
    """Payload para atualização de disponibilidade do usuário atual."""
    disponibilidade: AvailabilityStatus


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Retorna o perfil do usuário autenticado"""
    return current_user


@router.put("/me", response_model=UserResponse)
def update_current_user_profile(
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Atualiza o perfil do usuário autenticado"""
    
    # Usuário não pode alterar sua própria role ou status ativo
    update_data = user_data.model_dump(exclude_unset=True)
    update_data.pop('ativo', None)  # Remover se presente
    
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    
    return current_user


@router.put("/me/availability", response_model=UserResponse)
def update_current_user_availability(
    availability_data: AvailabilityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Atualiza o status de disponibilidade do usuário autenticado
    (online / busy / offline) para roteamento em tempo real.
    """
    current_user.disponibilidade = availability_data.disponibilidade
    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)

    return current_user


@router.post("/me/change-password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    password_data: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Altera a senha do usuário autenticado"""
    
    # Verificar senha atual
    if not verify_password(password_data.senha_atual, current_user.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Senha atual incorreta"
        )
    
    # Validar nova senha
    if len(password_data.nova_senha) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A nova senha deve ter pelo menos 8 caracteres"
        )
    
    # Atualizar senha
    current_user.senha_hash = get_password_hash(password_data.nova_senha)
    current_user.updated_at = datetime.utcnow()
    db.commit()
    
    return None


# ============================================
# Endpoints administrativos
# ============================================

admin_router = APIRouter(prefix="/admin/users", tags=["Admin - Usuários"])


# Handler explícito para OPTIONS (preflight CORS)
@admin_router.options("/")
@admin_router.options("/{path:path}")
def options_handler():
    """Handler para requisições OPTIONS (preflight CORS)"""
    return {"message": "OK"}


@admin_router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_data: "UserCreateAdmin",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Cria um novo usuário (admin only)"""
    
    try:
        # Limpar CPF (remover formatação)
        cpf_limpo = None
        if user_data.cpf:
            cpf_limpo = user_data.cpf.replace(".", "").replace("-", "").strip()
            if not cpf_limpo or len(cpf_limpo) < 11:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="CPF inválido. Deve conter pelo menos 11 dígitos."
                )
        
        # Verificar se email já existe
        existing_email = db.query(User).filter(User.email == user_data.email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email já cadastrado"
            )
        
        # Verificar se CPF já existe (se fornecido)
        if cpf_limpo:
            existing_cpf = db.query(User).filter(User.cpf == cpf_limpo).first()
            if existing_cpf:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="CPF já cadastrado"
                )
        
        # Validar senha
        if len(user_data.senha) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A senha deve ter pelo menos 8 caracteres"
            )
        
        # Criar hash da senha
        senha_hash = get_password_hash(user_data.senha)
        
        # Limpar endereço (remover quebras de linha extras)
        endereco_limpo = None
        if user_data.endereco:
            endereco_limpo = user_data.endereco.replace("\n", ", ").strip()
        
        # Criar novo usuário
        new_user = User(
            nome=user_data.nome,
            email=user_data.email,
            senha_hash=senha_hash,
            role=user_data.role,
            telefone=user_data.telefone,
            cpf=cpf_limpo,
            data_nascimento=user_data.data_nascimento,
            especialidade=user_data.especialidade,
            crm=user_data.crm,
            endereco=endereco_limpo,
            ativo=True
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return new_user
        
    except HTTPException:
        # Re-raise HTTPExceptions (já têm status code e mensagem corretos)
        raise
    except Exception as e:
        # Capturar outros erros e retornar mensagem clara
        import traceback
        print(f"Erro ao criar usuário: {e}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro ao criar usuário: {str(e)}"
        )


@admin_router.get("/", response_model=dict)
def list_users(
    skip: Optional[int] = Query(0, ge=0),
    limit: Optional[int] = Query(20, ge=1, le=500),
    role: Optional[str] = None,
    search: Optional[str] = None,
    ativo: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Lista todos os usuários (admin only)"""
    
    # Garantir valores padrão se None
    skip = skip or 0
    limit = limit or 20
    
    query = db.query(User)
    
    # Filtro por role
    if role:
        try:
            role_enum = UserRole(role)
            query = query.filter(User.role == role_enum)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Role inválida: {role}"
            )
    
    # Filtro por status
    if ativo is not None:
        query = query.filter(User.ativo == ativo)
    
    # Busca por nome, email ou CPF
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                User.nome.ilike(search_term),
                User.email.ilike(search_term),
                User.cpf.ilike(search_term)
            )
        )
    
    # Contagem total
    total = query.count()
    
    # Paginação e ordenação
    users = query.order_by(User.nome).offset(skip).limit(limit).all()
    
    return {
        "items": [UserResponse.model_validate(u) for u in users],
        "total": total,
        "skip": skip,
        "limit": limit
    }


@admin_router.get("/available/nurses", response_model=List[UserResponse])
def list_available_nurses(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Lista enfermeiros disponíveis para atendimento (online e abaixo do limite de pacientes).
    """
    nurses = (
        db.query(User)
        .filter(
            User.role == UserRole.NURSE,
            User.ativo.is_(True),
            User.disponibilidade == AvailabilityStatus.ONLINE,
            User.pacientes_atuais < User.limite_pacientes,
        )
        .order_by(User.nome.asc())
        .all()
    )
    return [UserResponse.model_validate(u) for u in nurses]


@admin_router.get("/available/professionals", response_model=List[UserResponse])
def list_available_professionals(
    role: UserRole,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Lista profissionais disponíveis por role (médico, fisioterapeuta, etc.).
    """
    professionals = (
        db.query(User)
        .filter(
            User.role == role,
            User.ativo.is_(True),
            User.disponibilidade == AvailabilityStatus.ONLINE,
        )
        .order_by(User.nome.asc())
        .all()
    )
    return [UserResponse.model_validate(u) for u in professionals]


@admin_router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Busca um usuário por ID (admin only)"""
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    return user


@admin_router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Atualiza um usuário (admin only)"""
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    # Não permitir admin desativar a si mesmo
    update_data = user_data.model_dump(exclude_unset=True)
    if 'ativo' in update_data and update_data['ativo'] is False:
        if user.id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Você não pode desativar sua própria conta"
            )
    
    for field, value in update_data.items():
        setattr(user, field, value)
    
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    
    return user


@admin_router.patch("/{user_id}", response_model=UserResponse)
def patch_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Atualiza parcialmente um usuário (admin only)"""
    return update_user(user_id, user_data, db, current_user)


@admin_router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Desativa um usuário (admin only)"""
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Você não pode desativar sua própria conta"
        )
    
    user.ativo = False
    user.updated_at = datetime.utcnow()
    db.commit()
    
    return None


@admin_router.post("/{user_id}/reactivate", response_model=UserResponse)
def reactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Reativa um usuário desativado (admin only)"""
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    user.ativo = True
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    
    return user
