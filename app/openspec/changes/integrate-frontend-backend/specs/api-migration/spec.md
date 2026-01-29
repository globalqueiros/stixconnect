## ADDED Requirements

### Requirement: Patient Management API
O backend MUST fornecer endpoints CRUD para gerenciamento de pacientes.

#### Scenario: Listar pacientes
- **WHEN** usuário autenticado com permissão faz GET `/patients`
- **THEN** o backend MUST retornar lista paginada de pacientes
- **AND** MUST suportar parâmetros `skip` e `limit`

#### Scenario: Criar paciente
- **WHEN** usuário autenticado faz POST `/patients` com dados válidos
- **THEN** o backend MUST criar novo registro de paciente
- **AND** MUST gerar `num_prontuario` único automaticamente
- **AND** MUST retornar o paciente criado com status 201

#### Scenario: Buscar paciente por ID
- **WHEN** usuário faz GET `/patients/{id}`
- **THEN** o backend MUST retornar dados do paciente
- **AND** SE paciente não existe, MUST retornar status 404

#### Scenario: Atualizar paciente
- **WHEN** usuário faz PUT `/patients/{id}` com dados válidos
- **THEN** o backend MUST atualizar registro do paciente
- **AND** MUST retornar paciente atualizado

### Requirement: User Management API
O backend MUST fornecer endpoints para gerenciamento de usuários.

#### Scenario: Listar usuários (admin only)
- **WHEN** admin faz GET `/admin/users`
- **THEN** o backend MUST retornar lista de todos os usuários
- **AND** MUST incluir: id, email, nome, role, ativo

#### Scenario: Obter usuário atual
- **WHEN** usuário autenticado faz GET `/users/me`
- **THEN** o backend MUST retornar dados do usuário logado

#### Scenario: Atualizar perfil
- **WHEN** usuário faz PUT `/users/me` com dados válidos
- **THEN** o backend MUST atualizar dados do próprio perfil
- **AND** MUST NOT permitir alteração de role

### Requirement: Consultation API
O backend MUST fornecer endpoints para gerenciamento de consultas.

#### Scenario: Criar consulta
- **WHEN** enfermeira faz POST `/consultas/` com dados do paciente
- **THEN** o backend MUST criar nova consulta com status "aguardando_triagem"
- **AND** MUST retornar a consulta criada

#### Scenario: Listar consultas por role
- **WHEN** enfermeira faz GET `/consultas/`
- **THEN** o backend MUST retornar apenas consultas aguardando triagem ou em andamento
- **WHEN** médico faz GET `/consultas/`
- **THEN** o backend MUST retornar apenas consultas transferidas para o médico

#### Scenario: Iniciar atendimento
- **WHEN** enfermeira faz POST `/consultas/{id}/iniciar-atendimento`
- **THEN** o backend MUST atualizar status para "em_triagem"
- **AND** MUST registrar horário de início

#### Scenario: Transferir para médico
- **WHEN** enfermeira faz POST `/consultas/{id}/transferir-medico/{medico_id}`
- **THEN** o backend MUST atualizar status para "aguardando_medico"
- **AND** MUST associar consulta ao médico especificado

#### Scenario: Finalizar consulta
- **WHEN** médico faz POST `/consultas/{id}/finalizar`
- **THEN** o backend MUST atualizar status para "finalizada"
- **AND** MUST registrar horário de término

### Requirement: Service Layer
O frontend MUST utilizar camada de serviços para comunicação com backend.

#### Scenario: AuthService
- **WHEN** componente precisa fazer login
- **THEN** MUST utilizar `authService.login(email, password)`
- **AND** MUST armazenar tokens retornados

#### Scenario: PatientService
- **WHEN** componente precisa listar pacientes
- **THEN** MUST utilizar `patientService.getPatients()`
- **AND** MUST NOT fazer chamadas HTTP diretamente

#### Scenario: ConsultationService
- **WHEN** componente precisa gerenciar consultas
- **THEN** MUST utilizar métodos de `consultationService`
- **AND** serviço MUST encapsular lógica de API

### Requirement: API Route Deprecation
As API Routes do Next.js MUST ser gradualmente removidas.

#### Scenario: Migração de endpoint
- **WHEN** endpoint é migrado para backend FastAPI
- **THEN** API Route correspondente MUST ser marcada como deprecated
- **AND** MUST redirecionar para novo serviço

#### Scenario: Remoção final
- **WHEN** todos os consumidores usam serviços
- **THEN** API Routes deprecadas MUST ser removidas
