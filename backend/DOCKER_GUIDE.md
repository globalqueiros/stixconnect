# Docker Guide - StixConnect Backend

Este guia explica como usar Docker e Docker Compose para executar o backend StixConnect.

## 🐋 Pré-requisitos

- Docker Desktop (Windows/Mac) ou Docker Engine (Linux)
- Docker Compose (incluído no Docker Desktop)

## 🚀 Início Rápido

### 1. Clonar e Configurar
```bash
cd backend
cp .env.docker .env
# Edite .env com suas credenciais da Zoom API
```

### 2. Iniciar Todos os Serviços
```bash
# Inicia MariaDB, Backend, Redis e Nginx
docker-compose up -d

# Apenas MariaDB e Backend
docker-compose up -d mariadb backend

# Verificar status
docker-compose ps
```

### 3. Verificar Funcionamento
```bash
# Verificar se containers estão rodando
docker-compose ps

# Verificar logs
docker-compose logs -f

# Testar API
curl http://localhost:3001/health
```

## 📋 Serviços Disponíveis

### MariaDB Database
- **Container**: `stixconnect-mariadb`
- **Porta**: `3306`
- **Banco**: `stixconnect`
- **Usuário**: `stixuser`
- **Senha**: `stix123`

### Backend API
- **Container**: `stixconnect-backend`
- **Porta**: `3001`
- **Health Check**: `/health`

### Redis Cache
- **Container**: `stixconnect-redis`
- **Porta**: `6379`
- **Uso**: Cache e sessões (opcional)

### Nginx Proxy
- **Container**: `stixconnect-nginx`
- **Portas**: `80`, `443`
- **Perfil**: `production`

## 🛠️ Scripts de Gerenciamento

### Linux/Mac
```bash
# Tornar script executável
chmod +x scripts/database.sh

# Iniciar banco
./scripts/database.sh start

# Parar banco
./scripts/database.sh stop

# Resetar banco (⚠️ apaga todos dados)
./scripts/database.sh reset

# Criar backup
./scripts/database.sh backup

# Ver status
./scripts/database.sh status

# Acessar MySQL CLI
./scripts/database.sh cli
```

### Windows
```cmd
# Iniciar banco
scripts\database.bat start

# Parar banco
scripts\database.bat stop

# Resetar banco (⚠️ apaga todos dados)
scripts\database.bat reset

# Criar backup
scripts\database.bat backup

# Ver status
scripts\database.bat status

# Acessar MySQL CLI
scripts\database.bat cli
```

## 🗂️ Estrutura de Volumes

### Dados Persistentes
- `mariadb_data`: Dados do banco MariaDB
- `redis_data`: Dados do Redis cache

### Backups e Logs
- `./database/backups`: Backups automáticos do banco
- `./database/logs`: Logs do MariaDB
- `./logs`: Logs da aplicação backend

## 🔄 Comandos Úteis

### Gerenciamento de Containers
```bash
# Iniciar todos os serviços
docker-compose up -d

# Parar todos os serviços
docker-compose down

# Parar e remover volumes (⚠️ perde dados)
docker-compose down -v

# Reconstruir imagens
docker-compose build --no-cache

# Atualizar serviços
docker-compose pull
docker-compose up -d
```

### Logs
```bash
# Ver todos os logs
docker-compose logs -f

# Logs de serviço específico
docker-compose logs -f mariadb
docker-compose logs -f backend

# Logs recentes
docker-compose logs --tail=100
```

### Execução de Comandos
```bash
# Acessar shell do backend
docker-compose exec backend sh

# Acessar MySQL
docker-compose exec mariadb mysql -u root -proot123

# Ver processos
docker-compose exec mariadb ps aux
```

## 📊 Monitoramento

### Health Checks
```bash
# Verificar status dos serviços
docker-compose ps

# Ver health checks detalhados
docker inspect stixconnect-backend | grep -A 10 Health
```

### Recursos
```bash
# Uso de recursos
docker stats

# Uso de disco
docker system df

# Limpeza de imagens não usadas
docker system prune -a
```

## 🔧 Configuração Avançada

### Variáveis de Ambiente
Edite `.env` para personalizar:
```env
# Credenciais do banco
DB_HOST=mariadb
DB_USER=stixuser
DB_PASSWORD=stix123
DB_NAME=stixconnect

# Zoom API
ZOOM_API_KEY=sua_chave_api
ZOOM_API_SECRET=seu_secreto_api

# JWT
JWT_SECRET=seu_segredo_jwt
```

### Customização do MariaDB
Edite `database/mariadb.cnf`:
```ini
[mysqld]
# Performance tuning
innodb_buffer_pool_size = 512M
max_connections = 200

# Logging
slow_query_log = 1
long_query_time = 2
```

### Perfis Docker
Use perfis para diferentes ambientes:
```bash
# Apenas desenvolvimento
docker-compose --profile dev up -d

# Produção com Nginx
docker-compose --profile production up -d
```

## 🔒 Segurança

### Boas Práticas
1. **Não use senhas padrão em produção**
2. **Configure HTTPS com Nginx**
3. **Limite acesso ao banco de dados**
4. **Use variáveis de ambiente para segredos**
5. **Habilite logs de auditoria**

### Customização de Segurança
```yaml
# No docker-compose.yml
services:
  mariadb:
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_PASSWORD: ${DB_PASSWORD}
    networks:
      - internal  # Rede interna apenas

  backend:
    networks:
      - internal
      - external  # Para acesso externo
```

## 🚀 Deploy em Produção

### 1. Preparar Ambiente
```bash
# Configurar variáveis de produção
cp .env.docker .env.production
# Editar com valores reais
```

### 2. Deploy
```bash
# Deploy completo com proxy
docker-compose --profile production -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 3. Backup Automático
```bash
# Adicionar ao crontab
0 2 * * * cd /path/to/backend && ./scripts/database.sh backup
```

## 🐛 Troubleshooting

### Problemas Comuns

#### Container não inicia
```bash
# Verificar logs de erro
docker-compose logs mariadb

# Verificar conflito de portas
netstat -tulpn | grep 3306

# Recomeçar do zero
docker-compose down -v
docker volume prune
docker-compose up -d
```

#### Conexão com banco falha
```bash
# Verificar se banco está pronto
docker-compose exec mariadb mysqladmin ping

# Testar conexão do backend
docker-compose exec backend node -e "
const db = require('./config/database');
db.execute('SELECT 1').then(() => console.log('OK')).catch(console.error);
"
```

#### Performance lenta
```bash
# Verificar recursos
docker stats

# Otimizar MariaDB
docker-compose exec mariadb mysql -e "
SHOW VARIABLES LIKE 'innodb_buffer_pool_size';
SHOW PROCESSLIST;
"
```

### Recuperação de Dados
```bash
# Se volumes foram perdidos
# Restaurar do último backup
./scripts/database.sh restore

# Recrear container mantendo dados
docker-compose up -d --force-recreate
```

## 📚 Referências

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [MariaDB Docker Hub](https://hub.docker.com/_/mariadb)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

## 🆘 Suporte

Para problemas com Docker:
1. Verificar logs: `docker-compose logs`
2. Reiniciar: `docker-compose restart`
3. Reconstruir: `docker-compose build --no-cache`
4. Reset completo: `docker-compose down -v && docker-compose up -d`