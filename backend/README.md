# StixConnect Backend

Backend API para a plataforma de telemedicina StixConnect.

##  Quick Start

### Opção 1: Docker (Recomendado)

```bash
# Clonar o projeto e entrar na pasta backend
cd backend

# Configurar variáveis de ambiente (Zoom API)
cp .env.docker .env
# Editar .env com suas credenciais da Zoom API

# Iniciar tudo com Docker Compose
docker-compose up -d

# Verificar status
docker-compose ps

# Acessar logs
docker-compose logs -f
```

### Opção 2: Desenvolvimento Local

```bash
# Instalar dependências
cd backend
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas configurações

# Iniciar banco MariaDB local
# Usar script de gerenciamento:
./scripts/database.sh start   # Linux/Mac
scripts\database.bat start    # Windows

# Ou manualmente:
mysql -u root -p < database/schema.sql
mysql -u root -p < database/init-data.sql

# Iniciar servidor (desenvolvimento)
npm run dev

# Iniciar servidor (produção)
npm start
```

O servidor será iniciado em `http://localhost:3001`

##  Estrutura do Projeto

```
backend/
├── config/
│   └── database.js          # Configuração do banco de dados
├── database/
│   ├── Dockerfile           # Container MariaDB
│   ├── mariadb.cnf          # Configuração MariaDB
│   ├── schema.sql           # Schema do banco de dados
│   ├── init-data.sql        # Dados iniciais
│   ├── backups/            # Backups do banco
│   └── logs/               # Logs do MariaDB
├── routes/
│   ├── auth.js              # Autenticação de profissionais
│   ├── triagem.js           # Endpoints de triagem
│   ├── consultas.js         # Gestão de consultas
│   ├── zoom.js              # Integração Zoom API
│   └── admin.js             # Dashboard admin
├── scripts/
│   ├── database.sh          # Script Linux/Mac para gerenciar DB
│   └── database.bat         # Script Windows para gerenciar DB
├── utils/
│   ├── logger.js            # Sistema de logs
│   └── validation.js        # Validação de dados (Zod)
├── logs/                    # Logs da aplicação
├── docker-compose.yml       # Orquestração de containers
├── Dockerfile               # Container da aplicação
├── server.js                # Servidor Express
├── package.json
├── TEST_GUIDE.md           # Guia completo de testes
└── .env.docker             # Variáveis para Docker
```

##  Endpoints Principais

### Autenticação
- `POST /api/auth/login` - Login de profissional
- `GET /api/auth/me` - Obter informações do usuário
- `POST /api/auth/logout` - Logout

### Triagem
- `POST /api/triagem` - Criar nova triagem
- `GET /api/triagem/:id` - Obter dados da triagem
- `PUT /api/triagem/:id` - Atualizar triagem

### Consultas
- `GET /api/consultas/aguardando` - Consultas aguardando atendimento
- `GET /api/consultas/encaminhadas` - Consultas encaminhadas para médicos
- `POST /api/consultas/:id/encaminhar` - Encaminhar para médico
- `PUT /api/consultas/:id/status` - Atualizar status da consulta

### Zoom
- `POST /api/zoom/create-meeting` - Criar reunião Zoom
- `GET /api/zoom/meeting/:id` - Obter detalhes da reunião
- `DELETE /api/zoom/meeting/:id` - Deletar reunião

### Admin
- `GET /api/admin/dashboard` - Dashboard com métricas
- `GET /api/admin/consultas` - Listar todas as consultas
- `GET /api/admin/profissionais` - Listar profissionais

##  Banco de Dados

O projeto utiliza **MariaDB** com as seguintes tabelas principais:

- `pacientes` - Informações dos pacientes
- `profissionais` - Médicos e enfermeiros
- `consultas` - Registros das consultas
- `zoom_meetings` - Reuniões Zoom criadas
- `consulta_status_history` - Histórico de alterações de status

##  Segurança

- Autenticação JWT para proteger endpoints
- Validação de dados com Zod schemas
- Rate limiting para prevenir abuse
- CORS configurado para desenvolvimento
- Helmet para headers de segurança

##  Logs

Os logs são salvos em:
- `logs/combined.log` - Todos os logs
- `logs/error.log` - Apenas erros

##  Testes

Siga o guia completo em [TEST_GUIDE.md](TEST_GUIDE.md) para testar todos os endpoints.

##  Variáveis de Ambiente

Copie `.env.example` para `.env` e configure:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=stixconnect

ZOOM_API_KEY=your_zoom_api_key
ZOOM_API_SECRET=your_zoom_api_secret
ZOOM_WEBHOOK_SECRET=your_zoom_webhook_secret

JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

##  Notas Importantes

1. **Zoom API**: Configure as credenciais da Zoom API no painel de desenvolvedores Zoom
2. **Banco de Dados**: Execute o schema.sql para criar as tabelas necessárias
3. **Senhas**: Os usuários de exemplo usam hash simulado - configure senhas reais em produção
4. **JWT**: Mantenha o JWT_SECRET seguro em ambiente de produção

##  Deploy

Para deploy em produção:

1. Configure todas as variáveis de ambiente
2. Use PM2 ou similar para gerenciar o processo
3. Configure HTTPS (recomendado)
4. Configure backup do banco de dados
5. Monitore logs e performance

##  Suporte

Para dúvidas ou problemas, consulte o [TEST_GUIDE.md](TEST_GUIDE.md) ou abra uma issue.