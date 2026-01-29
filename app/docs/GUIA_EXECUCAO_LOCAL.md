# 🚀 Guia de Execução Local (Sem Docker)

Este guia explica como executar o projeto StixConnect localmente, sem usar Docker.

## 📋 Pré-requisitos

### Backend (FastAPI)
- Python 3.9 ou superior
- pip (gerenciador de pacotes Python)

### Frontend (Next.js)
- Node.js 18 ou superior
- npm ou yarn

## 🔧 Configuração Inicial

### 1. Backend (FastAPI)

#### 1.1. Criar ambiente virtual Python

```powershell
# No diretório raiz do projeto
cd stixconnect-backend
python -m venv venv

# Ativar ambiente virtual (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Se der erro de política de execução, execute primeiro:
# Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### 1.2. Instalar dependências

```powershell
pip install -r requirements.txt
```

#### 1.3. Configurar variáveis de ambiente

```powershell
# Copiar arquivo de exemplo
Copy-Item ..\env.example .env

# Editar .env com suas credenciais
# Notepad .env
```

**Arquivo `.env` mínimo necessário:**

```env
# JWT (obrigatório)
SECRET_KEY=sua_chave_secreta_aqui_minimo_32_caracteres

# Zoom (opcional para desenvolvimento)
ZOOM_ACCOUNT_ID=
ZOOM_CLIENT_ID=
ZOOM_CLIENT_SECRET=

# Database (SQLite por padrão, não precisa configurar)
# DATABASE_URL=sqlite:///./stixconnect.db

# AWS S3 (opcional)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=

# Twilio (opcional)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

#### 1.4. Inicializar banco de dados

O SQLite será criado automaticamente na primeira execução. Se quiser usar MySQL:

```env
DATABASE_URL=mysql://user:password@localhost:3306/stixconnect
```

#### 1.5. Executar backend

```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Backend estará disponível em:**
- API: http://localhost:8000
- Documentação: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

---

### 2. Frontend (Next.js)

#### 2.1. Instalar dependências

```powershell
# No diretório do frontend
cd stixconnect\stixconnect
npm install
```

#### 2.2. Configurar variáveis de ambiente

Crie um arquivo `.env.local` no diretório `stixconnect/stixconnect/`:

```env
# URL da API Backend
NEXT_PUBLIC_API_URL=http://localhost:8000

# NextAuth (se estiver usando)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=sua_chave_secreta_nextauth
```

#### 2.3. Executar frontend

```powershell
npm run dev
```

**Frontend estará disponível em:**
- Aplicação: http://localhost:3000

---

## 🎯 Execução Rápida

### Opção 1: Scripts PowerShell (Recomendado)

Execute os scripts fornecidos:

```powershell
# Terminal 1 - Backend
.\scripts\start-backend.ps1

# Terminal 2 - Frontend
.\scripts\start-frontend.ps1
```

### Opção 2: Manual

**Terminal 1 - Backend:**
```powershell
cd stixconnect-backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```

**Terminal 2 - Frontend:**
```powershell
cd stixconnect\stixconnect
npm run dev
```

---

## ✅ Verificação

### 1. Verificar Backend

Abra no navegador: http://localhost:8000/docs

Você deve ver a documentação interativa da API.

### 2. Verificar Frontend

Abra no navegador: http://localhost:3000

Você deve ver a interface do StixConnect.

### 3. Testar Conexão

No frontend, tente fazer login. Se o backend estiver rodando corretamente, a requisição deve funcionar.

---

## 🔍 Troubleshooting

### Erro: "ModuleNotFoundError"

**Solução:** Ative o ambiente virtual e instale as dependências:
```powershell
cd stixconnect-backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Erro: "Port 8000 already in use"

**Solução:** Altere a porta no comando uvicorn:
```powershell
uvicorn app.main:app --reload --port 8001
```

E atualize `NEXT_PUBLIC_API_URL` no frontend.

### Erro: "Port 3000 already in use"

**Solução:** Altere a porta do Next.js:
```powershell
npm run dev -- -p 3001
```

### Erro: CORS no frontend

**Solução:** Verifique se `NEXT_PUBLIC_API_URL` está correto e se o backend está rodando.

### Erro: "Cannot find module"

**Solução:** Reinstale as dependências:
```powershell
cd stixconnect\stixconnect
rm -r node_modules
npm install
```

---

## 📝 Notas Importantes

1. **SQLite por padrão**: O backend usa SQLite por padrão, que não requer configuração adicional.

2. **Credenciais opcionais**: Zoom, AWS S3 e Twilio são opcionais para desenvolvimento básico.

3. **SECRET_KEY obrigatória**: Gere uma chave segura para produção:
   ```python
   import secrets
   print(secrets.token_urlsafe(32))
   ```

4. **Hot Reload**: Ambos os serviços têm hot reload ativado, então mudanças no código são refletidas automaticamente.

5. **Banco de dados**: O SQLite será criado automaticamente em `stixconnect-backend/stixconnect.db` na primeira execução.

---

## 🎉 Pronto!

Agora você pode desenvolver e testar o StixConnect localmente sem Docker!

Para mais informações, consulte:
- [README_INTEGRACAO.md](README_INTEGRACAO.md)
- [docs/INTEGRACAO_GUIA.md](docs/INTEGRACAO_GUIA.md)
