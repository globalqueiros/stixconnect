"""
Script para criar usuário administrador no sistema StixConnect
Uso: python scripts/create_admin_user.py
"""

import sys
import os

# Adicionar o diretório raiz ao path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.models import User, UserRole
from app.core.security import get_password_hash
from datetime import datetime

def create_admin_user():
    """Cria um usuário administrador"""
    
    db = SessionLocal()
    
    try:
        # Dados do usuário admin
        email = "jorgepaim2005@gmail.com"
        nome = "Jorge Paim"
        senha = "admin123456"  # Senha padrão - altere após primeiro login
        
        # Verificar se usuário já existe
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            print(f"[ERRO] Usuario com email {email} ja existe!")
            print(f"   ID: {existing_user.id}")
            print(f"   Nome: {existing_user.nome}")
            print(f"   Role: {existing_user.role}")
            return
        
        # Criar hash da senha usando função do security.py
        senha_hash = get_password_hash(senha)
        
        # Criar usuário admin
        admin_user = User(
            nome=nome,
            email=email,
            senha_hash=senha_hash,
            role=UserRole.ADMIN,
            ativo=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print("[SUCESSO] Usuario administrador criado com sucesso!")
        print(f"   ID: {admin_user.id}")
        print(f"   Nome: {admin_user.nome}")
        print(f"   Email: {admin_user.email}")
        print(f"   Role: {admin_user.role}")
        print(f"   Senha: {senha}")
        print("\n[IMPORTANTE] Altere a senha apos o primeiro login!")
        
    except Exception as e:
        db.rollback()
        print(f"[ERRO] Erro ao criar usuario: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("Criando usuario administrador...")
    print("-" * 50)
    create_admin_user()
    print("-" * 50)
    print("Concluido!")
