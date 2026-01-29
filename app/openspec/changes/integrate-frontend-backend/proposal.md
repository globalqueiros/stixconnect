# Change: Integração Frontend Next.js com Backend FastAPI

## Why
O sistema StixConnect atualmente possui o frontend Next.js fazendo acesso direto ao banco de dados MySQL via API Routes, o que viola a separação de responsabilidades e dificulta escalabilidade, segurança e manutenção. Esta mudança migra toda a lógica de negócios para o backend FastAPI existente, estabelecendo uma arquitetura de microserviços bem definida.

## What Changes

### FASE 1: Configuração Inicial
- Configurar CORS no backend FastAPI para permitir requisições do frontend
- Criar estrutura de variáveis de ambiente compartilhadas
- Configurar Docker Compose para orquestração dos serviços

### FASE 2: Autenticação (**BREAKING**)
- **BREAKING**: Migrar autenticação do frontend para backend FastAPI via JWT
- Expandir sistema de 4 roles para 14 roles (admin, doctor, nurse, receptionist, physiotherapist, nutritionist, hairdresser, psychologist, speech_therapist, acupuncturist, clinical_psypedagogist, caregiver, patient, supervisor)
- Implementar cliente API (`apiClient`) no frontend com interceptors para JWT
- Adicionar lógica de refresh token

### FASE 3: Migração de APIs (**BREAKING**)
- **BREAKING**: Substituir API Routes do Next.js por chamadas ao backend FastAPI
- Criar endpoints faltantes no backend: `/patients`, `/files/upload`, `/users`
- Criar camada de serviços no frontend: `authService`, `consultationService`, `patientService`
- Adaptar formato de requisições/respostas entre sistemas

### FASE 4: Migração de Database
- Migrar schema do MySQL legado para SQLAlchemy models
- Criar scripts de migração de dados (`migrate_data.py`)
- Unificar schema de usuários, pacientes e consultas

### FASE 5: Integração de Serviços
- Mover integração Zoom para backend (criação de reuniões)
- Adicionar serviço S3 no backend para upload de arquivos
- Implementar WebSockets para comunicação em tempo real durante consultas

### FASE 6: Deployment
- Criar Dockerfiles para frontend e backend
- Configurar docker-compose.yml para orquestração
- Criar scripts de deployment unificados

## Impact

### Affected Specs (novas capabilities)
- `backend-integration` - Configuração e comunicação frontend↔backend
- `user-authentication` - Sistema de autenticação JWT com 14 roles
- `api-migration` - Endpoints migrados e novos
- `file-storage` - Upload de arquivos via S3
- `realtime-communication` - WebSockets para consultas
- `deployment` - Configuração Docker e scripts

### Affected Code

#### Backend (stixconnect-backend/)
- `app/main.py` - CORS configuration
- `app/core/security.py` - Expansão de roles
- `app/models/models.py` - Novos models (Patient)
- `app/routers/` - Novos routers (patients.py, files.py)
- `app/services/` - Novo serviço S3
- `app/websockets/` - Novo módulo WebSocket

#### Frontend (stixconnect/stixconnect/)
- `src/app/lib/api-client.ts` - Novo cliente HTTP
- `src/app/services/` - Nova camada de serviços
- `src/app/api/` - API Routes serão deprecadas gradualmente
- `src/app/(main)/` - Componentes atualizados para usar serviços

### Breaking Changes
1. **Autenticação**: Tokens JWT passam a ser gerenciados pelo backend FastAPI
2. **API Endpoints**: Formato de URLs muda de `/api/X` para `http://localhost:8000/X`
3. **Roles**: Sistema de 4 roles expandido para 14 roles

### Cronograma Estimado
- FASE 1: 2-3 dias
- FASE 2: 3-4 dias
- FASE 3: 5-7 dias
- FASE 4: 3-4 dias
- FASE 5: 4-5 dias
- FASE 6: 2-3 dias
- **TOTAL: 19-26 dias**

### Riscos
1. **Perda de dados durante migração** → Backup completo + rollback plan
2. **Incompatibilidade de schemas** → Análise detalhada + staging environment
3. **Downtime durante deployment** → Blue-green deployment + health checks
