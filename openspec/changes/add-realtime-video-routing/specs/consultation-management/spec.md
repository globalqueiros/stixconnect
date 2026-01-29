## MODIFIED Requirements

### Requirement: Criação de Consulta
O sistema SHALL permitir que pacientes criem consultas, e SHALL automaticamente direcionar para enfermeiro disponível quando for consulta urgente.

#### Scenario: Paciente cria consulta urgente
- **WHEN** paciente cria consulta com tipo "urgente"
- **THEN** o sistema MUST criar consulta no banco de dados
- **AND** MUST automaticamente atribuir ao enfermeiro disponível (usando algoritmo round-robin)
- **AND** MUST criar reunião Zoom para triagem
- **AND** MUST atualizar status para "em_triagem"
- **AND** MUST notificar enfermeiro sobre nova consulta
- **AND** MUST retornar zoom_join_url e zoom_password para paciente

#### Scenario: Paciente cria consulta agendada
- **WHEN** paciente cria consulta com tipo "agendada" e data futura
- **THEN** o sistema MUST criar consulta no banco de dados
- **AND** MUST manter status "aguardando"
- **AND** MUST não atribuir enfermeiro até data agendada
- **AND** MUST notificar enfermeiros na data agendada

### Requirement: Iniciar Atendimento e Triagem
Enfermeiros SHALL poder iniciar atendimento de pacientes na fila, realizar triagem, e transferir para profissional adequado.

#### Scenario: Enfermeiro inicia atendimento da fila
- **WHEN** enfermeiro seleciona paciente da fila e clica "Iniciar Atendimento"
- **THEN** o sistema MUST verificar se enfermeiro não atingiu limite de pacientes
- **AND** MUST atualizar consulta com enfermeira_id
- **AND** MUST criar reunião Zoom se ainda não existir
- **AND** MUST atualizar status para "em_triagem"
- **AND** MUST notificar paciente que enfermeiro iniciou atendimento

#### Scenario: Enfermeiro realiza triagem e escolhe profissional
- **WHEN** enfermeiro completa triagem e seleciona profissional (médico, fisioterapeuta, etc.)
- **THEN** o sistema MUST salvar dados da triagem
- **AND** MUST atualizar consulta com profissional_id e role do profissional
- **AND** MUST criar nova reunião Zoom para consulta com profissional
- **AND** MUST atualizar status para "aguardando_profissional" ou "em_atendimento"
- **AND** MUST notificar paciente sobre profissional escolhido
- **AND** MUST notificar profissional sobre nova consulta

#### Scenario: Enfermeiro finaliza triagem sem transferir
- **WHEN** enfermeiro finaliza triagem mas não seleciona profissional
- **THEN** o sistema MUST salvar dados da triagem
- **AND** MUST manter status "em_triagem" ou "aguardando_profissional"
- **AND** MUST permitir que enfermeiro selecione profissional posteriormente
- **AND** MUST mostrar alerta lembrando de selecionar profissional

## ADDED Requirements

### Requirement: Visualização de Status de Conexão para Pacientes
Pacientes SHALL visualizar status atual da conexão em tempo real.

#### Scenario: Paciente visualiza status de conexão
- **WHEN** paciente acessa página de consulta
- **THEN** o sistema MUST mostrar componente de status com estados:
  - "Conectando ao enfermeiro" (quando aguardando atribuição)
  - "Em triagem" (quando enfermeiro está atendendo)
  - "Aguardando profissional" (após triagem, antes de profissional aceitar)
  - "Conectado" (quando profissional iniciou atendimento)
- **AND** MUST atualizar status em tempo real via WebSocket
- **AND** MUST mostrar nome do profissional quando atribuído

#### Scenario: Paciente recebe atualização de status
- **WHEN** status da consulta muda (enfermeiro atribuído, profissional selecionado, etc.)
- **THEN** o sistema MUST enviar evento WebSocket para paciente
- **AND** componente de status MUST atualizar automaticamente
- **AND** MUST mostrar notificação visual da mudança

### Requirement: Interface de Fila para Enfermeiros
Enfermeiros SHALL visualizar fila de pacientes aguardando triagem em tempo real.

#### Scenario: Enfermeiro acessa interface de fila
- **WHEN** enfermeiro acessa dashboard ou página de fila
- **THEN** o sistema MUST mostrar lista de pacientes aguardando triagem
- **AND** MUST ordenar por: tipo (urgente primeiro), tempo de espera
- **AND** MUST mostrar para cada paciente: nome, tipo de consulta, tempo aguardando, observações
- **AND** MUST atualizar lista em tempo real via WebSocket

#### Scenario: Notificação de novo paciente na fila
- **WHEN** novo paciente entra na fila
- **THEN** o sistema MUST mostrar notificação visual/sonora para enfermeiros online
- **AND** MUST atualizar contador de pacientes aguardando
- **AND** MUST destacar novo paciente na lista

### Requirement: Seleção de Profissional por Enfermeiro
Enfermeiros SHALL poder selecionar profissional adequado após triagem através de interface clara.

#### Scenario: Enfermeiro abre seletor de profissional
- **WHEN** enfermeiro clica "Transferir para Profissional" após triagem
- **THEN** o sistema MUST mostrar modal/dropdown com profissionais disponíveis
- **AND** MUST agrupar por especialidade (médico, fisioterapeuta, nutricionista, etc.)
- **AND** MUST mostrar status de cada profissional (online/busy/offline)
- **AND** MUST destacar profissionais online e disponíveis

#### Scenario: Enfermeiro seleciona profissional
- **WHEN** enfermeiro seleciona profissional e confirma
- **THEN** o sistema MUST validar que profissional está disponível
- **AND** MUST transferir consulta para profissional escolhido
- **AND** MUST criar reunião Zoom para consulta
- **AND** MUST mostrar confirmação de transferência bem-sucedida
- **AND** MUST atualizar interface para mostrar profissional selecionado
