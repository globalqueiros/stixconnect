"""
Script de migração de dados do MySQL legado para o novo schema SQLAlchemy
"""

import sys
import os

# Adicionar diretório raiz ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import mysql.connector
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.database import SessionLocal, engine, Base
from app.models.models import User, UserRole, Consulta, Triagem, ConsultaStatus, ConsultaTipo, ClassificacaoUrgencia
from app.core.security import get_password_hash

# Mapeamento de codPerfil (legado) para UserRole (novo)
ROLE_MAPPING = {
    1: UserRole.ADMIN,              # Administrador
    2: UserRole.DOCTOR,             # Médico
    3: UserRole.NURSE,              # Enfermeiro
    4: UserRole.RECEPTIONIST,       # Atendente
    5: UserRole.PHYSIOTHERAPIST,    # Fisioterapeuta
    6: UserRole.NUTRITIONIST,       # Nutricionista
    7: UserRole.HAIRDRESSER,        # Cabeleireiro
    8: UserRole.PSYCHOLOGIST,       # Psicóloga
    9: UserRole.SPEECH_THERAPIST,   # Fonoaudióloga
    10: UserRole.ACUPUNCTURIST,     # Acupuntura
    11: UserRole.CLINICAL_PSYPEDAGOGIST,  # Psicopedagoga_clinica
    12: UserRole.CAREGIVER,         # Cuidador
    13: UserRole.PATIENT,           # Paciente
    14: UserRole.SUPERVISOR,        # Supervisor
}

# Configuração do banco legado
LEGACY_DB_CONFIG = {
    'host': '184.168.114.4',
    'user': 'stix_prod_rw',
    'password': 't{UX9(x7s5*}',
    'database': 'stix_app_user'
}


def map_role(cod_perfil: int) -> UserRole:
    """Mapeia código de perfil legado para UserRole"""
    return ROLE_MAPPING.get(cod_perfil, UserRole.PATIENT)


def migrate_users(legacy_db, new_db: Session):
    """Migra usuários de tb_usuario para users"""
    print("Migrando usuários...")
    
    cursor = legacy_db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM tb_usuario")
    
    migrated_count = 0
    skipped_count = 0
    
    for user_row in cursor.fetchall():
        # Verificar se já existe
        existing = new_db.query(User).filter(User.email == user_row['email']).first()
        if existing:
            print(f"Usuário {user_row['email']} já existe, pulando...")
            skipped_count += 1
            continue
        
        try:
            # Mapear role
            role = map_role(user_row.get('codPerfil', 13))
            
            # Criar novo usuário
            new_user = User(
                nome=user_row.get('nome', 'Sem nome'),
                email=user_row['email'],
                senha_hash=user_row.get('password', get_password_hash('temp123')),  # Senha temporária
                role=role,
                telefone=user_row.get('telefone'),
                cpf=user_row.get('cpf'),
                data_nascimento=user_row.get('data_nascimento'),
                num_prontuario=user_row.get('num_prontuario'),
                ativo=user_row.get('ativo', 1) == 1,
                created_at=user_row.get('created_at', datetime.utcnow()),
                updated_at=user_row.get('updated_at', datetime.utcnow()),
            )
            
            new_db.add(new_user)
            migrated_count += 1
            
        except Exception as e:
            print(f"Erro ao migrar usuário {user_row.get('email')}: {e}")
            continue
    
    new_db.commit()
    print(f"✓ {migrated_count} usuários migrados, {skipped_count} pulados")


def migrate_consultations(legacy_db, new_db: Session):
    """Migra consultas de tb_consultas para consultations"""
    print("Migrando consultas...")
    
    cursor = legacy_db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM tb_consultas")
    
    migrated_count = 0
    
    for consulta_row in cursor.fetchall():
        try:
            # Mapear status
            status_map = {
                'aguardando': ConsultaStatus.AGUARDANDO,
                'em_triagem': ConsultaStatus.EM_TRIAGEM,
                'aguardando_medico': ConsultaStatus.AGUARDANDO_MEDICO,
                'em_atendimento': ConsultaStatus.EM_ATENDIMENTO,
                'finalizada': ConsultaStatus.FINALIZADA,
                'cancelada': ConsultaStatus.CANCELADA,
            }
            status = status_map.get(consulta_row.get('status', 'aguardando'), ConsultaStatus.AGUARDANDO)
            
            # Mapear tipo
            tipo = ConsultaTipo.URGENTE if consulta_row.get('tipo') == 'urgente' else ConsultaTipo.AGENDADA
            
            # Mapear classificação
            classificacao_map = {
                'baixa': ClassificacaoUrgencia.BAIXA,
                'media': ClassificacaoUrgencia.MEDIA,
                'alta': ClassificacaoUrgencia.ALTA,
                'critica': ClassificacaoUrgencia.CRITICA,
            }
            classificacao = classificacao_map.get(consulta_row.get('classificacao_urgencia'))
            
            new_consulta = Consulta(
                id=consulta_row.get('id'),  # Manter mesmo ID se possível
                paciente_id=consulta_row.get('paciente_id'),
                enfermeira_id=consulta_row.get('enfermeira_id'),
                medico_id=consulta_row.get('medico_id'),
                tipo=tipo,
                status=status,
                classificacao_urgencia=classificacao,
                data_agendamento=consulta_row.get('data_agendamento'),
                data_inicio=consulta_row.get('data_inicio'),
                data_fim=consulta_row.get('data_fim'),
                duracao_minutos=consulta_row.get('duracao_minutos'),
                zoom_meeting_id=consulta_row.get('zoom_meeting_id'),
                zoom_join_url=consulta_row.get('zoom_join_url'),
                zoom_start_url=consulta_row.get('zoom_start_url'),
                zoom_password=consulta_row.get('zoom_password'),
                observacoes=consulta_row.get('observacoes'),
                diagnostico=consulta_row.get('diagnostico'),
                created_at=consulta_row.get('created_at', datetime.utcnow()),
                updated_at=consulta_row.get('updated_at', datetime.utcnow()),
            )
            
            new_db.add(new_consulta)
            migrated_count += 1
            
        except Exception as e:
            print(f"Erro ao migrar consulta ID {consulta_row.get('id')}: {e}")
            continue
    
    new_db.commit()
    print(f"✓ {migrated_count} consultas migradas")


def migrate_triagens(legacy_db, new_db: Session):
    """Migra triagens de tb_triagem para triagens"""
    print("Migrando triagens...")
    
    cursor = legacy_db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM tb_triagem")
    
    migrated_count = 0
    
    for triagem_row in cursor.fetchall():
        try:
            # Mapear classificação
            classificacao_map = {
                'baixa': ClassificacaoUrgencia.BAIXA,
                'media': ClassificacaoUrgencia.MEDIA,
                'alta': ClassificacaoUrgencia.ALTA,
                'critica': ClassificacaoUrgencia.CRITICA,
            }
            classificacao_auto = classificacao_map.get(triagem_row.get('classificacao_automatica'))
            classificacao_enfermeira = classificacao_map.get(triagem_row.get('classificacao_enfermeira'))
            
            new_triagem = Triagem(
                id=triagem_row.get('id'),
                consulta_id=triagem_row.get('consulta_id'),
                paciente_id=triagem_row.get('paciente_id'),
                sintomas=triagem_row.get('sintomas', ''),
                temperatura=triagem_row.get('temperatura'),
                pressao_arterial=triagem_row.get('pressao_arterial'),
                frequencia_cardiaca=triagem_row.get('frequencia_cardiaca'),
                saturacao_oxigenio=triagem_row.get('saturacao_oxigenio'),
                dor_escala=triagem_row.get('dor_escala'),
                historico_medico=triagem_row.get('historico_medico'),
                medicamentos_uso=triagem_row.get('medicamentos_uso'),
                alergias=triagem_row.get('alergias'),
                classificacao_automatica=classificacao_auto,
                classificacao_enfermeira=classificacao_enfermeira,
                created_at=triagem_row.get('created_at', datetime.utcnow()),
                updated_at=triagem_row.get('updated_at', datetime.utcnow()),
            )
            
            new_db.add(new_triagem)
            migrated_count += 1
            
        except Exception as e:
            print(f"Erro ao migrar triagem ID {triagem_row.get('id')}: {e}")
            continue
    
    new_db.commit()
    print(f"✓ {migrated_count} triagens migradas")


def main():
    """Função principal de migração"""
    print("=" * 60)
    print("MIGRAÇÃO DE DADOS - StixConnect")
    print("=" * 60)
    print()
    
    # Conectar ao banco legado
    print("Conectando ao banco legado...")
    try:
        legacy_db = mysql.connector.connect(**LEGACY_DB_CONFIG)
        print("✓ Conectado ao banco legado")
    except Exception as e:
        print(f"✗ Erro ao conectar ao banco legado: {e}")
        return
    
    # Criar sessão do novo banco
    print("Conectando ao novo banco...")
    new_db = SessionLocal()
    
    try:
        # Criar todas as tabelas
        Base.metadata.create_all(bind=engine)
        print("✓ Tabelas criadas/verificadas")
        print()
        
        # Executar migrações
        migrate_users(legacy_db, new_db)
        migrate_consultations(legacy_db, new_db)
        migrate_triagens(legacy_db, new_db)
        
        print()
        print("=" * 60)
        print("MIGRAÇÃO CONCLUÍDA COM SUCESSO!")
        print("=" * 60)
        
    except Exception as e:
        print(f"✗ Erro durante migração: {e}")
        new_db.rollback()
        raise
    
    finally:
        new_db.close()
        legacy_db.close()


if __name__ == "__main__":
    main()
