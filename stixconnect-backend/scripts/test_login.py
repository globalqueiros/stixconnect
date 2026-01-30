"""Teste de login"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.models import User
from app.core.security import verify_password

db = SessionLocal()
user = db.query(User).filter(User.email == 'jorgepaim2005@gmail.com').first()

if user:
    print(f"Usuario encontrado: {user.nome}")
    result = verify_password('admin123456', user.senha_hash)
    print(f"Senha valida: {result}")
else:
    print("Usuario nao encontrado")

db.close()
