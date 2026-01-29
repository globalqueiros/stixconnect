## ADDED Requirements

### Requirement: Docker Configuration
O sistema MUST ser containerizado com Docker.

#### Scenario: Build do backend
- **WHEN** `docker build` é executado no diretório do backend
- **THEN** MUST criar imagem funcional com todas as dependências
- **AND** MUST expor porta 8000

#### Scenario: Build do frontend
- **WHEN** `docker build` é executado no diretório do frontend
- **THEN** MUST criar imagem funcional com Next.js
- **AND** MUST expor porta 3000

#### Scenario: Variáveis de ambiente
- **WHEN** container inicia
- **THEN** MUST ler variáveis de ambiente do host ou docker-compose
- **AND** MUST NOT conter credenciais hardcoded na imagem

### Requirement: Docker Compose Orchestration
O sistema MUST usar Docker Compose para orquestração.

#### Scenario: Iniciar todos os serviços
- **WHEN** `docker-compose up` é executado
- **THEN** MUST iniciar frontend, backend e database
- **AND** MUST respeitar ordem de dependências

#### Scenario: Dependências de serviço
- **WHEN** backend inicia
- **THEN** MUST aguardar database estar healthy
- **WHEN** frontend inicia
- **THEN** MUST aguardar backend estar healthy

#### Scenario: Persistência de dados
- **WHEN** containers são reiniciados
- **THEN** dados do MySQL MUST persistir via volume
- **AND** MUST NOT perder dados entre restarts

### Requirement: Health Checks
Cada serviço MUST expor endpoint de health check.

#### Scenario: Backend health
- **WHEN** GET `/health` é chamado no backend
- **THEN** MUST retornar `{"status": "ok"}` se saudável
- **AND** MUST retornar status 500 se há problemas

#### Scenario: Frontend health
- **WHEN** GET `/api/health` é chamado no frontend
- **THEN** MUST verificar conectividade com backend
- **AND** MUST retornar status apropriado

#### Scenario: Database health
- **WHEN** Docker Compose verifica saúde do MySQL
- **THEN** MUST usar `mysqladmin ping` ou query simples
- **AND** MUST marcar unhealthy após 3 falhas

### Requirement: Deployment Scripts
O projeto MUST ter scripts unificados de deployment.

#### Scenario: Script de desenvolvimento
- **WHEN** `npm run dev` é executado na raiz
- **THEN** MUST iniciar frontend e backend em modo desenvolvimento
- **AND** MUST habilitar hot-reload em ambos

#### Scenario: Script de produção
- **WHEN** `npm run deploy` é executado
- **THEN** MUST construir imagens de produção
- **AND** MUST iniciar containers com docker-compose

#### Scenario: Script de backup
- **WHEN** `npm run backup` é executado
- **THEN** MUST criar dump do banco de dados
- **AND** MUST salvar com timestamp no nome

### Requirement: Environment Separation
O sistema MUST suportar múltiplos ambientes.

#### Scenario: Ambiente de desenvolvimento
- **WHEN** NODE_ENV=development
- **THEN** MUST usar configurações de desenvolvimento
- **AND** MUST habilitar logs detalhados

#### Scenario: Ambiente de produção
- **WHEN** NODE_ENV=production
- **THEN** MUST usar configurações de produção
- **AND** MUST minimizar logs sensíveis
- **AND** MUST usar HTTPS

#### Scenario: Ambiente de staging
- **WHEN** NODE_ENV=staging
- **THEN** MUST usar configurações similares a produção
- **AND** MUST usar banco de dados separado
