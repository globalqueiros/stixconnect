"""
Script para corrigir valores do enum disponibilidade no banco de dados
Atualiza valores minúsculos ('online') para nomes do enum ('ONLINE')
"""
import sqlite3
import sys
import os

# Adicionar o diretório raiz ao path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings

def fix_enum_values():
    """Corrige os valores do enum disponibilidade no banco de dados"""
    
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
        # Verificar valores atuais
        cursor.execute("SELECT id, disponibilidade FROM users LIMIT 5")
        current_values = cursor.fetchall()
        print(f"[INFO] Valores atuais (amostra): {current_values}")
        
        # Atualizar valores maiúsculos para minúsculos (valores do enum)
        # SQLAlchemy com SQLite armazena os valores do enum, não os nomes
        # 'ONLINE' -> 'online'
        # 'BUSY' -> 'busy'
        # 'OFFLINE' -> 'offline'
        updates = [
            ("UPDATE users SET disponibilidade = 'online' WHERE disponibilidade = 'ONLINE'", "ONLINE -> online"),
            ("UPDATE users SET disponibilidade = 'busy' WHERE disponibilidade = 'BUSY'", "BUSY -> busy"),
            ("UPDATE users SET disponibilidade = 'offline' WHERE disponibilidade = 'OFFLINE'", "OFFLINE -> offline"),
        ]
        
        for update_sql, description in updates:
            cursor.execute(update_sql)
            affected = cursor.rowcount
            if affected > 0:
                print(f"[INFO] {description}: {affected} registro(s) atualizado(s)")
        
        # Se ainda houver valores NULL ou inválidos, definir como 'online' (valor do enum)
        cursor.execute("UPDATE users SET disponibilidade = 'online' WHERE disponibilidade IS NULL OR disponibilidade NOT IN ('online', 'busy', 'offline')")
        affected = cursor.rowcount
        if affected > 0:
            print(f"[INFO] Valores inválidos corrigidos: {affected} registro(s) definido(s) como 'online'")
        
        conn.commit()
        
        # Verificar valores finais
        cursor.execute("SELECT DISTINCT disponibilidade FROM users")
        final_values = [row[0] for row in cursor.fetchall()]
        print(f"[INFO] Valores finais no banco: {final_values}")
        
        print("\n[SUCESSO] Correção de valores do enum concluída!")
        return True
        
    except Exception as e:
        conn.rollback()
        print(f"[ERRO] Erro ao corrigir valores: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    print("[INFO] Iniciando correção de valores do enum...\n")
    success = fix_enum_values()
    sys.exit(0 if success else 1)
