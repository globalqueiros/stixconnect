from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
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
    "http://localhost:3000",      # Frontend desenvolvimento (StixConnect)
    "http://localhost:3001",      # Frontend desenvolvimento (Nexus Admin)
    "http://127.0.0.1:3000",      # Frontend desenvolvimento alternativo
    "http://127.0.0.1:3001",      # Frontend desenvolvimento alternativo (Nexus Admin)
    "https://stixconnect.com",    # Frontend produção
    "https://www.stixconnect.com", # Frontend produção com www
    "https://stixconnect.vercel.app", # Vercel preview deployments
]

# CORS deve ser adicionado ANTES de qualquer outra configuração de rotas
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],  # Permitir todos os métodos para evitar problemas com preflight
    allow_headers=["*"],  # Permitir todos os headers para evitar problemas com preflight
    max_age=3600,  # Cache preflight por 1 hora
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

# Handler para erros de validação do Pydantic
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Retorna mensagens de erro de validação mais claras"""
    errors = []
    for error in exc.errors():
        field = ".".join(str(loc) for loc in error.get("loc", []))
        message = error.get("msg", "Erro de validação")
        error_type = error.get("type", "validation_error")
        
        # Mensagens mais amigáveis
        if error_type == "value_error.missing":
            message = f"Campo obrigatório: {field}"
        elif error_type == "value_error.email":
            message = f"Email inválido: {field}"
        elif error_type == "type_error.enum":
            message = f"Valor inválido para {field}. Valores permitidos: {error.get('ctx', {}).get('expected', 'N/A')}"
        
        errors.append({
            "field": field,
            "message": message,
            "type": error_type
        })
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Erro de validação",
            "errors": errors
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)