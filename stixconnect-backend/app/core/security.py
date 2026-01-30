from datetime import datetime, timedelta
from typing import Optional, List
import secrets
import bcrypt
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.models.models import User
from app.models.models import UserRole
from app.schemas.schemas import TokenData

security = HTTPBearer()

# Mapeamento de roles do frontend para backend
ROLE_MAPPING_PT_TO_EN = {
    "Administrador": UserRole.ADMIN,
    "Médico": UserRole.DOCTOR,
    "Enfermeiro": UserRole.NURSE,
    "Atendente": UserRole.RECEPTIONIST,
    "Fisioterapeuta": UserRole.PHYSIOTHERAPIST,
    "Nutricionista": UserRole.NUTRITIONIST,
    "Cabeleireiro": UserRole.HAIRDRESSER,
    "Psicóloga": UserRole.PSYCHOLOGIST,
    "Fonoaudióloga": UserRole.SPEECH_THERAPIST,
    "Acupuntura": UserRole.ACUPUNCTURIST,
    "Psicopedagoga_clinica": UserRole.CLINICAL_PSYPEDAGOGIST,
    "Cuidador": UserRole.CAREGIVER,
    "Paciente": UserRole.PATIENT,
    "Supervisor": UserRole.SUPERVISOR,
}

ROLE_MAPPING_EN_TO_PT = {v: k for k, v in ROLE_MAPPING_PT_TO_EN.items()}

# Roles que podem acessar área administrativa
ADMIN_ROLES = [UserRole.ADMIN, UserRole.SUPERVISOR]

# Roles que podem realizar atendimento
CLINICAL_ROLES = [
    UserRole.DOCTOR, UserRole.NURSE, UserRole.PHYSIOTHERAPIST,
    UserRole.NUTRITIONIST, UserRole.PSYCHOLOGIST, UserRole.SPEECH_THERAPIST,
    UserRole.ACUPUNCTURIST, UserRole.CLINICAL_PSYPEDAGOGIST
]


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica se a senha corresponde ao hash usando bcrypt diretamente"""
    try:
        # Converter senha para bytes
        password_bytes = plain_password.encode('utf-8')
        # Converter hash para bytes se for string
        if isinstance(hashed_password, str):
            hash_bytes = hashed_password.encode('utf-8')
        else:
            hash_bytes = hashed_password
        # Verificar senha
        return bcrypt.checkpw(password_bytes, hash_bytes)
    except Exception as e:
        print(f"Erro ao verificar senha: {e}")
        return False


def get_password_hash(password: str) -> str:
    """Gera hash da senha usando bcrypt diretamente"""
    # Converter senha para bytes
    password_bytes = password.encode('utf-8')
    # Gerar salt e hash
    salt = bcrypt.gensalt()
    hash_bytes = bcrypt.hashpw(password_bytes, salt)
    # Retornar como string
    return hash_bytes.decode('utf-8')


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Cria um access token JWT"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_refresh_token() -> tuple[str, datetime]:
    """Cria um refresh token seguro e sua data de expiração"""
    token = secrets.token_urlsafe(64)
    expires = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return token, expires


def decode_token(token: str) -> TokenData:
    """Decodifica e valida um token JWT"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")
        user_id: int = payload.get("user_id")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido"
            )
        return TokenData(email=email, role=role, user_id=user_id)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado"
        )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Obtém o usuário atual a partir do token JWT"""
    token = credentials.credentials
    token_data = decode_token(token)
    user = db.query(User).filter(User.email == token_data.email).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário não encontrado"
        )
    if not user.ativo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo"
        )
    return user


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Verifica se o usuário está ativo"""
    if not current_user.ativo:
        raise HTTPException(status_code=400, detail="Usuário inativo")
    return current_user


def require_roles(allowed_roles: List[UserRole]):
    """Decorator para verificar se o usuário tem uma das roles permitidas"""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acesso negado. Roles permitidas: {[r.value for r in allowed_roles]}"
            )
        return current_user
    return role_checker


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Verifica se o usuário é administrador"""
    if current_user.role not in ADMIN_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a administradores"
        )
    return current_user


def require_clinical(current_user: User = Depends(get_current_user)) -> User:
    """Verifica se o usuário é profissional clínico"""
    if current_user.role not in CLINICAL_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a profissionais de saúde"
        )
    return current_user


def map_role_pt_to_en(role_pt: str) -> UserRole:
    """Mapeia role do frontend (português) para backend (enum)"""
    return ROLE_MAPPING_PT_TO_EN.get(role_pt, UserRole.PATIENT)


def map_role_en_to_pt(role: UserRole) -> str:
    """Mapeia role do backend (enum) para frontend (português)"""
    return ROLE_MAPPING_EN_TO_PT.get(role, "Paciente")