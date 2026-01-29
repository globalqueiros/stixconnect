# 🚀 StixConnect - Guia de Implementação e Integração

## 📋 Visão Geral

Este projeto integra o frontend Next.js do StixConnect com o backend FastAPI, criando uma plataforma unificada de telemedicina com múltiplos perfis de usuário.

## 🏗️ Arquitetura

```
┌─────────────────────┐    ┌─────────────────────┐
│   Frontend Next.js   │    │   Backend FastAPI    │
│   Porta 3000         │    │   Porta 8000         │
│                     │    │                     │
│ • 14 perfis usuário │◄──►│ • JWT Authentication │
│ • Zoom SDK          │    │ • MySQL Database    │
│ • AWS S3           │    │ • Zoom API         │
│ • FullCalendar      │    │ • File Upload      │
└─────────────────────┘    └─────────────────────┘
```

## 🚀 Início Rápido

### 1️⃣ Pré-requisitos

- **Node.js** >= 18.0.0
- **Python** >= 3.11.0
- **MySQL** >= 8.0
- **Docker** (opcional)

### 2️⃣ Instalação

```bash
# Clonar o repositório
git clone <repository-url>
cd stixconnect-integrated

# Instalar dependências
npm run install:all
```

### 3️⃣ Configurar Variáveis de Ambiente

Copiar o arquivo `.env.example` para `.env` e configurar:

```bash
cp .env.example .env
```

Variáveis obrigatórias:
- `DATABASE_URL` - URL do banco MySQL
- `SECRET_KEY` - Chave secreta para JWT
- `NEXTAUTH_SECRET` - Segredo do NextAuth
- `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET` - Credenciais Zoom

### 4️⃣ Iniciar Desenvolvimento

#### Opção A: Desenvolvimento Local

```bash
# Iniciar ambos os serviços
npm run dev

# Ou iniciar separadamente
npm run dev:frontend  # Next.js na porta 3000
npm run dev:backend   # FastAPI na porta 8000
```

#### Opção B: Docker

```bash
# Construir e iniciar containers
npm run docker:up

# Verificar logs
npm run docker:logs
```

## 📊 Estrutura do Projeto

```
stixconnect-integrated/
├── .env                    # Variáveis de ambiente
├── package.json            # Scripts unificados
├── docker-compose.yml      # Orquestração Docker
├── PLANO_IMPLEMENTACAO.md  # Plano completo
├── frontend/               # Aplicação Next.js
│   └── stixconnect/
│       ├── src/
│       │   ├── services/   # Serviços de API
│       │   ├── lib/       # Utilitários
│       │   └── app/       # Páginas e componentes
│       └── package.json
├── backend/                # API FastAPI
│   └── stixconnect-backend/
│       ├── app/
│       │   ├── models/    # SQLAlchemy models
│       │   ├── routers/   # API endpoints
│       │   ├── services/  # Lógica de negócio
│       │   └── core/      # Configuração
│       ├── scripts/        # Scripts de migração
│       └── requirements.txt
└── nexus_admin/           # Painel administrativo
    └── nexus_admin/
```

## 🔐 Autenticação

### Fluxo de Login

1. **Frontend** envia credenciais para `/auth/login`
2. **Backend** valida com MySQL
3. **Backend** gera JWT tokens (access + refresh)
4. **Frontend** armazena tokens e usuário
5. **Frontend** redireciona para rota do perfil

### Roles de Usuário (14 perfis)

| Role | Descrição | Rota Padrão |
|------|-----------|-------------|
| Administrador | Acesso total | `/administrador` |
| Médico | Consultas médicas | `/medico` |
| Enfermeiro | Triagem e acompanhamento | `/enfermagem` |
| Atendente | Recepção e agendamento | `/atendente` |
| Fisioterapeuta | Terapias físicas | `/fisioterapia` |
| Nutricionista | Aconselhamento nutricional | `/nutricao` |
| Cabeleireiro | Serviços de beleza | `/beleza` |
| Psicóloga | Saúde mental | `/psicologia` |
| Fonoaudióloga | Terapia da fala | `/fonoaudiologia` |
| Acupuntura | Medicina tradicional | `/acupuntura` |
| Psicopedagoga_clinica | Desenvolvimento infantil | `/psicopedagogia` |
| Cuidador | Cuidados domiciliares | `/cuidador` |
| Supervisor | Gestão de equipes | `/supervisor` |
| Paciente | Acesso ao paciente | `/paciente` |

## 🛠️ Comandos Úteis

### Desenvolvimento

```bash
npm run dev              # Iniciar frontend + backend
npm run dev:frontend     # Apenas frontend
npm run dev:backend      # Apenas backend
npm run dev:integrated   # Frontend + backend + admin
```

### Build e Deploy

```bash
npm run build            # Build frontend + backend
npm run build:frontend   # Build frontend
npm run build:backend    # Build Docker backend
```

### Testes

```bash
npm run test             # Executar todos os testes
npm run test:frontend    # Testes frontend
npm run test:backend     # Testes backend (pytest)
```

### Linting

```bash
npm run lint             # Lint frontend + backend
npm run lint:frontend    # Lint frontend
npm run lint:backend     # Lint backend (flake8)
```

### Docker

```bash
npm run docker:up        # Iniciar containers
npm run docker:down      # Parar containers
npm run docker:build     # Reconstruir containers
npm run docker:logs      # Ver logs
```

### Migração de Dados

```bash
npm run migrate          # Migrar dados do MySQL antigo
```

### Limpeza

```bash
npm run clean           # Limpar node_modules e caches
```

## 📡 Endpoints da API

### Autenticação

- `POST /auth/login` - Login de usuário
- `POST /auth/register` - Registro de novo usuário
- `POST /auth/refresh` - Refresh token
- `POST /auth/logout` - Logout

### Consultas

- `GET /consultas/` - Listar consultas (filtrado por role)
- `POST /consultas/` - Criar nova consulta
- `GET /consultas/{id}` - Buscar consulta específica
- `PUT /consultas/{id}` - Atualizar consulta

### Triagem

- `POST /consultas/{id}/iniciar-atendimento` - Iniciar triagem
- `POST /consultas/{id}/finalizar-triagem` - Finalizar triagem

### Zoom

- `POST /consultas/{id}/create-zoom` - Criar reunião Zoom

### Administração

- `GET /admin/estatisticas` - Estatísticas do sistema

## 🎨 Integração com Serviços

### Zoom SDK

```typescript
import { ZoomClient } from '@/lib/zoom-client';

const zoomClient = new ZoomClient();
const meeting = await zoomClient.createMeeting(consultationId);
await zoomClient.joinMeeting(meeting.id, meeting.password);
```

### AWS S3

```python
# Backend
from app.services.s3_service import S3Service

s3_service = S3Service()
file_url = await s3_service.upload_file(file_data, file_name, content_type)
```

### FullCalendar

```typescript
// Frontend
import { consultationService } from '@/services/consultation.service';

const consultations = await consultationService.getConsultations('medico');
// Usar dados no FullCalendar
```

## 🔧 Configuração de Ambiente

### Desenvolvimento

```bash
# .env (desenvolvimento)
DATABASE_URL=mysql://user:password@localhost:3306/stixconnect
BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:8000
NODE_ENV=development
DEBUG=true
```

### Produção

```bash
# .env (produção)
DATABASE_URL=mysql://user:password@prod-db:3306/stixconnect
BACKEND_URL=https://api.stixconnect.com
NEXT_PUBLIC_API_URL=https://api.stixconnect.com
NODE_ENV=production
DEBUG=false
```

## 🚨 Troubleshooting

### Problemas Comuns

#### 1. Erro de CORS

**Sintoma:** Frontend não consegue se comunicar com backend

**Solução:**
```bash
# Verificar configuração CORS no backend
# Em backend/app/main.py:
ALLOWED_ORIGINS = ["http://localhost:3000", "https://seu-dominio.com"]
```

#### 2. Erro de conexão MySQL

**Sintoma:** Backend não conecta ao banco de dados

**Solução:**
```bash
# Verificar string de conexão
# Verificar se MySQL está rodando
mysql -h host -u user -p
```

#### 3. Token JWT inválido

**Sintoma:** Erro 401 ao fazer requisições autenticadas

**Solução:**
```bash
# Limpar tokens locais
localStorage.removeItem('access_token')
localStorage.removeItem('refresh_token')
# Fazer login novamente
```

#### 4. Zoom não funciona

**Sintoma:** Erro ao criar reunião Zoom

**Solução:**
```bash
# Verificar credenciais Zoom
ZOOM_ACCOUNT_ID=seu_account_id
ZOOM_CLIENT_ID=seu_client_id
ZOOM_CLIENT_SECRET=seu_client_secret
```

### Logs

```bash
# Logs do backend
npm run dev:backend  # Ver logs no console
# Ou em Docker
npm run docker:logs

# Logs do frontend
npm run dev:frontend  # Ver logs no console
```

## 📈 Monitoramento

### Health Checks

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000/health`
- API Docs: `http://localhost:8000/docs`

### Métricas

- Tempo de resposta < 200ms
- Taxa de erro < 1%
- Uptime > 99.9%

## 🔄 Deploy

### Vercel (Frontend)

```bash
# Build
npm run build:frontend

# Deploy
vercel --prod
```

### Docker (Backend)

```bash
# Build
docker build -t stixconnect-backend ./stixconnect-backend

# Run
docker run -p 8000:8000 stixconnect-backend
```

### Docker Compose

```bash
# Deploy completo
npm run docker:up -- -d
```

## 📞 Suporte

- **Documentação API:** `http://localhost:8000/docs`
- **Email:** dev-team@stixconnect.com
- **Slack:** #stixconnect-integration

---

## 🎯 Próximos Passos

1. ✅ Configurar ambiente
2. ✅ Implementar autenticação
3. 🔄 Migrar dados existentes
4. 🔄 Testar integração completa
5. 🔄 Deploy em produção

**Status:** 🚧 Em desenvolvimento

---

*Última atualização: 18/01/2026*