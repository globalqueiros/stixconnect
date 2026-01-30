from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import User, Consulta, Triagem, ConsultaStatus, ConsultaTipo, UserRole
from app.schemas.schemas import ConsultaCreate, ConsultaResponse, ConsultaUpdate, ConsultaDetailResponse, TriagemUpdate
from app.services.zoom_service import zoom_service
from app.services.triagem_service import triagem_service
from app.services.routing_service import routing_service

router = APIRouter(prefix="/consultas", tags=["Consultas"])

@router.post("/", response_model=ConsultaResponse, status_code=status.HTTP_201_CREATED)
def criar_consulta(consulta_data: ConsultaCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Apenas pacientes podem criar consultas")
    nova_consulta = Consulta(
        paciente_id=current_user.id,
        tipo=consulta_data.tipo,
        data_agendamento=consulta_data.data_agendamento,
        status=ConsultaStatus.AGUARDANDO,
    )
    db.add(nova_consulta)
    db.flush()
    if consulta_data.tipo == ConsultaTipo.URGENTE and consulta_data.triagem:
        triagem_data = consulta_data.triagem
        classificacao = triagem_service.classificar_urgencia(sintomas=triagem_data.sintomas, dor_escala=triagem_data.dor_escala, temperatura=triagem_data.temperatura, saturacao_oxigenio=triagem_data.saturacao_oxigenio)
        nova_triagem = Triagem(
            consulta_id=nova_consulta.id,
            paciente_id=current_user.id,
            sintomas=triagem_data.sintomas,
            temperatura=triagem_data.temperatura,
            pressao_arterial=triagem_data.pressao_arterial,
            frequencia_cardiaca=triagem_data.frequencia_cardiaca,
            saturacao_oxigenio=triagem_data.saturacao_oxigenio,
            dor_escala=triagem_data.dor_escala,
            historico_medico=triagem_data.historico_medico,
            medicamentos_uso=triagem_data.medicamentos_uso,
            alergias=triagem_data.alergias,
            classificacao_automatica=classificacao,
        )
        nova_consulta.classificacao_urgencia = classificacao
        db.add(nova_triagem)

        # Tentar atribuir automaticamente a um enfermeiro disponível
        enfermeira = routing_service.get_available_nurse(db)
        if enfermeira:
            nova_consulta.enfermeira_id = enfermeira.id
            # Mantém status EM_TRIAGEM lógico para o fluxo de triagem
            nova_consulta.status = ConsultaStatus.EM_TRIAGEM
            enfermeira.pacientes_atuais = (enfermeira.pacientes_atuais or 0) + 1
            db.add(enfermeira)

    db.commit()
    db.refresh(nova_consulta)
    return nova_consulta


@router.get("/queue", response_model=List[ConsultaDetailResponse])
def listar_fila_consultas(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Lista consultas aguardando triagem (fila), ordenadas por urgência e tempo de espera.
    Apenas visível para enfermeiros e admins/supervisores.
    """
    if current_user.role not in [UserRole.NURSE, UserRole.ADMIN, UserRole.SUPERVISOR]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas enfermeiras ou administradores podem ver a fila de consultas",
        )

    query = (
        db.query(Consulta)
        .filter(Consulta.status == ConsultaStatus.AGUARDANDO)
        .order_by(
            Consulta.classificacao_urgencia.desc(),  # crítica/alta primeiro
            Consulta.created_at.asc(),  # mais antigas primeiro
        )
    )
    consultas = query.all()
    return consultas

@router.get("/", response_model=List[ConsultaDetailResponse])
def listar_consultas(status_filter: ConsultaStatus = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Consulta)
    if current_user.role == UserRole.PATIENT:
        query = query.filter(Consulta.paciente_id == current_user.id)
    elif current_user.role == UserRole.NURSE:
        query = query.filter((Consulta.status == ConsultaStatus.AGUARDANDO) | (Consulta.enfermeira_id == current_user.id))
    elif current_user.role == UserRole.DOCTOR:
        query = query.filter((Consulta.status == ConsultaStatus.AGUARDANDO_MEDICO) | (Consulta.medico_id == current_user.id))
    if status_filter:
        query = query.filter(Consulta.status == status_filter)
    consultas = query.order_by(Consulta.created_at.desc()).all()
    return consultas

@router.post("/{consulta_id}/iniciar-atendimento")
def iniciar_atendimento(consulta_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.NURSE:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Apenas enfermeiras podem iniciar atendimento")
    consulta = db.query(Consulta).filter(Consulta.id == consulta_id).first()
    if not consulta:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Consulta não encontrada")
    topic = f"Consulta - {consulta.paciente.nome}"
    meeting = zoom_service.create_meeting(topic=topic, duration=60)
    consulta.zoom_meeting_id = meeting["meeting_id"]
    consulta.zoom_join_url = meeting["join_url"]
    consulta.zoom_start_url = meeting["start_url"]
    consulta.zoom_password = meeting["password"]
    consulta.enfermeira_id = current_user.id
    consulta.status = ConsultaStatus.EM_TRIAGEM
    consulta.data_inicio = datetime.utcnow()
    db.commit()
    db.refresh(consulta)
    return {"message": "Atendimento iniciado", "zoom_join_url": meeting["join_url"], "zoom_password": meeting["password"]}