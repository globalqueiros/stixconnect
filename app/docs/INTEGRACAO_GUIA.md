# Guia de Integração Frontend-Backend - StixConnect

## Visão Geral

Este documento descreve a arquitetura integrada do StixConnect após a migração do frontend Next.js para comunicação com o backend FastAPI.

## Arquitetura

```
┌─────────────────────┐    HTTP/REST API    ┌─────────────────────┐
│   Frontend Next.js   │◄───────────────────►│   Backend FastAPI    │
│   Porta 3000         │    JWT Auth         │   Porta 8000         │
│                     │                      │                     │
│ • React Components  │    WebSocket         │ • Business Logic    │
│ • Services Layer    │◄───────────────────►│ • JWT Management     │
│ • API Client        │                      │ • Database Access   │
│ • WebSocket Client  │                      │ • Zoom Integration  │
└─────────────────────┘                      │ • S3 File Upload    │
                                             └─────────────────────┘
                                                      │
                                                      ▼
                                             ┌─────────────────────┐
                                             │   MySQL Database     │
                                             │   Porta 3306         │
                                             └─────────────────────┘
```

## Autenticação

### Fluxo de Login

1. **Frontend**: Usuário faz login com email/senha
2. **Backend**: Valida credenciais e retorna `access_token` + `refresh_token`
3. **Frontend**: Armazena tokens em `localStorage`
4. **Frontend**: Adiciona `Authorization: Bearer {token}` em todas as requisições

### Refresh Token Automático

O `api-client.ts` automaticamente:
- Detecta quando `access_token` expira (401)
- Usa `refresh_token` para obter novo `access_token`
- Retry da requisição original
- Se refresh falhar, redireciona para login

### Exemplo de Uso

```typescript
import { authService } from '@/app/services';

// Login
const response = await authService.login({
  email: 'user@example.com',
  senha: 'password123'
});

// Logout
await authService.logout();

// Verificar autenticação
if (authService.isAuthenticated()) {
  // Usuário está logado
}
```

## Roles e Permissões

### 14 Roles Disponíveis

| Backend Role | Frontend Role | Descrição |
|--------------|---------------|-----------|
| `admin` | Administrador | Acesso total ao sistema |
| `supervisor` | Supervisor | Supervisão geral |
| `doctor` | Médico | Atendimento médico |
| `nurse` | Enfermeiro | Triagem e enfermagem |
| `receptionist` | Atendente | Recepção |
| `physiotherapist` | Fisioterapeuta | Fisioterapia |
| `nutritionist` | Nutricionista | Nutrição |
| `psychologist` | Psicóloga | Psicologia |
| `speech_therapist` | Fonoaudióloga | Fonoaudiologia |
| `acupuncturist` | Acupuntura | Acupuntura |
| `clinical_psypedagogist` | Psicopedagoga_clinica | Psicopedagogia |
| `hairdresser` | Cabeleireiro | Serviços estéticos |
| `caregiver` | Cuidador | Cuidados |
| `patient` | Paciente | Paciente |

### Mapeamento de Roles

```typescript
import { mapFrontendRole, mapBackendRole } from '@/app/lib/role-mapping';

// Converter frontend → backend
const backendRole = mapFrontendRole('Médico'); // 'doctor'

// Converter backend → frontend
const frontendRole = mapBackendRole('doctor'); // 'Médico'
```

## Serviços Frontend

### authService

```typescript
import { authService } from '@/app/services';

// Login
await authService.login({ email, senha });

// Logout
await authService.logout();

// Obter usuário atual
const user = await authService.getCurrentUser();

// Verificar autenticação
const isAuth = authService.isAuthenticated();
```

### patientService

```typescript
import { patientService } from '@/app/services';

// Listar pacientes
const { items, total } = await patientService.getPatients(0, 20);

// Criar paciente
const patient = await patientService.createPatient({
  nome: 'João Silva',
  email: 'joao@example.com',
  senha: 'senha123',
  telefone: '+244 123 456 789',
});

// Buscar por ID
const patient = await patientService.getPatientById(1);
```

### consultationService

```typescript
import { consultationService } from '@/app/services';

// Criar consulta
const consulta = await consultationService.createConsultation({
  tipo: 'urgente',
  triagem: {
    sintomas: 'Dor de cabeça',
    temperatura: '37.5',
  }
});

// Iniciar triagem (enfermeira)
await consultationService.startTriage(consultaId);

// Transferir para médico
await consultationService.transferToDoctor(consultaId, medicoId);
```

### zoomService

```typescript
import { zoomService } from '@/app/services';

// Criar reunião Zoom
const meeting = await zoomService.createMeeting(consultaId);

// Abrir reunião
zoomService.openMeeting(meeting.join_url);
```

### fileService

```typescript
import { fileService } from '@/app/services';

// Upload de arquivo
const result = await fileService.uploadFile(file, patientId);

// Listar arquivos do paciente
const files = await fileService.getPatientFiles(patientId);
```

## WebSocket - Comunicação em Tempo Real

### Conexão

```typescript
import { ConsultationWebSocket } from '@/app/lib/websocket-client';

const ws = new ConsultationWebSocket(consultaId);

// Conectar
await ws.connect();

// Enviar mensagem
ws.sendMessage('Olá, tudo bem?');

// Receber mensagens
ws.on('message', (msg) => {
  console.log(`${msg.sender?.nome}: ${msg.content}`);
});

// Indicador de digitação
ws.sendTyping(true);

// Desconectar
ws.disconnect();
```

### Tipos de Mensagens

- `message`: Mensagem de chat
- `typing`: Indicador de digitação
- `status_update`: Atualização de status da consulta
- `user_joined`: Usuário entrou na consulta
- `user_left`: Usuário saiu da consulta
- `participants_list`: Lista de participantes

## Endpoints da API

### Autenticação

- `POST /auth/login` - Login
- `POST /auth/refresh` - Renovar token
- `POST /auth/logout` - Logout
- `GET /auth/me` - Usuário atual

### Pacientes

- `GET /patients` - Listar pacientes
- `GET /patients/{id}` - Buscar paciente
- `POST /patients` - Criar paciente
- `PUT /patients/{id}` - Atualizar paciente
- `DELETE /patients/{id}` - Desativar paciente

### Consultas

- `GET /consultas/` - Listar consultas
- `GET /consultas/{id}` - Buscar consulta
- `POST /consultas/` - Criar consulta
- `POST /consultas/{id}/iniciar-atendimento` - Iniciar triagem
- `POST /consultas/{id}/transferir-medico/{medico_id}` - Transferir para médico
- `POST /consultas/{id}/create-zoom` - Criar reunião Zoom

### Arquivos

- `POST /files/upload` - Upload de arquivo
- `GET /files/patient/{patient_id}` - Listar arquivos do paciente
- `DELETE /files/{file_id}` - Deletar arquivo

### WebSocket

- `WS /ws/consultations/{id}?token={jwt}` - Conexão WebSocket

## Variáveis de Ambiente

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend (.env)

```env
DATABASE_URL=mysql://user:pass@localhost:3306/stixconnect
SECRET_KEY=your-secret-key
ZOOM_ACCOUNT_ID=xxx
ZOOM_CLIENT_ID=xxx
ZOOM_CLIENT_SECRET=xxx
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_S3_BUCKET=stixconnect-files
```

## Desenvolvimento

### Rodar Frontend e Backend

```bash
# Raiz do projeto
npm run dev

# Ou separadamente
npm run dev:frontend  # Porta 3000
npm run dev:backend   # Porta 8000
```

### Docker Compose

```bash
# Build e start
docker-compose up -d

# Logs
docker-compose logs -f

# Stop
docker-compose down
```

## Migração de Dados

Para migrar dados do banco legado:

```bash
cd stixconnect-backend
python scripts/migrate_data.py
```

O script migra:
- `tb_usuario` → `users`
- `tb_consultas` → `consultations`
- `tb_triagem` → `triagens`

## Troubleshooting

### CORS Errors

Verifique se o backend está configurado para aceitar requisições do frontend:

```python
# app/main.py
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    # ... outras origens
]
```

### Token Expirado

O `api-client` faz refresh automático. Se persistir:
1. Verifique se `refresh_token` está sendo armazenado
2. Verifique expiração no backend (padrão: 7 dias)

### WebSocket não conecta

1. Verifique se o token JWT está sendo passado
2. Verifique se o usuário tem acesso à consulta
3. Verifique logs do backend

## Próximos Passos

1. Testar fluxos completos
2. Implementar testes automatizados
3. Configurar CI/CD
4. Deploy em produção
