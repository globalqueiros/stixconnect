# Guia de Testes - Integração Frontend-Backend

Este documento descreve como executar os testes automatizados e manuais para validar a integração.

## Testes Automatizados

### 1. Teste de Endpoints da API

Execute o script PowerShell para testar os endpoints principais:

```powershell
.\scripts\test-api-endpoints.ps1
```

Ou com URL customizada:

```powershell
.\scripts\test-api-endpoints.ps1 -BaseUrl "http://localhost:8000"
```

**O que este script testa:**
- ✅ Disponibilidade dos endpoints
- ✅ Respostas de autenticação (401 quando não autenticado)
- ✅ CORS configuration
- ✅ Health check endpoints

### 2. Teste de Integração Básico

```powershell
.\scripts\test-integration.ps1
```

**O que este script testa:**
- ✅ Backend está rodando
- ✅ CORS configurado
- ✅ Endpoints principais acessíveis

## Testes Manuais Necessários

### Autenticação (2.1.4, 2.2.4)
1. Criar usuário com cada role (14 roles)
2. Fazer login e verificar JWT
3. Testar refresh token após expiração
4. Testar logout e invalidar refresh token

### Migração de Banco (4.3.2, 4.3.3)
1. Executar script de migração: `python scripts/migrate_data.py`
2. Verificar integridade dos dados migrados
3. Comparar contagens de registros antes/depois

### Serviços Externos (5.1.4, 5.2.5)
1. **Zoom**: Criar reunião via `/consultas/{id}/create-zoom`
2. **S3 Upload**: Fazer upload de arquivo via `/files/upload`

### WebSocket (5.3.5)
1. Conectar a `/ws/consultations/{id}`
2. Enviar mensagens
3. Verificar broadcast para todos os participantes

### Docker (6.2.6)
```bash
docker-compose up --build
```

Verificar:
- Frontend acessível em http://localhost:3000
- Backend acessível em http://localhost:8000
- MySQL rodando e conectado

### Integração Completa (7.1.x)
1. **Login**: Login → Dashboard correto por role
2. **CRUD Pacientes**: Criar → Listar → Editar → Deletar
3. **Fluxo Teleconsulta**: Criar → Triagem → Atendimento médico
4. **Upload**: Fazer upload e visualizar arquivo
5. **WebSocket**: Comunicação em tempo real durante consulta

## Testes de Performance (7.2.x)

Execute com ferramentas como:
- **Apache Bench**: `ab -n 1000 -c 10 http://localhost:8000/consultas`
- **wrk**: `wrk -t4 -c100 -d30s http://localhost:8000/consultas`
- **k6**: Scripts em `scripts/k6-load-test.js`

**Targets:**
- Response time < 200ms para endpoints principais
- Throughput > 100 req/s

## Status Atual dos Testes

- ✅ **Implementação**: 83% completo (80/96 tarefas)
- ⏳ **Testes Automatizados**: Scripts criados, prontos para execução
- ⏳ **Testes Manuais**: Aguardando execução em ambiente de desenvolvimento

## Próximos Passos

1. Executar scripts de teste automatizado
2. Configurar ambiente de desenvolvimento completo
3. Executar testes manuais por categoria
4. Documentar resultados e métricas
5. Corrigir bugs encontrados
