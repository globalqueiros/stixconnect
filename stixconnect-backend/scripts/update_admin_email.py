"""
Script para atualizar o email do usuário administrador
Uso: python scripts/update_admin_email.py
"""

import sys
import os

# Adicionar o diretório raiz ao path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.models import User
from datetime import datetime

def update_admin_email(old_email: str, new_email: str):
    """Atualiza o email de um usuário admin"""
    
    db = SessionLocal()
    
    try:
        # Buscar usuário pelo email antigo
        user = db.query(User).filter(User.email == old_email).first()
        if not user:
            print(f"[ERRO] Usuario com email {old_email} nao encontrado!")
            return
        
        # Verificar se o novo email já existe
        existing_user = db.query(User).filter(User.email == new_email).first()
        if existing_user and existing_user.id != user.id:
            print(f"[ERRO] Email {new_email} ja esta em uso por outro usuario!")
            return
        
        # Atualizar email
        user.email = new_email
        user.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(user)
        
        print(f"[SUCESSO] Email atualizado com sucesso!")
        print(f"   ID: {user.id}")
        print(f"   Nome: {user.nome}")
        print(f"   Email antigo: {old_email}")
        print(f"   Email novo: {user.email}")
        print(f"   Role: {user.role}")
        
    except Exception as e:
        db.rollback()
        print(f"[ERRO] Erro ao atualizar email: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    old_email = "jorgepaim2005@gmail.com"
    new_email = "admin@test.com"
    
    print("Atualizando email do usuario administrador...")
    print("-" * 50)
    update_admin_email(old_email, new_email)
    print("-" * 50)
    print("Concluido!")
