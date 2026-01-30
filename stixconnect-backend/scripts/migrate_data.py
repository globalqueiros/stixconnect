# Scripts de Migração de Dados
from datetime import datetime
import mysql.connector
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.core.database import get_db
from app.models.models import User, UserRole
from app.core.security import get_password_hash
import logging

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DataMigration:
    def __init__(self):
        self.mysql_connection = None
        self.sqlalchemy_engine = None
        self.session = None
        
    def connect_mysql(self):
        """Conectar ao MySQL existente"""
        try:
            self.mysql_connection = mysql.connector.connect(
                host='184.168.114.4',
                user='stix_prod_rw',
                password='t{UX9(x7s5*}',
                database='stix_app_user'
            )
            logger.info("Conectado ao MySQL existente")
            return True
        except Exception as e:
            logger.error(f"Erro ao conectar ao MySQL: {e}")
            return False
    
    def connect_sqlalchemy(self):
        """Conectar ao SQLAlchemy (novo schema)"""
        try:
            self.sqlalchemy_engine = create_engine(settings.DATABASE_URL)
            SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.sqlalchemy_engine)
            self.session = SessionLocal()
            logger.info("Conectado ao SQLAlchemy")
            return True
        except Exception as e:
            logger.error(f"Erro ao conectar ao SQLAlchemy: {e}")
            return False
    
    def map_role_frontend_to_backend(self, codPerfil: int, nomePerfil: str = None):
        """Mapear roles do frontend para backend"""
        role_mapping = {
            1: UserRole.ADMIN,
            2: UserRole.SUPERVISOR,
            3: UserRole.DOCTOR,
            4: UserRole.NURSE,
            5: UserRole.RECEPTIONIST,
            6: UserRole.PHYSIOTHERAPIST,
            7: UserRole.NUTRITIONIST,
            8: UserRole.HAIRDRESSER,
            9: UserRole.PSYCHOLOGIST,
            10: UserRole.SPEECH_THERAPIST,
            11: UserRole.ACUPUNCTURIST,
            12: UserRole.CLINICAL_PSYPEDAGOGIST,
            13: UserRole.CAREGIVER,
            14: UserRole.PATIENT,
        }
        
        # Mapeamento por nome também (fallback)
        name_mapping = {
            'Administrador': UserRole.ADMIN,
            'Médico': UserRole.DOCTOR,
            'Enfermeiro': UserRole.NURSE,
            'Atendente': UserRole.RECEPTIONIST,
            'Fisioterapeuta': UserRole.PHYSIOTHERAPIST,
            'Nutricionista': UserRole.NUTRITIONIST,
            'Cabeleireiro': UserRole.HAIRDRESSER,
            'Psicóloga': UserRole.PSYCHOLOGIST,
            'Fonoaudióloga': UserRole.SPEECH_THERAPIST,
            'Acupuntura': UserRole.ACUPUNCTURIST,
            'Psicopedagoga_clinica': UserRole.CLINICAL_PSYPEDAGOGIST,
            'Cuidador': UserRole.CAREGIVER,
            'Paciente': UserRole.PATIENT,
        }
        
        # Tentar mapear por código primeiro
        role = role_mapping.get(codPerfil)
        
        # Se não encontrar, tentar por nome
        if not role and nomePerfil:
            role = name_mapping.get(nomePerfil)
        
        # Se ainda não encontrar, usar PATIENT como padrão
        if not role:
            role = UserRole.PATIENT
            
        return role
    
    def migrate_users(self):
        """Migrar usuários do MySQL para SQLAlchemy"""
        try:
            cursor = self.mysql_connection.cursor(dictionary=True)
            
            # Buscar todos os usuários do MySQL
            cursor.execute("""
                SELECT u.*, p.nome AS nomePerfil, p.rota AS rotaPerfil
                FROM tb_usuario u
                LEFT JOIN tb_profile p ON p.idProfile = u.codPerfil
                ORDER BY u.id
            """)
            
            mysql_users = cursor.fetchall()
            logger.info(f"Encontrados {len(mysql_users)} usuários no MySQL")
            
            migrated_count = 0
            for mysql_user in mysql_users:
                try:
                    # Verificar se usuário já existe no novo schema
                    existing_user = self.session.query(User).filter(User.email == mysql_user['email']).first()
                    
                    if existing_user:
                        logger.info(f"Usuário {mysql_user['email']} já existe, pulando...")
                        continue
                    
                    # Mapear role
                    backend_role = self.map_role_frontend_to_backend(
                        mysql_user.get('codPerfil'),
                        mysql_user.get('nomePerfil')
                    )
                    
                    # Criar novo usuário
                    new_user = User(
                        id=mysql_user['id'],
                        nome=mysql_user['nome'],
                        email=mysql_user['email'],
                        senha_hash=mysql_user['password'],  # Manter hash existente
                        role=backend_role,
                        telefone=mysql_user.get('telefone'),
                        cpf=mysql_user.get('cpf'),
                        data_nascimento=mysql_user.get('data_nascimento'),
                        ativo=mysql_user.get('ativo', True),
                        num_prontuario=mysql_user.get('nroMatricula'),
                        endereco=mysql_user.get('endereco'),
                        especialidade=mysql_user.get('especialidade'),
                        crm=mysql_user.get('crm'),
                        created_at=mysql_user.get('created_at') or datetime.utcnow(),
                        updated_at=mysql_user.get('updated_at') or datetime.utcnow()
                    )
                    
                    self.session.add(new_user)
                    migrated_count += 1
                    
                    if migrated_count % 100 == 0:
                        self.session.commit()
                        logger.info(f"Migrados {migrated_count} usuários...")
                        
                except Exception as e:
                    logger.error(f"Erro ao migrar usuário {mysql_user['email']}: {e}")
                    self.session.rollback()
                    continue
            
            # Commit final
            self.session.commit()
            logger.info(f"Migração de usuários concluída. Total migrados: {migrated_count}")
            
            cursor.close()
            return True
            
        except Exception as e:
            logger.error(f"Erro na migração de usuários: {e}")
            self.session.rollback()
            return False
    
    def create_admin_user(self):
        """Criar usuário administrador padrão"""
        try:
            # Verificar se já existe admin
            existing_admin = self.session.query(User).filter(User.role == UserRole.ADMIN).first()
            if existing_admin:
                logger.info("Usuário admin já existe")
                return True
            
            # Criar admin padrão
            admin_password = get_password_hash("admin123")
            admin_user = User(
                nome="Administrador Sistema",
                email="admin@stixconnect.com",
                senha_hash=admin_password,
                role=UserRole.ADMIN,
                ativo=True,
                created_at=datetime.utcnow()
            )
            
            self.session.add(admin_user)
            self.session.commit()
            logger.info("Usuário admin criado: admin@stixconnect.com / admin123")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao criar admin: {e}")
            return False
    
    def run_migration(self):
        """Executar migração completa"""
        logger.info("Iniciando migração de dados...")
        
        # Conectar aos bancos
        if not self.connect_mysql():
            return False
        
        if not self.connect_sqlalchemy():
            return False
        
        try:
            # Criar tabelas se não existirem
            from app.core.database import Base
            Base.metadata.create_all(bind=self.sqlalchemy_engine)
            logger.info("Tabelas criadas/verificadas")
            
            # Criar admin padrão
            self.create_admin_user()
            
            # Migrar usuários
            if not self.migrate_users():
                return False
            
            logger.info("Migração concluída com sucesso!")
            return True
            
        except Exception as e:
            logger.error(f"Erro na migração: {e}")
            return False
        
        finally:
            # Fechar conexões
            if self.mysql_connection:
                self.mysql_connection.close()
            if self.session:
                self.session.close()

def main():
    """Função principal para executar migração"""
    migration = DataMigration()
    success = migration.run_migration()
    
    if success:
        logger.info("✅ Migração concluída com sucesso!")
    else:
        logger.error("❌ Falha na migração")
    
    return success

if __name__ == "__main__":
    main()