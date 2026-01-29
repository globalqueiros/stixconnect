# Guia de Deployment - StixConnect

## Pré-requisitos

- Docker e Docker Compose instalados
- Git configurado
- Acesso ao banco de dados MySQL (se usar banco externo)

## 1. Preparação

### 1.1 Variáveis de Ambiente

Copie o arquivo de exemplo e configure:

```bash
cp env.example .env
```

Edite `.env` com suas credenciais:

```env
# Database
DATABASE_URL=mysql://user:password@localhost:3306/stixconnect
DB_HOST=localhost
DB_USER=stix_prod_rw
DB_PASSWORD=your_password

# JWT
SECRET_KEY=your_super_secret_key_minimum_32_chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Zoom
ZOOM_ACCOUNT_ID=xxx
ZOOM_CLIENT_ID=xxx
ZOOM_CLIENT_SECRET=xxx

# AWS S3
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_S3_BUCKET=stixconnect-files

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 1.2 Instalar Dependências

```bash
# Na raiz do projeto
npm install

# Dependências do frontend
cd stixconnect/stixconnect
npm install

# Dependências do backend
cd ../../stixconnect-backend
pip install -r requirements.txt
```

## 2. Desenvolvimento Local

### 2.1 Rodar Frontend e Backend Juntos

```bash
# Na raiz do projeto
npm run dev
```

Isso inicia:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000

### 2.2 Rodar Separadamente

```bash
# Frontend apenas
npm run dev:frontend

# Backend apenas
npm run dev:backend
```

## 3. Build para Produção

### 3.1 Build Frontend

```bash
cd stixconnect/stixconnect
npm run build
```

### 3.2 Build Backend

O backend Python não precisa de build separado, mas você pode criar um ambiente virtual:

```bash
cd stixconnect-backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

## 4. Deploy com Docker

### 4.1 Build das Imagens

```bash
# Build todas as imagens
docker-compose build

# Build específica
docker-compose build backend
docker-compose build frontend
```

### 4.2 Iniciar Serviços

```bash
# Iniciar todos os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f

# Ver logs de serviço específico
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 4.3 Parar Serviços

```bash
docker-compose down

# Parar e remover volumes (CUIDADO: apaga dados!)
docker-compose down -v
```

## 5. Migração de Dados

### 5.1 Backup do Banco Legado

**IMPORTANTE**: Faça backup completo antes de migrar!

```bash
mysqldump -h 184.168.114.4 -u stix_prod_rw -p stix_app_user > backup_$(date +%Y%m%d).sql
```

### 5.2 Executar Migração

```bash
cd stixconnect-backend
python scripts/migrate_data.py
```

O script:
- Conecta ao banco legado
- Migra `tb_usuario` → `users`
- Migra `tb_consultas` → `consultations`
- Migra `tb_triagem` → `triagens`
- Mapeia roles do formato antigo para o novo

### 5.3 Validar Migração

```bash
# Conectar ao novo banco e verificar
mysql -h localhost -u stixconnect -p stixconnect

SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM consultations;
SELECT COUNT(*) FROM triagens;
```

## 6. Health Check

### 6.1 Script Automático

**Linux/Mac:**
```bash
chmod +x scripts/health-check.sh
./scripts/health-check.sh
```

**Windows (PowerShell):**
```powershell
.\scripts\health-check.ps1
```

### 6.2 Verificação Manual

```bash
# Frontend
curl http://localhost:3000

# Backend
curl http://localhost:8000/health

# API Docs
open http://localhost:8000/docs
```

## 7. Troubleshooting

### 7.1 Frontend não conecta ao Backend

**Problema**: CORS errors ou conexão recusada

**Solução**:
1. Verifique `NEXT_PUBLIC_API_URL` no `.env`
2. Verifique CORS no `app/main.py`
3. Verifique se o backend está rodando

### 7.2 Banco de dados não conecta

**Problema**: Erro de conexão ao MySQL

**Solução**:
1. Verifique `DATABASE_URL` no `.env`
2. Verifique se o MySQL está rodando
3. Verifique credenciais e permissões

### 7.3 WebSocket não funciona

**Problema**: WebSocket não conecta

**Solução**:
1. Verifique se o token JWT é válido
2. Verifique logs do backend
3. Verifique firewall/proxy (WebSocket precisa upgrade HTTP)

### 7.4 Upload S3 falha

**Problema**: Erro ao fazer upload

**Solução**:
1. Verifique credenciais AWS no `.env`
2. Verifique permissões do bucket
3. Verifique região configurada

## 8. Rollback

### 8.1 Rollback de Código

```bash
# Voltar para versão anterior
git checkout <commit-hash>

# Rebuild
docker-compose build
docker-compose up -d
```

### 8.2 Rollback de Banco de Dados

```bash
# Restaurar backup
mysql -h localhost -u stixconnect -p stixconnect < backup_YYYYMMDD.sql
```

## 9. Monitoramento

### 9.1 Logs

```bash
# Ver todos os logs
docker-compose logs -f

# Logs por serviço
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

### 9.2 Status dos Containers

```bash
docker-compose ps
```

### 9.3 Recursos

```bash
docker stats
```

## 10. Produção

### 10.1 Variáveis de Ambiente

Em produção, use variáveis de ambiente do sistema ou secrets management:

```bash
# Exemplo com .env
# NÃO commite o .env no git!
# Use secrets do Docker/Cloud provider
```

### 10.2 SSL/HTTPS

Configure reverse proxy (Nginx) para HTTPS:

```nginx
server {
    listen 443 ssl;
    server_name stixconnect.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
    }

    location /api {
        proxy_pass http://localhost:8000;
    }
}
```

### 10.3 Backup Automático

Configure backup periódico do banco:

```bash
# Crontab (Linux)
0 2 * * * mysqldump -h localhost -u user -p db > /backups/backup_$(date +\%Y\%m\%d).sql
```

## 11. Checklist Pós-Deploy

- [ ] Todos os serviços estão rodando (`docker-compose ps`)
- [ ] Health checks passando (`./scripts/health-check.sh`)
- [ ] Frontend acessível (http://localhost:3000)
- [ ] Backend acessível (http://localhost:8000/health)
- [ ] API Docs acessível (http://localhost:8000/docs)
- [ ] Login funciona
- [ ] Upload de arquivos funciona
- [ ] WebSocket conecta
- [ ] Migração de dados concluída (se aplicável)

---

**Última atualização**: 19/01/2026
