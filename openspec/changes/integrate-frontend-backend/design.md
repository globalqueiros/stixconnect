## Context

O StixConnect é um sistema de telemedicina que atualmente possui:
- **Frontend Next.js** (porta 3000) com acesso direto ao MySQL via API Routes
- **Backend FastAPI** (porta 8000) com lógica de negócios parcialmente implementada
- **Banco de dados MySQL** compartilhado entre ambos

A arquitetura atual viola princípios de separação de responsabilidades e dificulta:
- Escalabilidade horizontal
- Segurança (credenciais de banco expostas no frontend)
- Manutenção (lógica duplicada)
- Testes automatizados

**Stakeholders**: Equipe de desenvolvimento, DevOps, administradores do sistema.

## Goals / Non-Goals

### Goals
- Centralizar toda lógica de negócios no backend FastAPI
- Estabelecer comunicação frontend↔backend via REST API
- Unificar sistema de autenticação JWT
- Manter compatibilidade com fluxos de usuário existentes
- Implementar WebSockets para tempo real
- Dockerizar toda a stack

### Non-Goals
- Reescrever o frontend do zero
- Migrar para outro banco de dados (manter MySQL)
- Implementar GraphQL
- Adicionar novas features de negócio (foco na migração)

## Decisions

### 1. Arquitetura de Comunicação
**Decisão**: REST API com JSON, HTTP Client Axios no frontend

**Alternativas consideradas**:
- GraphQL: Maior flexibilidade, mas overhead de complexidade desnecessário
- gRPC: Performance melhor, mas incompatível com browsers
- tRPC: Type-safety excelente, mas requer reescrita significativa

**Rationale**: Axios é simples, amplamente suportado, e REST é suficiente para os casos de uso.

### 2. Gerenciamento de Autenticação
**Decisão**: JWT tokens gerenciados pelo backend FastAPI, armazenados em localStorage no frontend

**Alternativas consideradas**:
- Cookies HTTP-only: Mais seguro contra XSS, mas complica CORS
- NextAuth com backend adapter: Complexidade adicional
- Session-based: Não escala horizontalmente

**Rationale**: JWT é stateless, escala bem, e já está implementado no backend.

### 3. Expansão de Roles
**Decisão**: Enum `UserRole` expandido para 14 valores, mapeamento frontend→backend

```python
class UserRole(str, Enum):
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
    SUPERVISOR = "supervisor"
```

**Rationale**: Mantém compatibilidade com os 14 perfis já usados no frontend.

### 4. Upload de Arquivos
**Decisão**: Backend recebe arquivo, faz upload para S3, retorna URL

**Alternativas consideradas**:
- Upload direto do frontend para S3: Expõe credenciais AWS
- Presigned URLs: Mais complexo de implementar

**Rationale**: Centralizar no backend permite validação, logging e controle de acesso.

### 5. WebSockets
**Decisão**: FastAPI WebSocket nativo, ConnectionManager por consulta

**Alternativas consideradas**:
- Socket.IO: Overhead de dependência adicional
- Server-Sent Events: Unidirecional, limitado
- Polling: Ineficiente

**Rationale**: FastAPI tem suporte nativo excelente, sem dependências extras.

### 6. Deployment
**Decisão**: Docker Compose com 3 serviços (frontend, backend, db)

**Alternativas consideradas**:
- Kubernetes: Overkill para escala atual
- PM2 only: Não padroniza ambiente
- Serverless: Incompatível com WebSockets

**Rationale**: Docker Compose é simples, reproduzível e suficiente para produção inicial.

## Risks / Trade-offs

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Perda de dados na migração | Baixa | Crítico | Backup completo antes, script de rollback |
| Downtime durante deploy | Média | Alto | Blue-green deployment, health checks |
| Incompatibilidade de schemas | Média | Alto | Ambiente de staging, testes de integração |
| Performance degradada | Baixa | Médio | Load testing, caching com Redis (futuro) |
| Bugs em fluxos existentes | Média | Médio | Testes E2E cobrindo fluxos críticos |

## Migration Plan

### Fase de Preparação (antes de iniciar)
1. Backup completo do banco de dados MySQL
2. Documentar todos os endpoints atuais do frontend
3. Criar ambiente de staging idêntico à produção

### Migração Gradual
1. **Semana 1-2**: FASE 1 e 2 (config + auth)
   - Deploy backend com novos endpoints
   - Frontend usa backend para auth, mas mantém API Routes para demais funcionalidades
   
2. **Semana 3-4**: FASE 3 (APIs)
   - Migrar endpoints um a um
   - Feature flag para rollback por endpoint
   
3. **Semana 5**: FASE 4 (Database)
   - Migração de dados executada em janela de manutenção
   - Validação de integridade pós-migração
   
4. **Semana 6**: FASE 5 e 6 (Serviços + Deploy)
   - Integrar Zoom/S3/WebSocket
   - Deploy final com Docker Compose

### Rollback Plan
1. **Auth rollback**: Reativar NextAuth direto, ignorar backend JWT
2. **API rollback**: Feature flag desativa proxy para backend
3. **Database rollback**: Restore do backup pré-migração
4. **Full rollback**: Deploy da versão anterior via git tag

## Open Questions

1. **Redis para caching?** Avaliar necessidade após load testing
2. **Rate limiting?** Implementar com slowapi ou nginx?
3. **Logs centralizados?** Elasticsearch/Loki ou CloudWatch?
4. **Monitoramento?** Prometheus + Grafana ou serviço gerenciado?
5. **CI/CD?** GitHub Actions ou outra plataforma?
