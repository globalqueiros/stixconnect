## ADDED Requirements

### Requirement: WebSocket Connection
O backend MUST suportar conexões WebSocket para comunicação em tempo real durante consultas.

#### Scenario: Conexão estabelecida
- **WHEN** usuário autenticado conecta ao WebSocket `/ws/consultations/{id}`
- **THEN** o backend MUST aceitar a conexão
- **AND** MUST adicionar à sala da consulta

#### Scenario: Autenticação WebSocket
- **WHEN** cliente tenta conectar sem token válido
- **THEN** o backend MUST rejeitar a conexão
- **AND** MUST retornar código de fechamento 4001

#### Scenario: Desconexão
- **WHEN** cliente desconecta (intencional ou por erro)
- **THEN** o backend MUST remover da sala
- **AND** MUST notificar outros participantes

### Requirement: Real-time Updates
Atualizações de consulta MUST ser transmitidas em tempo real.

#### Scenario: Status atualizado
- **WHEN** status da consulta muda
- **THEN** o backend MUST broadcast para todos na sala
- **AND** mensagem MUST incluir: consultation_id, new_status, timestamp

#### Scenario: Nova mensagem
- **WHEN** participante envia mensagem
- **THEN** o backend MUST broadcast para todos na sala
- **AND** mensagem MUST incluir: sender_id, sender_name, content, timestamp

#### Scenario: Participante entra
- **WHEN** novo participante entra na consulta
- **THEN** o backend MUST notificar outros participantes
- **AND** MUST enviar lista atualizada de participantes

### Requirement: Connection Manager
O sistema MUST gerenciar conexões WebSocket de forma eficiente.

#### Scenario: Múltiplas conexões por sala
- **WHEN** múltiplos usuários conectam à mesma consulta
- **THEN** o sistema MUST manter lista de conexões por sala
- **AND** MUST permitir broadcast seletivo

#### Scenario: Limpeza de conexões
- **WHEN** consulta é finalizada
- **THEN** o sistema MUST fechar todas as conexões da sala
- **AND** MUST liberar recursos associados

### Requirement: Zoom Integration
O backend MUST integrar com Zoom API para criação de reuniões.

#### Scenario: Criar reunião Zoom
- **WHEN** enfermeira faz POST `/consultas/{id}/create-zoom`
- **THEN** o backend MUST criar reunião via Zoom API
- **AND** MUST salvar meeting_id e password na consulta
- **AND** MUST retornar join_url para participantes

#### Scenario: Zoom API indisponível
- **WHEN** Zoom API retorna erro
- **THEN** o backend MUST retornar status 503
- **AND** MUST permitir retry

#### Scenario: Credenciais Zoom
- **WHEN** backend precisa autenticar com Zoom
- **THEN** MUST usar Server-to-Server OAuth
- **AND** MUST renovar token automaticamente
