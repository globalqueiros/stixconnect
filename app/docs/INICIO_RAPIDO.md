# 🚀 Início Rápido - StixConnect (Sem Docker)

Guia rápido para executar o projeto localmente.

## ✅ Pré-requisitos

- Python 3.9+ instalado
- Node.js 18+ instalado
- npm ou yarn instalado

## 🎯 Execução em 3 Passos

### 1️⃣ Backend (Terminal 1)

```powershell
cd stixconnect-backend

# Ativar ambiente virtual (se ainda não criado)
.\venv\Scripts\Activate.ps1

# Se não tiver ambiente virtual, criar:
# python -m venv venv
# .\venv\Scripts\Activate.ps1
# pip install -r requirements.txt

# Iniciar servidor
uvicorn app.main:app --reload
```

**Backend rodando em:** http://localhost:8000  
**Documentação:** http://localhost:8000/docs

### 2️⃣ Frontend (Terminal 2)

```powershell
cd stixconnect\stixconnect

# Instalar dependências (se ainda não instaladas)
npm install

# Iniciar servidor
npm run dev
```

**Frontend rodando em:** http://localhost:3000

### 3️⃣ Acessar Aplicação

Abra seu navegador em: **http://localhost:3000**

---

## 📝 Scripts Automatizados

Para facilitar, use os scripts PowerShell:

### Backend:
```powershell
.\scripts\start-backend.ps1
```

### Frontend:
```powershell
.\scripts\start-frontend.ps1
```

---

## ⚙️ Configuração

### Backend (.env)

O arquivo `.env` já foi criado em `stixconnect-backend/.env` com configurações mínimas.

**Importante:** Para produção, altere o `SECRET_KEY`:

```env
SECRET_KEY=sua_chave_secreta_aqui_minimo_32_caracteres
```

### Frontend (.env.local)

O arquivo `.env.local` já foi criado em `stixconnect/stixconnect/.env.local` com:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 🔍 Verificação

### Backend está funcionando?
- Acesse: http://localhost:8000/docs
- Você deve ver a documentação interativa da API

### Frontend está funcionando?
- Acesse: http://localhost:3000
- Você deve ver a interface do StixConnect

### Testar conexão?
- Tente fazer login no frontend
- Se o backend estiver rodando, a requisição deve funcionar

---

## ❌ Problemas Comuns

### Erro: "ModuleNotFoundError"
**Solução:** Ative o ambiente virtual e instale dependências:
```powershell
cd stixconnect-backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Erro: "Port 8000 already in use"
**Solução:** Altere a porta:
```powershell
uvicorn app.main:app --reload --port 8001
```
E atualize `NEXT_PUBLIC_API_URL` no frontend.

### Erro: "Port 3000 already in use"
**Solução:** Altere a porta:
```powershell
npm run dev -- -p 3001
```

### Erro: CORS no frontend
**Solução:** Verifique se:
1. Backend está rodando em http://localhost:8000
2. `NEXT_PUBLIC_API_URL` está correto no `.env.local`

---

## 📚 Documentação Completa

Para mais detalhes, consulte:
- [GUIA_EXECUCAO_LOCAL.md](GUIA_EXECUCAO_LOCAL.md) - Guia completo
- [README_INTEGRACAO.md](README_INTEGRACAO.md) - Documentação da integração
- [docs/INTEGRACAO_GUIA.md](docs/INTEGRACAO_GUIA.md) - Guia técnico

---

## 🎉 Pronto!

Agora você pode desenvolver e testar o StixConnect localmente!
