from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from app.core.database import engine, Base
from app.routers import auth, consultas, admin, patients, files
from app.routers.users import router as users_router, admin_router as users_admin_router
from app.core.config import settings

# Cria as tabelas no banco de dados
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="API para gerenciamento de consultas médicas com integração Zoom",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configuração CORS - origens específicas para segurança
ALLOWED_ORIGINS = settings.CORS_ORIGINS if hasattr(settings, 'CORS_ORIGINS') else [
    "http://localhost:3000",      # Frontend desenvolvimento
    "http://127.0.0.1:3000",      # Frontend desenvolvimento alternativo
    "https://stixconnect.com",    # Frontend produção
    "https://www.stixconnect.com", # Frontend produção com www
    "https://stixconnect.vercel.app", # Vercel preview deployments
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"],
)

# Servir arquivos de upload locais (desenvolvimento)
upload_dir = "uploads"
if os.path.exists(upload_dir):
    app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")

# ============================================
# Rotas da API
# ============================================

# Autenticação
app.include_router(auth.router)

# Consultas e triagem
app.include_router(consultas.router)

# Pacientes
app.include_router(patients.router)

# Usuários (perfil próprio)
app.include_router(users_router)

# Arquivos
app.include_router(files.router)

# Administração
app.include_router(admin.router)
app.include_router(users_admin_router)

# WebSocket
from app.websockets import ws_router
app.include_router(ws_router)

@app.get("/")
def root():
    return {
        "message": "StixConnect API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)