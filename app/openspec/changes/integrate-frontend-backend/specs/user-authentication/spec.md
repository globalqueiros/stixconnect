## ADDED Requirements

### Requirement: JWT Authentication
O sistema MUST utilizar tokens JWT para autenticação, gerenciados pelo backend FastAPI.

#### Scenario: Login bem-sucedido
- **WHEN** usuário fornece credenciais válidas (email + senha)
- **THEN** o backend MUST retornar `access_token` e `refresh_token`
- **AND** `access_token` MUST expirar em 30 minutos
- **AND** `refresh_token` MUST expirar em 7 dias

#### Scenario: Login com credenciais inválidas
- **WHEN** usuário fornece credenciais inválidas
- **THEN** o backend MUST retornar status 401
- **AND** MUST retornar mensagem de erro genérica (não revelar se email existe)

#### Scenario: Usuário inativo
- **WHEN** usuário inativo tenta fazer login
- **THEN** o backend MUST retornar status 403
- **AND** MUST retornar mensagem "Usuário inativo"

### Requirement: Role-Based Access Control
O sistema MUST suportar 14 roles de usuário com permissões específicas.

#### Scenario: Roles disponíveis
- **WHEN** um usuário é criado
- **THEN** ele MUST ter uma das seguintes roles: admin, doctor, nurse, receptionist, physiotherapist, nutritionist, hairdresser, psychologist, speech_therapist, acupuncturist, clinical_psypedagogist, caregiver, patient, supervisor

#### Scenario: Admin acessa área administrativa
- **WHEN** usuário com role `admin` acessa endpoints `/admin/*`
- **THEN** o backend MUST permitir acesso

#### Scenario: Paciente tenta acessar área administrativa
- **WHEN** usuário com role `patient` acessa endpoints `/admin/*`
- **THEN** o backend MUST retornar status 403 (Forbidden)

#### Scenario: Médico acessa consultas
- **WHEN** usuário com role `doctor` acessa endpoints `/consultas/*`
- **THEN** o backend MUST permitir acesso às consultas atribuídas ao médico

### Requirement: Token Refresh
O sistema MUST permitir renovação de tokens sem re-autenticação.

#### Scenario: Refresh token válido
- **WHEN** cliente envia `refresh_token` válido para `/auth/refresh`
- **THEN** o backend MUST retornar novo `access_token`
- **AND** MUST manter o mesmo `refresh_token` ou gerar novo

#### Scenario: Refresh token expirado
- **WHEN** cliente envia `refresh_token` expirado
- **THEN** o backend MUST retornar status 401
- **AND** cliente MUST redirecionar para login

### Requirement: Password Security
Senhas MUST ser armazenadas de forma segura.

#### Scenario: Criação de usuário
- **WHEN** novo usuário é criado
- **THEN** a senha MUST ser hasheada com bcrypt antes de armazenar

#### Scenario: Validação de senha
- **WHEN** usuário faz login
- **THEN** o backend MUST verificar a senha usando bcrypt.verify()
- **AND** MUST nunca comparar senhas em texto plano

### Requirement: Role Mapping
O frontend MUST mapear roles legadas para o novo sistema.

#### Scenario: Mapeamento de roles
- **WHEN** frontend recebe role do backend
- **THEN** MUST mapear para nome de exibição em português
- **AND** admin → "Administrador"
- **AND** doctor → "Médico"
- **AND** nurse → "Enfermeiro"
- **AND** patient → "Paciente"
