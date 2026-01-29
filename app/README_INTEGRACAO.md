# StixConnect - Sistema de Telemedicina

## 📋 Sobre

StixConnect é um sistema completo de telemedicina que conecta pacientes a profissionais de saúde através de videochamadas integradas com Zoom. O sistema foi migrado para uma arquitetura moderna separando frontend (Next.js) e backend (FastAPI).

## 🏗️ Arquitetura

```
Frontend (Next.js) ←→ Backend (FastAPI) ←→ MySQL
     Porta 3000          Porta 8000        Porta 3306
```

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 18+
- Python 3.11+
- MySQL 8.0+
- Docker (opcional)

### Instalação

```bash
# 1. Clonar repositório
git clone <repository-url>
cd app

# 2. Instalar dependências
npm run install:all

# 3. Configurar variáveis de ambiente
cp env.example .env
# Edite .env com suas credenciais

# 4. Iniciar desenvolvimento
npm run dev
```

Isso inicia:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 📚 Documentação

- **[Guia de Integração](docs/INTEGRACAO_GUIA.md)** - Como usar os serviços e APIs
- **[Guia de Deployment](docs/DEPLOYMENT.md)** - Como fazer deploy em produção
- **[Plano de Implementação](PLANO_IMPLEMENTACAO_STIXCONNECT.md)** - Visão geral do projeto

## 🔑 Autenticação

O sistema usa JWT com refresh token:

```typescript
import { authService } from '@/app/services';

// Login
await authService.login({ email, senha });

// Tokens são gerenciados automaticamente
// Refresh automático em caso de expiração
```

## 🎯 Features Principais

### ✅ Implementado

- ✅ Autenticação JWT com 14 roles
- ✅ Refresh token automático
- ✅ CRUD completo de pacientes
- ✅ CRUD completo de consultas
- ✅ Upload de arquivos (S3)
- ✅ WebSocket para comunicação em tempo real
- ✅ Integração Zoom
- ✅ Docker Compose

### ⏳ Em Desenvolvimento

- Atualização de componentes frontend para usar novos serviços
- Testes automatizados
- Monitoramento e métricas

## 📦 Estrutura do Projeto

```
app/
├── stixconnect/              # Frontend Next.js
│   └── stixconnect/
│       └── src/app/
│           ├── services/     # Camada de serviços
│           ├── lib/          # Utilitários (api-client, role-mapping)
│           └── (main)/       # Rotas por role
├── stixconnect-backend/      # Backend FastAPI
│   └── app/
│       ├── routers/          # Endpoints da API
│       ├── services/         # Lógica de negócios
│       ├── models/           # SQLAlchemy models
│       ├── schemas/          # Pydantic schemas
│       └── websockets/       # WebSocket handlers
├── nexus_admin/              # Painel administrativo
├── scripts/                  # Scripts de migração e deploy
├── docs/                     # Documentação
└── docker-compose.yml        # Orquestração Docker
```

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev                  # Frontend + Backend
npm run dev:frontend        # Só frontend
npm run dev:backend         # Só backend

# Build
npm run build               # Build frontend + admin
npm run build:frontend      # Build frontend
npm run build:admin         # Build admin

# Docker
npm run docker:build        # Build imagens
npm run docker:up           # Iniciar serviços
npm run docker:down         # Parar serviços

# Health Check
./scripts/health-check.sh   # Linux/Mac
.\scripts\health-check.ps1  # Windows
```

## 🧪 Testes

```bash
# Backend
cd stixconnect-backend
pytest

# Frontend
cd stixconnect/stixconnect
npm test
```

## 📝 Migração de Dados

Para migrar dados do banco legado:

```bash
cd stixconnect-backend
python scripts/migrate_data.py
```

## 🔐 Variáveis de Ambiente

Consulte `env.example` para todas as variáveis necessárias.

**Principais:**
- `DATABASE_URL` - String de conexão MySQL
- `SECRET_KEY` - Chave secreta para JWT
- `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET` - Credenciais Zoom
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` - Credenciais AWS S3

## 🤝 Contribuindo

1. Crie uma branch: `git checkout -b feature/nova-feature`
2. Commit suas mudanças: `git commit -am 'Adiciona nova feature'`
3. Push para a branch: `git push origin feature/nova-feature`
4. Abra um Pull Request

## 📄 Licença

UNLICENSED - Uso interno apenas

## 📞 Suporte

Para suporte, consulte a documentação em `docs/` ou abra uma issue.

---

**Versão**: 2.0.0  
**Última atualização**: 19/01/2026
