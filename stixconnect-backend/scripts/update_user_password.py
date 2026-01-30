"""
Script para atualizar a senha de um usuário existente
Uso: python scripts/update_user_password.py
"""

import sys
import os

# Adicionar o diretório raiz ao path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.models import User
from app.core.security import get_password_hash
from datetime import datetime

def update_user_password(email: str, new_password: str):
    """Atualiza a senha de um usuário"""
    
    db = SessionLocal()
    
    try:
        # Buscar usuário
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"[ERRO] Usuario com email {email} nao encontrado!")
            return
        
        # Criar novo hash da senha
        senha_hash = get_password_hash(new_password)
        
        # Atualizar senha
        user.senha_hash = senha_hash
        user.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(user)
        
        print(f"[SUCESSO] Senha atualizada para usuario {user.nome}!")
        print(f"   Email: {user.email}")
        print(f"   Nova senha: {new_password}")
        
    except Exception as e:
        db.rollback()
        print(f"[ERRO] Erro ao atualizar senha: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    email = "jorgepaim2005@gmail.com"
    new_password = "admin123456"
    
    print("Atualizando senha do usuario...")
    print("-" * 50)
    update_user_password(email, new_password)
    print("-" * 50)
    print("Concluido!")
