# 📋 Plano de Implementação - StixConnect Integration

## 🎯 Visão Geral

Este documento detalha o plano completo para integrar o frontend Next.js do StixConnect com o backend FastAPI, mantendo arquitetura separada e garantindo migração segura do sistema existente.

## 📊 Análise da Situação Atual

### Backend FastAPI (Porta 8000)
- ✅ **Framework**: FastAPI 0.104.1 com Uvicorn
- ✅ **Database**: SQLAlchemy ORM (SQLite → MySQL/MariaDB)
- ✅ **Autenticação**: JWT tokens com 4 roles (patient, nurse, doctor, admin)
- ✅ **APIs**: Authentication, Consultations, Admin endpoints
- ✅ **Integrações**: Zoom SDK para telemedicina
- ✅ **Documentação**: Swagger UI (`/docs`) e ReDoc (`/redoc`)
- ✅ **Segurança**: Password hashing com bcrypt, role-based access control

### Frontend Next.js (Porta 3000)
- ✅ **Framework**: Next.js 15.2.0 com TypeScript
- ✅ **UI**: Tailwind CSS, Bootstrap 5.3, Framer Motion
- ✅ **Database**: MySQL direto via API Routes
- ✅ **Autenticação**: Sistema próprio com 14 perfis de usuário
- ✅ **Features**: FullCalendar, Zoom SDK, AWS S3, Twilio
- ✅ **API Routes**: 25+ endpoints ativos
- ✅ **Roles**: Administrador, Médico, Enfermeiro, Atendente, Fisioterapeuta, Nutricionista, Cabeleireiro, Psicóloga, Fonoaudióloga, Acupuntura, Psicopedagoga_clinica, Cuidador

## 🏗️ Arquitetura Escolhida

### Separação de Serviços
```
┌─────────────────────┐    ┌─────────────────────┐
│   Frontend Next.js   │    │   Backend FastAPI    │
│   Porta 3000         │    │   Porta 8000         │
│                     │    │                     │
│ • UI/UX            │    │ • Business Logic    │
│ • Client-side Auth  │◄──►│ • JWT Management     │
│ • Zoom Client      │    │ • Zoom Server       │
│ • State Management │    │ • Database Operations│
│ • Route Handlers   │    │ • Security          │
└─────────────────────┘    └─────────────────────┘
```

## 📋 Plano Detalhado de Implementação

### 🚀 FASE 1: Configuração Inicial (2-3 dias)

#### 1.1 Configurar CORS no Backend FastAPI
```python
# main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://stixconnect.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### 1.2 Criar Estrutura de Workspace
```
stixconnect-integrated/
├── frontend/          # Next.js atual
├── backend/           # FastAPI atual
├── docker-compose.yml # Orquestração
├── .env              # Variáveis compartilhadas
├── package.json       # Scripts unificados
└── docs/             # Documentação
```

#### 1.3 Configurar Variáveis de Ambiente
```bash
# .env (compartilhado)
# Database
DATABASE_URL=mysql://user:password@localhost:3306/stixconnect
DB_HOST=localhost
DB_USER=stix_prod_rw
DB_PASSWORD=password
DB_NAME=stix_app_user
DB_PORT=3306

# JWT (Backend)
SECRET_KEY=your_super_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Zoom (Ambos)
ZOOM_ACCOUNT_ID=your_account_id
ZOOM_CLIENT_ID=your_client_id
ZOOM_CLIENT_SECRET=your_client_secret

# AWS S3 (Frontend)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=stixconnect-files

# Twilio (Frontend)
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=your_number

# Frontend
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Backend
BACKEND_URL=http://localhost:8000
```

### 🔐 FASE 2: Migração de Autenticação (3-4 dias)

#### 2.1 Mapeamento de Roles
```typescript
// frontend → backend mapping
const roleMapping = {
  'Administrador': 'admin',
  'Médico': 'doctor',
  'Enfermeiro': 'nurse',
  'Atendente': 'patient',
  'Fisioterapeuta': 'patient',
  'Nutricionista': 'patient',
  'Cabeleireiro': 'patient',
  'Psicóloga': 'patient',
  'Fonoaudióloga': 'patient',
  'Acupuntura': 'patient',
  'Psicopedagoga_clinica': 'patient',
  'Cuidador': 'patient'
};
```

#### 2.2 Atualizar Backend para 14 Roles
```python
# backend/app/core/security.py
class UserRole(str, enum.Enum):
    ADMIN = "admin"
    DOCTOR = "doctor"
    NURSE = "nurse"
    RECEPTIONIST = "receptionist"
    PHYSIOTHERAPIST = "physiotherapist"
    NUTRITIONIST = "nutritionist"
    HAIRDRESSER = "hairdresser"
    PSYCHOLOGIST = "psychologist"
    SPEECH_THERAPIST = "speech_therapist"
    ACUPUNCTURIST = "acupuncturist"
    CLINICAL_PSYPEDAGOGIST = "clinical_psypedagogist"
    CAREGIVER = "caregiver"
    PATIENT = "patient"
```

#### 2.3 Implementar Cliente API no Frontend
```typescript
// lib/api-client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para JWT
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Refresh token logic
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Implement refresh token logic
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post('/auth/refresh', {
            refresh_token: refreshToken,
          });
          const { access_token } = response.data;
          localStorage.setItem('access_token', access_token);
          return apiClient.request(error.config);
        } catch (refreshError) {
          // Redirect to login
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### 🔄 FASE 3: Migração de APIs (5-7 dias)

#### 3.1 Mapeamento de Endpoints

| Frontend Atual | Backend FastAPI | Ação Necessária |
|---------------|-----------------|-----------------|
| `POST /api/login` | `POST /auth/login` | ✅ Adaptar formato |
| `GET /api/usuario` | `GET /admin/users` | ⚠️ Criar endpoint |
| `GET /api/pacientes` | `GET /admin/patients` | ⚠️ Criar endpoint |
| `POST /api/consultas` | `POST /consultas/` | ✅ Compatível |
| `GET /api/consultas/[id]` | `GET /consultas/{id}` | ✅ Adaptar parâmetro |
| `POST /api/zoom/create` | `POST /consultas/{id}/start-zoom` | ⚠️ Adaptar endpoint |
| `POST /api/upload` | `POST /files/upload` | ⚠️ Criar endpoint AWS S3 |

#### 3.2 Criar Endpoints Faltantes no Backend
```python
# backend/app/routers/patients.py
@router.post("/patients")
async def create_patient(patient: PatientCreate, db: Session = Depends(get_db)):
    # Lógica para criar paciente
    pass

@router.get("/patients")
async def get_patients(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Lógica para listar pacientes
    pass

# backend/app/routers/files.py
@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    # Integração com AWS S3
    pass
```

#### 3.3 Atualizar Frontend para Backend APIs
```typescript
// services/auth.service.ts
import apiClient from '@/lib/api-client';

export const authService = {
  async login(email: string, password: string) {
    const response = await apiClient.post('/auth/login', {
      email,
      password, // Backend usa 'senha' mas frontend usa 'password'
    });
    return response.data;
  },

  async register(userData: any) {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  async refreshToken(refreshToken: string) {
    const response = await apiClient.post('/auth/refresh', {
      refresh_token: refreshToken,
    });
    return response.data;
  }
};

// services/consultation.service.ts
export const consultationService = {
  async createConsultation(consultationData: any) {
    const response = await apiClient.post('/consultas/', consultationData);
    return response.data;
  },

  async getConsultations(role: string) {
    const response = await apiClient.get(`/consultas/?role=${role}`);
    return response.data;
  },

  async startTriage(consultationId: number) {
    const response = await apiClient.post(`/consultas/${consultationId}/iniciar-atendimento`);
    return response.data;
  }
};
```

### 🗄️ FASE 4: Migração de Database (3-4 dias)

#### 4.1 Mapeamento de Schema

```sql
-- Schema Frontend (MySQL atual)
tb_usuario → User (Backend)
tb_profile → role (User.role)
tb_revendedor → ---- (Remover)
tb_consultas → Consultation (Backend)
tb_triagem → Triagem (Backend)
tb_pacientes → Patient (Backend)

-- Novo Schema SQLAlchemy
class User(Base):
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True)
    password_hash = Column(String)
    role = Column(Enum(UserRole))
    nome = Column(String)
    ativo = Column(Boolean, default=True)

class Patient(Base):
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    num_prontuario = Column(String, unique=True)
    data_nascimento = Column(Date)
    telefone = Column(String)

class Consultation(Base):
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    nurse_id = Column(Integer, ForeignKey("users.id"))
    doctor_id = Column(Integer, ForeignKey("users.id"))
    status = Column(Enum(ConsultationStatus))
    data_consulta = Column(DateTime)
    zoom_meeting_id = Column(String, nullable=True)
```

#### 4.2 Script de Migração
```python
# scripts/migrate_data.py
import mysql.connector
from sqlalchemy import create_engine
from backend.app.core.database import get_db
from backend.app.models import User, Patient, Consultation

def migrate_users():
    # Conectar ao MySQL atual
    mysql_conn = mysql.connector.connect(
        host='184.168.114.4',
        user='stix_prod_rw',
        password='t{UX9(x7s5*}',
        database='stix_app_user'
    )
    
    # Migrar usuários
    cursor = mysql_conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM tb_usuario")
    
    for user_row in cursor.fetchall():
        user = User(
            email=user_row['email'],
            password_hash=user_row['password'],
            role=map_role(user_row['codPerfil']),
            nome=user_row['nome'],
            ativo=user_row['ativo']
        )
        db.add(user)
    
    db.commit()
```

### 🎨 FASE 5: Integração de Serviços (4-5 dias)

#### 5.1 Integração Zoom SDK
```typescript
// lib/zoom-client.ts
export class ZoomClient {
  async createMeeting(consultationId: number) {
    const response = await apiClient.post(`/consultas/${consultationId}/create-zoom`);
    return response.data;
  }

  async joinMeeting(meetingId: string, password: string) {
    // Usar Zoom SDK do frontend
    return ZoomSDK.joinMeeting(meetingId, password);
  }
}
```

#### 5.2 Integração AWS S3
```python
# backend/app/services/s3_service.py
import boto3
from botocore.exceptions import NoCredentialsError

class S3Service:
    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION
        )
    
    async def upload_file(self, file_data: bytes, file_name: str, content_type: str):
        try:
            self.s3_client.put_object(
                Bucket=settings.AWS_S3_BUCKET,
                Key=file_name,
                Body=file_data,
                ContentType=content_type
            )
            return f"https://{settings.AWS_S3_BUCKET}.s3.amazonaws.com/{file_name}"
        except NoCredentialsError:
            raise Exception("AWS credentials not found")
```

#### 5.3 WebSockets para Tempo Real
```python
# backend/app/websockets/consultation_ws.py
from fastapi import WebSocket, WebSocketDisconnect

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            await connection.send_json(message)

manager = ConnectionManager()

@router.websocket("/ws/consultations/{consultation_id}")
async def websocket_endpoint(
    websocket: WebSocket, 
    consultation_id: int
):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            # Broadcast para outros usuários da consulta
            await manager.broadcast({
                "consultation_id": consultation_id,
                "message": data,
                "timestamp": datetime.utcnow()
            })
    except WebSocketDisconnect:
        manager.disconnect(websocket)
```

### 🚀 FASE 6: Deployment e Produção (2-3 dias)

#### 6.1 Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=mysql://root:password@db:3306/stixconnect
      - SECRET_KEY=${SECRET_KEY}
      - ZOOM_ACCOUNT_ID=${ZOOM_ACCOUNT_ID}
    depends_on:
      - db

  db:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=password
      - MYSQL_DATABASE=stixconnect
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

#### 6.2 Scripts de Deployment
```json
// package.json (raiz)
{
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:frontend": "cd frontend && npm run dev",
    "dev:backend": "cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000",
    "build": "npm run build:frontend && npm run build:backend",
    "build:frontend": "cd frontend && npm run build",
    "build:backend": "cd backend && docker build -t stixconnect-backend .",
    "deploy": "docker-compose up -d",
    "test": "npm run test:frontend && npm run test:backend",
    "test:frontend": "cd frontend && npm test",
    "test:backend": "cd backend && pytest"
  }
}
```

## 📊 Cronograma de Implementação

| Fase | Dias | Responsável | Status |
|------|------|-------------|---------|
| FASE 1: Configuração | 2-3 | DevOps | ⏳ |
| FASE 2: Autenticação | 3-4 | Backend + Frontend | ⏳ |
| FASE 3: APIs | 5-7 | Backend + Frontend | ⏳ |
| FASE 4: Database | 3-4 | Backend + DBA | ⏳ |
| FASE 5: Serviços | 4-5 | Full Stack | ⏳ |
| FASE 6: Deployment | 2-3 | DevOps | ⏳ |
| **TOTAL** | **19-26 dias** | **Equipe completa** | **⏳** |

## 🔧 Tecnologias e Ferramentas

### Backend Stack
- **Python 3.11+**
- **FastAPI 0.104.1**
- **SQLAlchemy 2.0.23**
- **Pydantic 2.5.0**
- **Uvicorn 0.24.0**
- **MySQL 8.0**
- **JWT (python-jose)**
- **Bcrypt (passlib)**
- **AWS SDK (boto3)**

### Frontend Stack
- **Next.js 15.2.0**
- **React 19.0.0**
- **TypeScript 5.0**
- **Tailwind CSS 3.4.1**
- **Axios (HTTP client)**
- **Zoom SDK 5.1.0**
- **FullCalendar 6.1.19**
- **AWS SDK 3.777.0**

### DevOps
- **Docker & Docker Compose**
- **GitHub Actions**
- **Nginx (proxy)**
- **PM2 (process manager)**

## ⚠️ Riscos e Mitigações

### Riscos Críticos
1. **Perda de dados durante migração**
   - Mitigation: Backup completo + rollback plan
2. **Incompatibilidade de schemas**
   - Mitigation: Análise detalhada + staging environment
3. **Downtime durante deployment**
   - Mitigation: Blue-green deployment + health checks

### Riscos Moderados
1. **Performance degradation**
   - Mitigation: Load testing + caching strategies
2. **Complexidade de roles**
   - Mitigation: Documentação + treinamento da equipe

## 📈 Métricas de Sucesso

### Técnicas
- [ ] Tempo de resposta < 200ms para APIs principais
- [ ] 99.9% uptime para serviços críticos
- [ ] Zero data loss na migração
- [ ] Todos os testes passando (>90% coverage)

### Negócio
- [ ] Usuários conseguem fazer login sem problemas
- [ ] Telemedicina funcionando perfeitamente
- [ ] Agenda de consultas operacional
- [ ] Upload de arquivos funcionando

## 🎯 Entregáveis

### Documentação
- [ ] API Documentation atualizada
- [ ] Manual de deployment
- [ ] Guia de migração
- [ ] Diagramas de arquitetura

### Código
- [ ] Backend FastAPI atualizado
- [ ] Frontend Next.js integrado
- [ ] Scripts de migração
- [ ] Docker configs

### Testes
- [ ] Testes unitários (backend + frontend)
- [ ] Testes de integração
- [ ] Testes E2E (Cypress/Playwright)
- [ ] Testes de carga

---

## 📞 Contato e Suporte

**Equipe de Desenvolvimento:**
- Backend Developer: [Nome] - [Email]
- Frontend Developer: [Nome] - [Email]  
- DevOps Engineer: [Nome] - [Email]
- Project Manager: [Nome] - [Email]

**Canais de Comunicação:**
- Slack: #stixconnect-integration
- Email: dev-team@stixconnect.com
- Jira: STIX-123 (Integration Project)

---

*Última atualização: 18/01/2026*
*Versão: 1.0*
*Status: Planning*