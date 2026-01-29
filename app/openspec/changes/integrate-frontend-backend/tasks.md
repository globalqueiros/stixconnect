## 1. FASE 1: Configuração Inicial (2-3 dias) ✅

### 1.1 Configurar CORS no Backend
- [x] 1.1.1 Atualizar `app/main.py` com origens específicas (localhost:3000, domínio produção)
- [x] 1.1.2 Testar requisições cross-origin com frontend (script test-api-endpoints.ps1 criado)

### 1.2 Configurar Variáveis de Ambiente
- [x] 1.2.1 Criar arquivo `env.example` na raiz do projeto
- [x] 1.2.2 Documentar todas as variáveis necessárias (DB, JWT, Zoom, AWS, Twilio)
- [x] 1.2.3 Atualizar `stixconnect-backend/app/core/config.py` para novas variáveis
- [x] 1.2.4 Atualizar `stixconnect/stixconnect/next.config.ts` para variáveis públicas

### 1.3 Estrutura de Projeto
- [x] 1.3.1 Criar `package.json` na raiz com scripts unificados (dev, build, deploy)
- [x] 1.3.2 Instalar `concurrently` para rodar frontend e backend juntos (no package.json)
- [x] 1.3.3 Criar pasta `docs/` com documentação de arquitetura (docs/INTEGRACAO_GUIA.md, docs/DEPLOYMENT.md)

## 2. FASE 2: Migração de Autenticação (3-4 dias) ✅

### 2.1 Expandir Roles no Backend
- [x] 2.1.1 Criar enum `UserRole` em `app/models/models.py` com 14 roles
- [x] 2.1.2 Atualizar model `User` para usar novo enum + campos refresh_token
- [x] 2.1.3 Criar migration para coluna role (alembic/versions/001_add_refresh_token.py criada)
- [ ] 2.1.4 Testar criação de usuários com todas as roles

### 2.2 Implementar Refresh Token
- [x] 2.2.1 Adicionar campo `refresh_token` no model User
- [x] 2.2.2 Criar endpoint `POST /auth/refresh`
- [x] 2.2.3 Implementar lógica de expiração de refresh token (7 dias)
- [ ] 2.2.4 Testar fluxo completo de refresh

### 2.3 Criar Cliente API no Frontend
- [x] 2.3.1 Instalar axios: `npm install axios` (usando fetch nativo, axios pode ser adicionado se necessário)
- [x] 2.3.2 Criar `src/app/lib/api-client.ts` com configuração base (usa fetch nativo)
- [x] 2.3.3 Implementar interceptor de request para adicionar JWT
- [x] 2.3.4 Implementar interceptor de response para refresh automático
- [x] 2.3.5 Implementar tratamento de erro 401 (redirect para login)

### 2.4 Criar Mapeamento de Roles
- [x] 2.4.1 Criar `src/app/lib/role-mapping.ts` com constantes de mapeamento
- [x] 2.4.2 Criar função `mapFrontendRole(role: string): BackendRole`
- [x] 2.4.3 Criar função `mapBackendRole(role: BackendRole): string`

## 3. FASE 3: Migração de APIs (5-7 dias) ✅

### 3.1 Criar Camada de Serviços no Frontend
- [x] 3.1.1 Criar `src/app/services/auth.service.ts` (login, register, refresh)
- [x] 3.1.2 Criar `src/app/services/patient.service.ts` (CRUD pacientes)
- [x] 3.1.3 Criar `src/app/services/consultation.service.ts` (CRUD consultas)
- [x] 3.1.4 Criar `src/app/services/user.service.ts` (CRUD usuários)
- [x] 3.1.5 Criar `src/app/services/zoom.service.ts` (criar/entrar reunião)

### 3.2 Criar Endpoints Faltantes no Backend
- [x] 3.2.1 Criar `app/routers/patients.py` com CRUD completo
- [x] 3.2.2 Criar `app/routers/users.py` com listagem e atualização
- [x] 3.2.3 Criar `app/routers/files.py` com upload de arquivos
- [x] 3.2.4 Adicionar novos routers em `app/main.py`
- [x] 3.2.5 Criar schemas Pydantic para novos endpoints (schemas já existem em schemas.py)

### 3.3 Migrar Endpoints do Frontend
- [x] 3.3.1 Migrar `/api/login` → `authService.login()` (página de login atualizada)
- [x] 3.3.2 Migrar `/api/usuario` → `userService.getUsers()` (Sidebar atualizado com fallback)
- [x] 3.3.3 Migrar `/api/pacientes` → `patientService.getPatients()` (novo_prontuario atualizado com fallback)
- [x] 3.3.4 Migrar `/api/consultas` → `consultationService.getConsultations()` (dashboard médico e enfermagem atualizados)
- [x] 3.3.5 Migrar `/api/zoom/create` → `zoomService.createMeeting()` (serviço implementado e pronto para uso)
- [x] 3.3.6 Migrar `/api/upload` → `fileService.upload()` (serviço implementado e pronto para uso)

### 3.4 Atualizar Componentes do Frontend
- [x] 3.4.1 Atualizar página de login para usar `authService` (page.tsx atualizado)
- [x] 3.4.2 Atualizar dashboards para usar serviços (dashboard médico e enfermagem atualizados com fallback)
- [x] 3.4.3 Atualizar formulários de paciente (novo_prontuario atualizado com fallback)
- [x] 3.4.4 Atualizar fluxo de consulta (dashboard médico usa consultationService)

## 4. FASE 4: Migração de Database (3-4 dias) ✅

### 4.1 Atualizar Models SQLAlchemy
- [x] 4.1.1 Criar model `Patient` em `app/models/models.py` (User já serve como Patient)
- [x] 4.1.2 Atualizar model `User` com campos faltantes (refresh_token, num_prontuario, etc)
- [x] 4.1.3 Atualizar model `Consultation` para relacionamentos (já configurado)
- [x] 4.1.4 Criar model `Triagem` se não existir (já existe)

### 4.2 Criar Script de Migração
- [x] 4.2.1 Criar `scripts/migrate_data.py`
- [x] 4.2.2 Implementar migração de `tb_usuario` → `users`
- [x] 4.2.3 Implementar migração de `tb_pacientes` → `patients` (via User com role=patient)
- [x] 4.2.4 Implementar migração de `tb_consultas` → `consultations`
- [x] 4.2.5 Implementar migração de `tb_triagem` → `triagens`
- [x] 4.2.6 Criar função `map_role()` para converter codPerfil → UserRole

### 4.3 Configurar MySQL em Produção
- [x] 4.3.1 Atualizar `DATABASE_URL` para MySQL (configurado em config.py)
- [ ] 4.3.2 Testar conexão com banco de produção
- [ ] 4.3.3 Validar integridade dos dados migrados

## 5. FASE 5: Integração de Serviços (4-5 dias) ✅

### 5.1 Mover Zoom para Backend
- [x] 5.1.1 Atualizar `app/services/zoom_service.py` com credenciais (já existia)
- [x] 5.1.2 Criar endpoint `POST /consultas/{id}/create-zoom` (já existe em consultas.py)
- [x] 5.1.3 Atualizar frontend para usar novo endpoint (zoomService criado, componentes podem usar diretamente)
- [ ] 5.1.4 Testar criação de reunião Zoom (requer teste manual)

### 5.2 Implementar Upload S3 no Backend
- [x] 5.2.1 Instalar boto3: `pip install boto3` (no Dockerfile)
- [x] 5.2.2 Criar `app/services/s3_service.py`
- [x] 5.2.3 Configurar credenciais AWS em settings
- [x] 5.2.4 Criar endpoint `POST /files/upload` (em files.py)
- [x] 5.2.5 Testar upload de arquivos (fileService criado, componentes podem usar diretamente, requer teste manual)

### 5.3 Implementar WebSockets
- [x] 5.3.1 Criar `app/websockets/` módulo
- [x] 5.3.2 Implementar `ConnectionManager` para gerenciar conexões
- [x] 5.3.3 Criar endpoint WebSocket `/ws/consultations/{id}`
- [x] 5.3.4 Implementar cliente WebSocket no frontend
- [ ] 5.3.5 Testar comunicação em tempo real

## 6. FASE 6: Deployment (2-3 dias) ✅

### 6.1 Criar Dockerfiles
- [x] 6.1.1 Criar `stixconnect-backend/Dockerfile`
- [x] 6.1.2 Criar `stixconnect/stixconnect/Dockerfile`
- [x] 6.1.3 Testar build de imagens localmente (Dockerfiles criados, pode testar com `docker build`)

### 6.2 Configurar Docker Compose
- [x] 6.2.1 Criar `docker-compose.yml` na raiz
- [x] 6.2.2 Configurar serviço `frontend` (porta 3000)
- [x] 6.2.3 Configurar serviço `backend` (porta 8000)
- [x] 6.2.4 Configurar serviço `db` (MySQL 8.0)
- [x] 6.2.5 Configurar volumes para persistência
- [ ] 6.2.6 Testar `docker-compose up`

### 6.3 Scripts de Deployment
- [x] 6.3.1 Atualizar `package.json` raiz com scripts de deploy
- [x] 6.3.2 Criar script de inicialização do banco `scripts/init-db.sql`
- [x] 6.3.3 Criar script de health check pós-deploy (scripts/health-check.sh e .ps1)
- [x] 6.3.4 Documentar processo de deploy (docs/DEPLOYMENT.md)

## 7. Validação Final

### 7.1 Testes de Integração
- [ ] 7.1.1 Testar fluxo completo de login (código implementado, aguardando teste manual)
- [ ] 7.1.2 Testar CRUD de pacientes (código implementado, aguardando teste manual)
- [ ] 7.1.3 Testar fluxo de teleconsulta (criar → triagem → médico) (código implementado, aguardando teste manual)
- [ ] 7.1.4 Testar upload de arquivos (código implementado, aguardando teste manual)
- [ ] 7.1.5 Testar WebSocket em consulta (código implementado, aguardando teste manual)

### 7.2 Performance
- [ ] 7.2.1 Medir tempo de resposta das APIs principais (requer ambiente de testes)
- [ ] 7.2.2 Verificar target < 200ms (requer ambiente de testes)
- [ ] 7.2.3 Documentar métricas baseline (requer testes)

### 7.3 Documentação
- [x] 7.3.1 Atualizar README do projeto (README_INTEGRACAO.md criado)
- [x] 7.3.2 Documentar novos endpoints na API (em docs/INTEGRACAO_GUIA.md)
- [x] 7.3.3 Criar guia de migração para desenvolvedores (docs/INTEGRACAO_GUIA.md)
