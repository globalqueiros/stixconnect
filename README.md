# StixConnect

Plataforma de telemedicina completa para consultas médicas online, desenvolvida com tecnologias modernas e integrada ao Zoom.

##  Sobre o Projeto

StixConnect é uma solução de telemedicina que conecta pacientes a profissionais de saúde através de videochamadas seguras. O sistema oferece fluxo completo de triagem, atendimento médico e gerenciamento administrativo.

### Componentes Principais

- **Backend** (Node.js/Express) - API RESTful com MariaDB
- **Frontend Paciente** (Next.js/TypeScript) - Interface para pacientes agendarem e realizarem consultas
- **Painel Admin** (Next.js/TypeScript) - Dashboard para gestão da plataforma

##  Funcionalidades

### Para Pacientes
- Agendamento de consultas online
- Triagem digital automatizada
- Videochamadas via Zoom SDK
- Acompanhamento do status da consulta
- Histórico médico

### Para Profissionais
- Dashboard de pacientes em espera
- Interface de triagem para enfermagem
- Salas de consulta virtuais
- Encaminhamento entre especialidades
- Registro de prontuário

### Administrativo
- Gestão de usuários e profissionais
- Relatórios de consultas
- Configuração do sistema
- Monitoramento em tempo real

##  Stack Tecnológico

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Banco de Dados**: MariaDB
- **Validação**: Zod
- **Autenticação**: JWT + BCrypt
- **Logging**: Winston

### Frontend
- **Framework**: Next.js 15
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS + Bootstrap
- **Videoconferência**: Zoom SDK
- **HTTP Client**: Axios

### DevOps
- **Containerização**: Docker + Docker Compose
- **Banco de Dados**: MariaDB Container
- **Controle de Versão**: Git

##  Estrutura do Projeto

```
stixconnect/
├── backend/                 # API Node.js
│   ├── routes/             # Endpoints da API
│   ├── services/           # Lógica de negócio
│   ├── database/           # Configuração do banco
│   └── utils/              # Utilitários
├── stixconnect/           # Frontend pacientes
│   └── src/
│       ├── app/           # Páginas Next.js
│       ├── components/    # Componentes React
│       └── lib/           # Utilitários
├── nexus_admin/           # Painel administrativo
│   └── src/
│       └── app/           # Dashboard e gestão
└── README.md
```

##  Instalação e Execução

### Pré-requisitos
- Node.js 18+
- MariaDB
- Docker (opcional)
- Conta Zoom (para videochamadas)

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend Paciente
```bash
cd stixconnect/stixconnect
npm install
npm run dev
```

### Painel Administrativo
```bash
cd nexus_admin/nexus_admin
npm install
npm run dev
```

### Docker (recomendado)
```bash
docker-compose up -d
```

##  Configuração

### Variáveis de Ambiente
Copie os arquivos `.env.example` para `.env` e configure:
- Credenciais do banco de dados
- Chaves da API Zoom
- Segredos JWT

### Banco de Dados
O sistema criará automaticamente as tabelas necessárias no primeiro.

##  Fluxo de Consulta

1. **Paciente** realiza triagem online
2. **Sistema** classifica prioridade e specialidade
3. **Enfermeira** avalia triagem e encaminha
4. **Médico** realiza consulta via videochamada
5. **Sistema** registra atendimento e atualiza status

##  Segurança

- Validação de inputs com Zod
- Autenticação JWT
- Criptografia de senhas BCrypt
- Rate limiting em APIs
- CORS configurado

##  Testes

```bash
# Backend
cd backend && npm test

# Frontend
cd stixconnect/stixconnect && npm run test

---

**StixConnect** - Conectando saúde e tecnologia