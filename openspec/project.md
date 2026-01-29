# Project Context

## Purpose
StixConnect é um sistema de telemedicina/teleconsulta médica que conecta pacientes a profissionais de saúde (médicos, enfermeiros, fisioterapeutas, nutricionistas, etc.) através de videochamadas integradas com Zoom. O sistema inclui:

- **StixConnect Frontend**: Plataforma web para pacientes e profissionais de saúde realizarem teleconsultas
- **Nexus Admin**: Painel administrativo para gestão do sistema, pacientes e profissionais
- **StixConnect Backend**: API backend em FastAPI para lógica de negócios, autenticação e integração Zoom

O objetivo principal é permitir consultas médicas online com triagem de enfermagem, prontuário eletrônico, agendamento e videochamadas em tempo real.

## Tech Stack

### Frontend - StixConnect (porta 3000)
- **Framework**: Next.js 15.2.0 com TypeScript 5
- **React**: 19.0.0
- **Estilização**: Tailwind CSS 3.4.1 + Bootstrap 5.3
- **Animações**: Framer Motion 12.5.0
- **Ícones**: Font Awesome 6.7.2, Lucide React, Iconify
- **Calendário**: FullCalendar 6.1.19
- **Autenticação**: NextAuth 4.24.11 + JWT (jsonwebtoken)
- **HTTP Client**: Cliente API customizado (fetch nativo) com interceptors JWT e refresh automático
- **Service Layer**: Camada de serviços para comunicação com backend FastAPI (auth, patient, consultation, user, zoom, file)
- **Integrações**: Zoom SDK 5.1.0, AWS S3 (SDK 3.777.0), Twilio 5.5.1
- **WebSockets**: Cliente WebSocket para comunicação em tempo real durante consultas
- **Utilidades**: clsx, tailwind-merge, dayjs
- **Legado**: mysql2 ainda usado em algumas API Routes (migração em andamento)

### Frontend - Nexus Admin (porta 3001)
- **Framework**: Next.js 15.5.3 com TypeScript 5
- **React**: 19.1.0
- **Estilização**: Tailwind CSS 4 + Bootstrap 5.3.8
- **Autenticação**: NextAuth 4.24.11 + jose + jsonwebtoken
- **Ícones**: Font Awesome 7.0.1, Lucide React, React Icons
- **Forms**: React Select, React Input Mask
- **Pagamentos**: Stripe 20.0.0
- **Segurança**: bcryptjs, react-google-recaptcha

### Backend - StixConnect API (porta 8000)
- **Linguagem**: Python 3.11+
- **Framework**: FastAPI 0.104.1 (versão API: 2.0.0)
- **Servidor**: Uvicorn 0.24.0
- **ORM**: SQLAlchemy 2.0.23
- **Migrações**: Alembic (versionamento de schema do banco de dados)
- **Validação**: Pydantic 2.5.0 + pydantic-settings 2.1.0 + email-validator 2.3.0
- **Autenticação**: python-jose[cryptography] 3.3.0 (JWT com refresh tokens)
- **Hashing**: passlib[bcrypt] 1.7.4
- **Config**: python-dotenv 1.0.0
- **HTTP**: requests 2.31.0
- **WebSockets**: FastAPI WebSockets nativo para comunicação em tempo real durante consultas
- **File Upload**: python-multipart 0.0.6
- **AWS**: boto3 1.34.0 (S3 para armazenamento de arquivos)
- **Database**: SQLite (desenvolvimento) → MySQL/MariaDB (produção via mysql-connector-python 8.2.0)

### Banco de Dados
- **Produção**: MySQL 8.0 / MariaDB
- **Desenvolvimento**: SQLite (backend), MySQL direto (frontend)
- **ORM**: SQLAlchemy (backend), mysql2 raw queries (frontend)
- **Migrações**: Alembic para versionamento de schema (ex: `001_add_refresh_token.py`)
- **Cache**: Redis 7-alpine (sessões e cache)

### DevOps
- **Docker & Docker Compose**: Configurado para orquestração completa (frontend, backend, MySQL, Redis)
- **Redis**: Cache e sessões (porta 6379)
- **Scripts de Desenvolvimento**: Scripts PowerShell para execução local (`start-backend.ps1`, `start-frontend.ps1`)
- **Health Checks**: Scripts para verificação de saúde dos serviços (`health-check.ps1`, `health-check.sh`)
- **Migrações de Banco**: Alembic para versionamento de schema (migrações em `alembic/versions/`)
- **GitHub Actions**: Planejado
- **Nginx**: Planejado (proxy reverso)
- **PM2**: Planejado (process manager)

## Project Conventions

### Code Style

#### TypeScript/JavaScript (Frontend)
- Usar **TypeScript estrito** em todo o código
- Componentes React como **funções com arrow functions**
- Nomes de componentes em **PascalCase**: `NavbarSlides.tsx`, `Sidebar.tsx`
- Nomes de arquivos de página: `page.tsx` (convenção Next.js App Router)
- Nomes de rotas API: `route.ts` (convenção Next.js App Router)
- Imports organizados: React primeiro, depois libs externas, depois locais
- Usar **const** para declarações, evitar **let** quando possível
- Strings com **aspas duplas** em JSX, **aspas simples** em código

#### Python (Backend)
- Seguir **PEP 8** para estilo de código
- Type hints obrigatórios em funções públicas
- Docstrings para módulos, classes e funções públicas
- Nomes de variáveis/funções em **snake_case**
- Classes em **PascalCase**
- Constantes em **UPPER_SNAKE_CASE**
- Usar **f-strings** para interpolação de strings

#### Convenções Gerais
- Comentários e mensagens de erro em **Português (Brasil)**
- Nomes de variáveis podem ser em português (ex: `ativo`, `nome`, `email`)
- Indentação: 2 espaços (frontend), 4 espaços (backend)
- Sempre terminar arquivos com linha em branco

### Architecture Patterns

#### Frontend (Next.js App Router)
```
src/app/
├── (main)/              # Grupo de rotas - área logada
│   ├── administrador/   # Dashboard do admin
│   │   ├── components/  # Componentes específicos
│   │   ├── lib/         # Utilidades específicas
│   │   └── layout.tsx   # Layout do role
│   ├── medico/          # Dashboard do médico
│   ├── enfermagem/      # Dashboard da enfermagem
│   └── [role]/          # Outros profissionais
├── api/                 # API Routes (REST endpoints - legado)
│   ├── login/route.ts   # Autenticação (em migração)
│   ├── pacientes/       # CRUD pacientes (em migração)
│   └── zoom/            # Integração Zoom (em migração)
├── lib/                 # Utilitários globais
│   ├── api-client.ts    # Cliente HTTP (Axios) com JWT e refresh automático
│   │                     # - Interceptors para adicionar token Bearer
│   │                     # - Refresh automático de tokens expirados
│   │                     # - Armazenamento de tokens em localStorage
│   ├── websocket-client.ts # Cliente WebSocket para consultas
│   ├── role-mapping.ts  # Mapeamento de roles PT ↔ EN
│   ├── migration-helper.ts # Helpers para migração gradual
│   ├── db.ts            # Conexão MySQL (legado - em migração)
│   ├── utils.tsx        # Funções auxiliares
│   └── zoomAuth.ts      # Auth Zoom SDK
├── services/            # Camada de serviços (comunicação com backend)
│   ├── auth.service.ts  # Autenticação (login, refresh, logout)
│   ├── patient.service.ts # CRUD pacientes
│   ├── consultation.service.ts # Consultas (CRUD, triagem, Zoom)
│   ├── user.service.ts  # Usuários (perfil próprio)
│   ├── zoom.service.ts  # Zoom (criação de reuniões)
│   ├── file.service.ts  # Upload de arquivos (S3)
│   └── index.ts         # Exports centralizados
└── components/          # Componentes globais
```

#### Backend (FastAPI)
```
app/
├── main.py              # Entry point + CORS + routers
├── core/
│   ├── config.py        # Settings (pydantic-settings)
│   ├── database.py      # SQLAlchemy engine + session
│   └── security.py      # JWT + password hashing + RBAC decorators
├── models/
│   └── models.py        # SQLAlchemy models (User, Consulta, Triagem, etc.)
├── routers/
│   ├── auth.py          # /auth endpoints (login, refresh, logout, me)
│   ├── consultas.py     # /consultas endpoints (CRUD, triagem, Zoom)
│   ├── admin.py         # /admin endpoints (estatísticas, relatórios)
│   ├── patients.py      # /patients endpoints (CRUD pacientes)
│   ├── users.py         # /users endpoints (perfil próprio + /admin/users para admins)
│   └── files.py         # /files endpoints (upload S3, tipos: PDF, imagens, DICOM)
├── schemas/
│   └── schemas.py       # Pydantic schemas (request/response)
├── services/
│   ├── zoom_service.py  # Integração Zoom API
│   └── s3_service.py    # Upload de arquivos para AWS S3
└── websockets/
    ├── connection_manager.py # Gerenciamento de conexões WebSocket (broadcast, rooms)
    └── consultation_ws.py    # Endpoint WebSocket para consultas (/ws/consultation/{id})
```

#### Padrões Arquiteturais
- **Service Layer Pattern** no frontend: camada de serviços abstrai comunicação com backend FastAPI
- **API Client Pattern**: cliente HTTP centralizado (Axios) com interceptors para JWT e refresh automático
  - Interceptor de requisição: adiciona `Authorization: Bearer {token}` automaticamente
  - Interceptor de resposta: detecta 401 e renova token automaticamente
  - Armazenamento de tokens em `localStorage` (access_token, refresh_token)
- **Repository Pattern** implícito com SQLAlchemy no backend
- **Dependency Injection** via FastAPI `Depends()` para database sessions e autenticação
- **Role-Based Access Control (RBAC)** com 14 perfis de usuário e decorators (`require_roles`, `require_admin`, `require_clinical`)
- **JWT Bearer Token** com refresh tokens (expiração: 30min access, 7 dias refresh)
- **WebSocket Pattern**: comunicação em tempo real durante consultas médicas (FastAPI WebSockets)
- **Gradual Migration**: API Routes legadas (`/api/*`) coexistindo com novos serviços durante transição para backend FastAPI

### Testing Strategy
- Testes unitários com **pytest** (backend) - planejado
- Testes de integração para endpoints críticos - planejado
- Testes E2E planejados com **Cypress** ou **Playwright** - planejado
- Scripts de teste PowerShell criados (`test-api-endpoints.ps1`, `test-integration.ps1`)
- Coverage target: >90% para código crítico (autenticação, pagamentos)
- Validação manual para fluxos de teleconsulta com Zoom
- Health check scripts para verificação de serviços (`health-check.ps1`)

### Git Workflow
- **Branch principal**: `main` (produção)
- **Branches de feature**: `feature/nome-da-feature`
- **Branches de bugfix**: `fix/descricao-do-bug`
- **Commits**: Mensagens em português, descritivas
- **Pull Requests** obrigatórios para `main`
- Formato de commit sugerido: `[tipo] descrição` (ex: `[feat] adiciona endpoint de triagem`)

## Domain Context

### Fluxo de Teleconsulta
1. **Paciente** solicita consulta
2. **Enfermeira** realiza triagem inicial (classificação de urgência)
3. **Sistema** gera link Zoom para videochamada
4. **Enfermeira** transfere para **Médico** após triagem
5. **Médico** realiza atendimento e registra no prontuário
6. **Sistema** finaliza consulta e armazena dados

### Perfis de Usuário (14 roles)
| Role (Backend) | Perfil (Frontend) | Descrição |
|---------------|-------------------|-----------|
| admin | Administrador | Gestão total do sistema |
| doctor | Médico | Atendimento médico |
| nurse | Enfermeiro | Triagem e enfermagem |
| receptionist | Atendente | Recepção e agendamento |
| physiotherapist | Fisioterapeuta | Consultas fisioterapia |
| nutritionist | Nutricionista | Consultas nutrição |
| hairdresser | Cabeleireiro | Serviços estéticos |
| psychologist | Psicóloga | Consultas psicologia |
| speech_therapist | Fonoaudióloga | Consultas fonoaudiologia |
| acupuncturist | Acupuntura | Consultas acupuntura |
| clinical_psypedagogist | Psicopedagoga_clinica | Psicopedagogia |
| caregiver | Cuidador | Acompanhamento |
| patient | (vários) | Pacientes |
| supervisor | Supervisor | Supervisão |

### Termos do Domínio
- **Prontuário**: Ficha médica do paciente (número único: `num_prontuario`)
- **Triagem**: Avaliação inicial de enfermagem antes da consulta médica
- **Teleconsulta**: Consulta médica por videochamada
- **Protocolo**: Número de identificação de atendimento

## Important Constraints

### Técnicas
- **Compatibilidade de navegadores**: Chrome, Firefox, Safari, Edge (últimas 2 versões)
- **Zoom SDK**: Requer credenciais de conta Zoom com permissão Server-to-Server OAuth
- **CORS**: Backend configurado para permitir origens específicas (`localhost:3000`, `stixconnect.com`, `stixconnect.vercel.app`)
- **Database**: Conexões MySQL limitadas a 100 simultâneas
- **JWT**: Tokens de acesso expiram em 30 minutos; refresh tokens expiram em 7 dias (implementado)
- **WebSockets**: Suporte nativo do FastAPI para comunicação em tempo real durante consultas (`/ws/consultation/{id}`)
- **File Upload**: Limite de tamanho configurável via FastAPI (padrão: 10MB). Tipos permitidos: PDF, JPEG, PNG, DICOM
- **Redis**: Cache e sessões (porta 6379, Docker Compose)
- **Migrações**: Alembic para versionamento de schema (executar antes de deploy)

### Negócios
- **LGPD**: Dados de saúde são sensíveis - criptografia e controle de acesso obrigatórios
- **CFM**: Consultas médicas devem seguir regulamentações do Conselho Federal de Medicina
- **Auditoria**: Todas as ações de usuários devem ser logadas
- **Uptime**: Sistema deve ter 99.9% de disponibilidade em horário comercial

### Segurança
- Senhas hasheadas com **bcrypt** (mínimo 12 caracteres)
- Todas as APIs protegidas com JWT (exceto login/register)
- Refresh tokens invalidados no logout
- Interceptors automáticos para renovação de tokens expirados
- Rate limiting em endpoints de autenticação (planejado)
- Dados médicos nunca expostos em logs
- Validação de email com **email-validator**
- CORS restritivo com origens específicas

## External Dependencies

### APIs e Serviços
| Serviço | Uso | Criticidade |
|---------|-----|-------------|
| **Zoom SDK** | Videochamadas de teleconsulta (Server-to-Server OAuth) | Alta |
| **AWS S3** | Armazenamento de arquivos/exames (PDF, imagens, DICOM) | Média |
| **Twilio** | Notificações SMS | Baixa |
| **Stripe** | Pagamentos (Nexus Admin) | Alta |
| **Redis** | Cache e sessões (Docker Compose) | Média |

### Banco de Dados
- **Host produção**: 184.168.114.4
- **Database**: stix_app_user
- **Usuário**: stix_prod_rw

### Credenciais Necessárias (.env)
```bash
# Database
DATABASE_URL=mysql://user:password@host:3306/database
DB_HOST=184.168.114.4
DB_USER=stix_prod_rw
DB_PASSWORD=
DB_NAME=stix_app_user
DB_PORT=3306

# JWT
SECRET_KEY= (mínimo 32 caracteres)
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Zoom (Server-to-Server OAuth)
ZOOM_ACCOUNT_ID=
ZOOM_CLIENT_ID=
ZOOM_CLIENT_SECRET=

# AWS S3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=stixconnect-files

# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=

# Stripe (Nexus Admin)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PUBLISHABLE_KEY=

# Aplicação
APP_NAME=StixConnect
DEBUG=true
NODE_ENV=development
```

### Principais Endpoints da API (Backend FastAPI)

#### Autenticação (`/auth`)
- `POST /auth/login` - Login com email/senha, retorna JWT tokens
- `POST /auth/refresh` - Renovar access token usando refresh token
- `POST /auth/logout` - Invalidar refresh token
- `GET /auth/me` - Obter dados do usuário autenticado

#### Consultas (`/consultas`)
- `GET /consultas/` - Listar consultas (filtrado por role do usuário)
- `POST /consultas/` - Criar nova consulta
- `GET /consultas/{id}` - Obter detalhes de uma consulta
- `PUT /consultas/{id}` - Atualizar consulta
- `POST /consultas/{id}/iniciar-atendimento` - Iniciar triagem
- `POST /consultas/{id}/finalizar-triagem` - Finalizar triagem
- `POST /consultas/{id}/transferir-medico/{medico_id}` - Transferir para médico
- `POST /consultas/{id}/create-zoom` - Criar reunião Zoom

#### Pacientes (`/patients`)
- `GET /patients/` - Listar pacientes (com paginação e busca)
- `POST /patients/` - Criar novo paciente
- `GET /patients/{id}` - Obter detalhes de um paciente
- `PUT /patients/{id}` - Atualizar paciente
- `DELETE /patients/{id}` - Deletar paciente (soft delete)

#### Usuários (`/users`)
- `GET /users/me` - Obter perfil próprio
- `PUT /users/me` - Atualizar perfil próprio
- `POST /users/me/change-password` - Alterar senha

#### Admin - Usuários (`/admin/users`)
- `GET /admin/users/` - Listar todos os usuários (admin only)
- `POST /admin/users/` - Criar novo usuário (admin only)
- `GET /admin/users/{id}` - Obter detalhes de um usuário (admin only)
- `PUT /admin/users/{id}` - Atualizar usuário (admin only)

#### Arquivos (`/files`)
- `POST /files/upload` - Upload de arquivo para S3 (PDF, imagens, DICOM)
- `GET /files/{id}` - Obter informações de um arquivo

#### Admin (`/admin`)
- `GET /admin/estatisticas` - Estatísticas do sistema
- `GET /admin/consultas` - Listar todas as consultas
- `GET /admin/relatorio-consultas` - Relatório detalhado de consultas

#### WebSocket (`/ws`)
- `WS /ws/consultation/{id}` - Conexão WebSocket para comunicação em tempo real durante consulta

**Nota**: O frontend também possui rotas API legadas (`/api/*`) que estão sendo gradualmente migradas para usar os serviços que comunicam com o backend FastAPI.

### Documentação de Referência
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Zoom Meeting SDK](https://developers.zoom.us/docs/meeting-sdk/)
- [Plano de Implementação](../PLANO_IMPLEMENTACAO_STIXCONNECT.md)
- [Guia de Integração](docs/INTEGRACAO_GUIA.md)
- [Guia de Execução Local](docs/INICIO_RAPIDO.md) - Execução sem Docker
- [README de Integração](README_INTEGRACAO.md)
- [API Docs Interativa](http://localhost:8000/docs) - Swagger UI do FastAPI

### Scripts Disponíveis (package.json raiz)
- `npm run dev` - Inicia frontend e backend simultaneamente
- `npm run dev:frontend` - Apenas frontend (porta 3000)
- `npm run dev:backend` - Apenas backend (porta 8000)
- `npm run dev:admin` - Nexus Admin (porta 3001)
- `npm run dev:integrated` - Frontend + backend + admin simultaneamente
- `npm run install:all` - Instala todas as dependências
- `npm run docker:up` - Inicia containers Docker (frontend, backend, MySQL, Redis)
- `npm run docker:down` - Para containers Docker
- `npm run docker:build` - Reconstruir containers Docker
- `npm run docker:logs` - Ver logs dos containers
- `npm run migrate` - Executa migração de dados
- `npm run test` - Executa testes (frontend + backend)
- `npm run lint` - Executa linting (frontend + backend)
- `npm run clean` - Limpa node_modules e caches