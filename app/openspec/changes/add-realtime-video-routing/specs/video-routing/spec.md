## ADDED Requirements

### Requirement: Roteamento Automático de Pacientes para Enfermeiros
O sistema SHALL direcionar automaticamente pacientes que solicitam videochamada para enfermeiros disponíveis.

#### Scenario: Paciente solicita videochamada urgente
- **WHEN** paciente cria consulta com tipo "urgente"
- **THEN** o sistema MUST automaticamente atribuir ao enfermeiro disponível mais próximo (round-robin)
- **AND** MUST criar reunião Zoom para a triagem
- **AND** MUST notificar o enfermeiro via WebSocket sobre nova solicitação
- **AND** MUST atualizar status da consulta para "em_triagem"

#### Scenario: Nenhum enfermeiro disponível
- **WHEN** paciente solicita videochamada e não há enfermeiros disponíveis
- **THEN** o sistema MUST manter consulta em status "aguardando"
- **AND** MUST adicionar paciente à fila de espera
- **AND** MUST notificar enfermeiros quando ficarem disponíveis sobre pacientes na fila

#### Scenario: Enfermeiro atinge limite de pacientes
- **WHEN** enfermeiro já está atendendo número máximo de pacientes (limite configurável)
- **THEN** o sistema MUST excluir esse enfermeiro da lista de disponíveis
- **AND** MUST distribuir paciente para próximo enfermeiro disponível

### Requirement: Listagem de Profissionais Disponíveis
O sistema SHALL permitir que enfermeiros visualizem profissionais disponíveis por especialidade.

#### Scenario: Enfermeiro visualiza profissionais disponíveis
- **WHEN** enfermeiro acessa interface de seleção de profissional
- **THEN** o sistema MUST listar profissionais agrupados por especialidade:
  - Médico(a)
  - Fisioterapeuta
  - Cuidador(a)
  - Nutricionista
  - Cabeleireiro(a)
  - Psicóloga(o)
  - Fonoaudióloga(o)
  - Acupuntura
  - Psicopedagogia Clínica
- **AND** MUST mostrar status de disponibilidade de cada profissional (online/busy/offline)
- **AND** MUST mostrar apenas profissionais com role correspondente

#### Scenario: Nenhum profissional disponível na especialidade
- **WHEN** enfermeiro tenta selecionar profissional de uma especialidade
- **THEN** o sistema MUST mostrar mensagem "Nenhum profissional disponível no momento"
- **AND** MUST permitir que enfermeiro aguarde ou escolha outra especialidade

### Requirement: Transferência de Paciente para Profissional
O sistema SHALL permitir que enfermeiros transfiram pacientes para profissionais escolhidos após triagem.

#### Scenario: Enfermeiro transfere para profissional
- **WHEN** enfermeiro seleciona profissional e confirma transferência
- **THEN** o sistema MUST atualizar consulta com profissional_id e role
- **AND** MUST criar nova reunião Zoom para consulta com profissional
- **AND** MUST notificar paciente sobre profissional escolhido
- **AND** MUST notificar profissional sobre nova consulta
- **AND** MUST atualizar status da consulta para "aguardando_profissional" ou "em_atendimento"

#### Scenario: Profissional não está mais disponível
- **WHEN** enfermeiro tenta transferir para profissional que ficou indisponível
- **THEN** o sistema MUST retornar erro informando que profissional não está disponível
- **AND** MUST sugerir outros profissionais disponíveis da mesma especialidade

### Requirement: Sistema de Fila de Atendimento
O sistema SHALL manter fila de pacientes aguardando triagem e permitir visualização em tempo real.

#### Scenario: Enfermeiro visualiza fila de pacientes
- **WHEN** enfermeiro acessa interface de fila
- **THEN** o sistema MUST mostrar lista de pacientes aguardando triagem
- **AND** MUST ordenar por prioridade (urgente primeiro) e tempo de espera
- **AND** MUST atualizar em tempo real via WebSocket
- **AND** MUST mostrar informações básicas: nome, tipo de consulta, tempo de espera

#### Scenario: Novo paciente entra na fila
- **WHEN** novo paciente solicita videochamada
- **THEN** o sistema MUST adicionar à fila
- **AND** MUST notificar todos os enfermeiros online via WebSocket
- **AND** MUST atualizar contador de pacientes aguardando

### Requirement: Notificações em Tempo Real
O sistema SHALL notificar participantes sobre mudanças de status e eventos de roteamento.

#### Scenario: Notificação para enfermeiro sobre nova solicitação
- **WHEN** paciente solicita videochamada
- **THEN** o sistema MUST enviar evento WebSocket `new_patient_request` para enfermeiros online
- **AND** evento MUST incluir: consulta_id, paciente_nome, tipo_consulta, timestamp

#### Scenario: Notificação para paciente sobre enfermeiro atribuído
- **WHEN** sistema atribui enfermeiro à consulta
- **THEN** o sistema MUST enviar evento WebSocket `nurse_assigned` para paciente
- **AND** evento MUST incluir: enfermeiro_nome, zoom_join_url, zoom_password

#### Scenario: Notificação para paciente sobre profissional escolhido
- **WHEN** enfermeiro transfere para profissional
- **THEN** o sistema MUST enviar evento WebSocket `professional_selected` para paciente
- **AND** evento MUST incluir: profissional_nome, especialidade, zoom_join_url

### Requirement: Controle de Disponibilidade de Profissionais
O sistema SHALL permitir que profissionais controlem seu status de disponibilidade.

#### Scenario: Profissional marca como disponível
- **WHEN** profissional atualiza status para "online"
- **THEN** o sistema MUST atualizar disponibilidade no banco de dados
- **AND** MUST notificar via WebSocket que profissional está disponível
- **AND** MUST incluir profissional na lista de disponíveis para seleção

#### Scenario: Profissional marca como ocupado
- **WHEN** profissional atualiza status para "busy"
- **THEN** o sistema MUST remover da lista de disponíveis
- **AND** MUST impedir novas atribuições até que fique disponível novamente

#### Scenario: Atualização automática de status
- **WHEN** profissional inicia atendimento
- **THEN** o sistema MUST automaticamente marcar como "busy"
- **WHEN** profissional finaliza atendimento
- **THEN** o sistema MUST automaticamente marcar como "online" (se não atingiu limite)
