"""
Serviço de roteamento de consultas para enfermeiros e profissionais.
"""

from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.models import User, UserRole, AvailabilityStatus, Consulta, ConsultaStatus


class RoutingService:
    """Encapsula a lógica de distribuição de consultas."""

    def get_available_nurse(self, db: Session) -> Optional[User]:
        """
        Retorna um enfermeiro disponível usando uma estratégia simples:
        - apenas usuários com role NURSE, ativos
        - disponibilidade ONLINE
        - pacientes_atuais < limite_pacientes
        - ordenados por pacientes_atuais e created_at (round-robin aproximado)
        """
        nurse = (
            db.query(User)
            .filter(
                User.role == UserRole.NURSE,
                User.ativo.is_(True),
                User.disponibilidade == AvailabilityStatus.ONLINE,
                User.pacientes_atuais < User.limite_pacientes,
            )
            .order_by(User.pacientes_atuais.asc(), User.created_at.asc())
            .first()
        )
        return nurse

    def get_available_professionals(
        self,
        db: Session,
        role: UserRole,
    ) -> List[User]:
        """
        Lista profissionais disponíveis por role/especialidade.
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
        return professionals

    def assign_patient_to_nurse(
        self,
        db: Session,
        consulta: Consulta,
        nurse: User,
    ) -> Consulta:
        """
        Atribui consulta a um enfermeiro, incrementando contador de pacientes.
        """
        consulta.enfermeira_id = nurse.id
        consulta.status = ConsultaStatus.EM_TRIAGEM
        nurse.pacientes_atuais = (nurse.pacientes_atuais or 0) + 1

        db.add(consulta)
        db.add(nurse)
        db.commit()
        db.refresh(consulta)

        return consulta

    def transfer_to_professional(
        self,
        db: Session,
        consulta: Consulta,
        professional: User,
    ) -> Consulta:
        """
        Transfere consulta para profissional (médico, fisioterapeuta, etc.).
        """
        consulta.medico_id = professional.id
        consulta.status = ConsultaStatus.AGUARDANDO_MEDICO

        db.add(consulta)
        db.commit()
        db.refresh(consulta)

        return consulta


routing_service = RoutingService()

