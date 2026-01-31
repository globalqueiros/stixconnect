"""
Script para adicionar colunas faltantes ao banco de dados
Adiciona: disponibilidade, pacientes_atuais, limite_pacientes
"""
import sqlite3
import sys
import os

# Adicionar o diretório raiz ao path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings

def check_and_add_columns():
    """Verifica e adiciona colunas faltantes na tabela users"""
    
    # Extrair o caminho do banco de dados da URL
    db_url = settings.DATABASE_URL
    if db_url.startswith("sqlite:///"):
        db_path = db_url.replace("sqlite:///", "")
        if db_path.startswith("./"):
            db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), db_path[2:])
    else:
        print("[ERRO] Este script só funciona com SQLite")
        return False
    
    if not os.path.exists(db_path):
        print(f"[ERRO] Banco de dados não encontrado em: {db_path}")
        return False
    
    print(f"[INFO] Conectando ao banco: {db_path}")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Verificar quais colunas já existem
        cursor.execute("PRAGMA table_info(users)")
        existing_columns = [row[1] for row in cursor.fetchall()]
        
        print(f"[INFO] Colunas existentes: {', '.join(existing_columns)}")
        
        # Verificar e adicionar coluna disponibilidade
        if "disponibilidade" not in existing_columns:
            print("[INFO] Adicionando coluna 'disponibilidade'...")
            # SQLite não suporta ENUM nativamente, vamos usar TEXT
            cursor.execute("""
                ALTER TABLE users 
                ADD COLUMN disponibilidade TEXT DEFAULT 'online' NOT NULL
            """)
            # Atualizar valores existentes
            cursor.execute("UPDATE users SET disponibilidade = 'online' WHERE disponibilidade IS NULL")
            print("[OK] Coluna 'disponibilidade' adicionada")
        else:
            print("[OK] Coluna 'disponibilidade' já existe")
        
        # Verificar e adicionar coluna pacientes_atuais
        if "pacientes_atuais" not in existing_columns:
            print("[INFO] Adicionando coluna 'pacientes_atuais'...")
            cursor.execute("""
                ALTER TABLE users 
                ADD COLUMN pacientes_atuais INTEGER DEFAULT 0 NOT NULL
            """)
            cursor.execute("UPDATE users SET pacientes_atuais = 0 WHERE pacientes_atuais IS NULL")
            print("[OK] Coluna 'pacientes_atuais' adicionada")
        else:
            print("[OK] Coluna 'pacientes_atuais' já existe")
        
        # Verificar e adicionar coluna limite_pacientes
        if "limite_pacientes" not in existing_columns:
            print("[INFO] Adicionando coluna 'limite_pacientes'...")
            cursor.execute("""
                ALTER TABLE users 
                ADD COLUMN limite_pacientes INTEGER DEFAULT 3 NOT NULL
            """)
            cursor.execute("UPDATE users SET limite_pacientes = 3 WHERE limite_pacientes IS NULL")
            print("[OK] Coluna 'limite_pacientes' adicionada")
        else:
            print("[OK] Coluna 'limite_pacientes' já existe")
        
        conn.commit()
        print("\n[SUCESSO] Migração concluída com sucesso!")
        return True
        
    except Exception as e:
        conn.rollback()
        print(f"[ERRO] Erro ao adicionar colunas: {e}")
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    print("[INFO] Iniciando migração de colunas...\n")
    success = check_and_add_columns()
    sys.exit(0 if success else 1)
