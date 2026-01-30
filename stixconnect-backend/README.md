# StixConnect - Backend API

Backend completo para o sistema StixConnect de teleconsulta médica com integração Zoom.

## 🚀 Instalação Rápida

```bash
# 1. Criar ambiente virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows

# 2. Instalar dependências
pip install -r requirements.txt

# 3. Configurar .env
cp .env.example .env
# Edite .env com suas credenciais Zoom

# 4. Executar
uvicorn app.main:app --reload
```

**API**: http://localhost:8000  
**API Docs**: http://localhost:8000/docs  
**Backend Guide**: [docs/como-funciona-backend.md](docs/como-funciona-backend.md)

## 📋 Funcionalidades

✅ Autenticação JWT com 4 roles (Paciente, Enfermeira, Médico, Admin)  
✅ Sistema de triagem com classificação automática de urgência  
✅ Integração completa com Zoom API  
✅ Fluxo: Paciente → Enfermeira → Médico  
✅ Dashboard administrativo com estatísticas  
✅ Relatórios detalhados de consultas  

## 🔑 Endpoints Principais

**Autenticação:**
- POST /auth/register
- POST /auth/login

**Consultas:**
- POST /consultas/
- GET /consultas/
- POST /consultas/{id}/iniciar-atendimento
- POST /consultas/{id}/transferir-medico/{medico_id}

**Admin:**
- GET /admin/consultas
- GET /admin/estatisticas
- GET /admin/relatorio-consultas

## 🗄️ Banco de Dados

SQLite (fácil migração para MariaDB)

**Tabelas:**
- users (pacientes, enfermeiras, médicos, admins)
- consultas (todas as consultas + links Zoom)
- triagens (dados de triagem + classificação)

## 📝 Variáveis de Ambiente (.env)

```
ZOOM_ACCOUNT_ID=seu_account_id
ZOOM_CLIENT_ID=seu_client_id  
ZOOM_CLIENT_SECRET=seu_client_secret
SECRET_KEY=chave_secreta_jwt
```

## 📚 Documentação

- **Guia do Backend**: [Como funciona o backend](docs/como-funciona-backend.md) - Documentação completa para desenvolvedores
- **API Interativa**: http://localhost:8000/docs - Documentação automática dos endpoints

## 🏥 StixConnect - Pronto para uso!