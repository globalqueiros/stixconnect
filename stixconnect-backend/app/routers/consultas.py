from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import User, Consulta, Triagem, ConsultaStatus, ConsultaTipo, UserRole
from app.schemas.schemas import ConsultaCreate, ConsultaResponse, ConsultaUpdate, ConsultaDetailResponse, TriagemUpdate, TransferToProfessionalRequest
from app.services.zoom_service import zoom_service
from app.services.triagem_service import triagem_service
from app.services.routing_service import routing_service

router = APIRouter(prefix="/consultas", tags=["Consultas"])

@router.post("/", response_model=ConsultaResponse, status_code=status.HTTP_201_CREATED)
def criar_consulta(consulta_data: ConsultaCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Cria uma nova consulta e automaticamente atribui a um enfermeiro disponível"""
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
    
    # Se houver dados de triagem, criar triagem inicial
    if consulta_data.triagem:
        triagem_data = consulta_data.triagem
        classificacao = triagem_service.classificar_urgencia(
            sintomas=triagem_data.sintomas,
            dor_escala=triagem_data.dor_escala,
            temperatura=triagem_data.temperatura,
            saturacao_oxigenio=triagem_data.saturacao_oxigenio
        )
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

    # SEMPRE tentar atribuir automaticamente a um enfermeiro disponível
    enfermeira = routing_service.get_available_nurse(db)
    if enfermeira:
        nova_consulta.enfermeira_id = enfermeira.id
        nova_consulta.status = ConsultaStatus.EM_TRIAGEM
        enfermeira.pacientes_atuais = (enfermeira.pacientes_atuais or 0) + 1
        db.add(enfermeira)
    else:
        # Se não houver enfermeiro disponível, mantém status AGUARDANDO
        # O enfermeiro poderá pegar da fila depois
        pass

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
    """Lista consultas baseado no role do usuário"""
    query = db.query(Consulta)
    
    if current_user.role == UserRole.PATIENT:
        # Pacientes veem apenas suas próprias consultas
        query = query.filter(Consulta.paciente_id == current_user.id)
    elif current_user.role == UserRole.NURSE:
        # Enfermeiros veem consultas aguardando triagem OU atribuídas a eles
        query = query.filter(
            (Consulta.status == ConsultaStatus.AGUARDANDO) | 
            (Consulta.status == ConsultaStatus.EM_TRIAGEM) |
            (Consulta.enfermeira_id == current_user.id)
        )
    elif current_user.role in [UserRole.DOCTOR, UserRole.PHYSIOTHERAPIST, UserRole.NUTRITIONIST, 
                                UserRole.PSYCHOLOGIST, UserRole.SPEECH_THERAPIST, UserRole.ACUPUNCTURIST,
                                UserRole.CLINICAL_PSYPEDAGOGIST, UserRole.HAIRDRESSER, UserRole.CAREGIVER]:
        # Profissionais veem consultas aguardando eles OU atribuídas a eles
        query = query.filter(
            (Consulta.status == ConsultaStatus.AGUARDANDO_MEDICO) | 
            (Consulta.medico_id == current_user.id)
        )
    elif current_user.role in [UserRole.ADMIN, UserRole.SUPERVISOR]:
        # Admins e supervisores veem todas as consultas
        pass
    
    if status_filter:
        query = query.filter(Consulta.status == status_filter)
    
    consultas = query.order_by(Consulta.created_at.desc()).all()
    return consultas

@router.get("/{consulta_id}", response_model=ConsultaDetailResponse)
def obter_consulta(
    consulta_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtém detalhes de uma consulta específica"""
    consulta = db.query(Consulta).filter(Consulta.id == consulta_id).first()
    
    if not consulta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consulta não encontrada"
        )
    
    # Verificar permissões baseado no role
    if current_user.role == UserRole.PATIENT:
        if consulta.paciente_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você não tem permissão para ver esta consulta"
            )
    elif current_user.role == UserRole.NURSE:
        if consulta.enfermeira_id != current_user.id and consulta.status != ConsultaStatus.AGUARDANDO:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você não tem permissão para ver esta consulta"
            )
    elif current_user.role in [UserRole.DOCTOR, UserRole.PHYSIOTHERAPIST, UserRole.NUTRITIONIST, 
                                UserRole.PSYCHOLOGIST, UserRole.SPEECH_THERAPIST, UserRole.ACUPUNCTURIST,
                                UserRole.CLINICAL_PSYPEDAGOGIST, UserRole.HAIRDRESSER, UserRole.CAREGIVER]:
        if consulta.medico_id != current_user.id and consulta.status != ConsultaStatus.AGUARDANDO_MEDICO:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você não tem permissão para ver esta consulta"
            )
    # Admins e supervisores podem ver todas
    
    return consulta

@router.post("/{consulta_id}/iniciar-atendimento")
def iniciar_atendimento(consulta_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Inicia atendimento de triagem pelo enfermeiro"""
    if current_user.role != UserRole.NURSE:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Apenas enfermeiras podem iniciar atendimento")
    consulta = db.query(Consulta).filter(Consulta.id == consulta_id).first()
    if not consulta:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Consulta não encontrada")
    
    # Criar reunião Zoom se ainda não existir
    if not consulta.zoom_meeting_id:
        topic = f"Triagem - {consulta.paciente.nome}"
        meeting = zoom_service.create_meeting(topic=topic, duration=60)
        consulta.zoom_meeting_id = meeting["meeting_id"]
        consulta.zoom_join_url = meeting["join_url"]
        consulta.zoom_start_url = meeting["start_url"]
        consulta.zoom_password = meeting["password"]
    
    # Atribuir ao enfermeiro se ainda não estiver atribuído
    if not consulta.enfermeira_id:
        consulta.enfermeira_id = current_user.id
        current_user.pacientes_atuais = (current_user.pacientes_atuais or 0) + 1
        db.add(current_user)
    
    consulta.status = ConsultaStatus.EM_TRIAGEM
    if not consulta.data_inicio:
        consulta.data_inicio = datetime.utcnow()
    
    db.commit()
    db.refresh(consulta)
    return {
        "message": "Atendimento iniciado",
        "zoom_join_url": consulta.zoom_join_url,
        "zoom_password": consulta.zoom_password
    }

@router.put("/{consulta_id}/triagem", response_model=ConsultaDetailResponse)
def atualizar_triagem(
    consulta_id: int,
    triagem_data: TriagemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Atualiza dados da triagem (apenas enfermeiros)"""
    if current_user.role != UserRole.NURSE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas enfermeiras podem atualizar triagem"
        )
    
    consulta = db.query(Consulta).filter(Consulta.id == consulta_id).first()
    if not consulta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consulta não encontrada"
        )
    
    if consulta.enfermeira_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não está atribuído a esta consulta"
        )
    
    # Buscar ou criar triagem
    triagem = db.query(Triagem).filter(Triagem.consulta_id == consulta_id).first()
    if not triagem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Triagem não encontrada para esta consulta"
        )
    
    # Atualizar dados da triagem
    update_data = triagem_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(triagem, field, value)
    
    # Se classificacao_enfermeira foi atualizada, atualizar também na consulta
    if triagem_data.classificacao_enfermeira:
        consulta.classificacao_urgencia = triagem_data.classificacao_enfermeira
    
    db.commit()
    db.refresh(consulta)
    return consulta

@router.post("/{consulta_id}/encaminhar-profissional", response_model=ConsultaDetailResponse)
def encaminhar_para_profissional(
    consulta_id: int,
    transfer_data: TransferToProfessionalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Enfermeiro finaliza triagem e encaminha paciente para profissional"""
    if current_user.role != UserRole.NURSE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas enfermeiras podem encaminhar pacientes"
        )
    
    consulta = db.query(Consulta).filter(Consulta.id == consulta_id).first()
    if not consulta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consulta não encontrada"
        )
    
    if consulta.enfermeira_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não está atribuído a esta consulta"
        )
    
    if consulta.status != ConsultaStatus.EM_TRIAGEM:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Consulta não está em triagem. Status atual: {consulta.status}"
        )
    
    # Verificar se profissional existe e está disponível
    profissional = db.query(User).filter(User.id == transfer_data.profissional_id).first()
    if not profissional:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profissional não encontrado"
        )
    
    if not profissional.ativo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profissional não está ativo"
        )
    
    # Verificar se é um profissional válido (não pode ser paciente ou enfermeiro)
    if profissional.role == UserRole.PATIENT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível encaminhar para um paciente"
        )
    
    if profissional.role == UserRole.NURSE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível encaminhar para outro enfermeiro"
        )
    
    # Encaminhar usando o routing service
    consulta = routing_service.transfer_to_professional(db, consulta, profissional)
    
    # Adicionar observações se fornecidas
    if transfer_data.observacoes:
        consulta.observacoes = transfer_data.observacoes
    
    # Decrementar contador do enfermeiro
    if current_user.pacientes_atuais and current_user.pacientes_atuais > 0:
        current_user.pacientes_atuais -= 1
        db.add(current_user)
    
    # Criar nova reunião Zoom para o profissional
    topic = f"Consulta - {consulta.paciente.nome} com {profissional.nome}"
    meeting = zoom_service.create_meeting(topic=topic, duration=60)
    consulta.zoom_meeting_id = meeting["meeting_id"]
    consulta.zoom_join_url = meeting["join_url"]
    consulta.zoom_start_url = meeting["start_url"]
    consulta.zoom_password = meeting["password"]
    
    db.commit()
    db.refresh(consulta)
    return consulta

@router.get("/profissionais-disponiveis", response_model=List[dict])
def listar_profissionais_disponiveis(
    role: UserRole = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lista profissionais disponíveis para encaminhamento (apenas enfermeiros)"""
    if current_user.role != UserRole.NURSE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas enfermeiras podem ver profissionais disponíveis"
        )
    
    if role:
        profissionais = routing_service.get_available_professionals(db, role)
    else:
        # Listar todos os tipos de profissionais disponíveis
        roles_profissionais = [
            UserRole.DOCTOR,
            UserRole.PHYSIOTHERAPIST,
            UserRole.NUTRITIONIST,
            UserRole.PSYCHOLOGIST,
            UserRole.SPEECH_THERAPIST,
            UserRole.ACUPUNCTURIST,
            UserRole.CLINICAL_PSYPEDAGOGIST,
            UserRole.HAIRDRESSER,
            UserRole.CAREGIVER,
        ]
        profissionais = []
        for r in roles_profissionais:
            profissionais.extend(routing_service.get_available_professionals(db, r))
    
    return [
        {
            "id": p.id,
            "nome": p.nome,
            "email": p.email,
            "role": p.role.value,
            "especialidade": p.especialidade,
            "disponibilidade": p.disponibilidade.value if p.disponibilidade else None,
            "pacientes_atuais": p.pacientes_atuais or 0,
            "limite_pacientes": p.limite_pacientes or 0,
        }
        for p in profissionais
    ]