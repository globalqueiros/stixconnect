from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import User, Consulta, UserRole, ConsultaStatus
from app.schemas.schemas import ConsultaDetailResponse, UserResponse

router = APIRouter(prefix="/admin", tags=["Administração"])

def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Apenas administradores têm acesso")
    return current_user

@router.get("/consultas", response_model=List[ConsultaDetailResponse])
def listar_todas_consultas(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    consultas = db.query(Consulta).order_by(Consulta.created_at.desc()).offset(skip).limit(limit).all()
    return consultas

@router.get("/estatisticas")
def obter_estatisticas(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    hoje = datetime.utcnow().date()
    total_consultas = db.query(func.count(Consulta.id)).scalar()
    consultas_hoje = db.query(func.count(Consulta.id)).filter(func.date(Consulta.created_at) == hoje).scalar()
    return {"total_consultas": total_consultas, "consultas_hoje": consultas_hoje}