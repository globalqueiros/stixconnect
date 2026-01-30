from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import (
    verify_password, create_access_token, get_password_hash,
    create_refresh_token, get_current_user
)
from app.core.config import settings
from app.models.models import User
from app.schemas.schemas import (
    Token, LoginRequest, UserCreate, UserResponse,
    RefreshTokenRequest, LoginResponse
)

router = APIRouter(prefix="/auth", tags=["Autenticação"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Registra um novo usuário"""
    
    # Verifica se email já existe
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email já cadastrado"
        )
    
    # Verifica se CPF já existe
    if user_data.cpf:
        existing_cpf = db.query(User).filter(User.cpf == user_data.cpf).first()
        if existing_cpf:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CPF já cadastrado"
            )
    
    # Cria novo usuário
    new_user = User(
        nome=user_data.nome,
        email=user_data.email,
        senha_hash=get_password_hash(user_data.senha),
        role=user_data.role,
        telefone=user_data.telefone,
        cpf=user_data.cpf,
        data_nascimento=user_data.data_nascimento,
        ativo=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


@router.post("/login", response_model=LoginResponse)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """Autentica um usuário e retorna tokens JWT (access + refresh)"""
    
    user = db.query(User).filter(User.email == credentials.email).first()
    
    # Não revelar se o email existe ou não (segurança)
    if not user or not verify_password(credentials.senha, user.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email / matrícula ou senha incorretos.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.ativo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo"
        )
    
    # Criar access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": user.email,
            "role": user.role.value,
            "user_id": user.id
        },
        expires_delta=access_token_expires
    )
    
    # Criar refresh token
    refresh_token, refresh_expires = create_refresh_token()
    
    # Salvar refresh token no banco
    user.refresh_token = refresh_token
    user.refresh_token_expires = refresh_expires
    db.commit()
    
    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user)
    )


@router.post("/refresh", response_model=Token)
def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Renova o access token usando um refresh token válido"""
    
    # Buscar usuário pelo refresh token
    user = db.query(User).filter(User.refresh_token == request.refresh_token).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token inválido"
        )
    
    # Verificar se o refresh token expirou
    if user.refresh_token_expires and user.refresh_token_expires < datetime.utcnow():
        # Limpar refresh token expirado
        user.refresh_token = None
        user.refresh_token_expires = None
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expirado. Faça login novamente."
        )
    
    if not user.ativo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo"
        )
    
    # Criar novo access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": user.email,
            "role": user.role.value,
            "user_id": user.id
        },
        expires_delta=access_token_expires
    )
    
    # Opcionalmente, gerar novo refresh token (rotation)
    new_refresh_token, new_refresh_expires = create_refresh_token()
    user.refresh_token = new_refresh_token
    user.refresh_token_expires = new_refresh_expires
    db.commit()
    
    return Token(
        access_token=access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Invalida o refresh token do usuário (logout)"""
    
    current_user.refresh_token = None
    current_user.refresh_token_expires = None
    db.commit()
    
    return {"message": "Logout realizado com sucesso"}


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Retorna informações do usuário autenticado"""
    return current_user