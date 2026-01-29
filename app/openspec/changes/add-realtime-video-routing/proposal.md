# Change: Adicionar Roteamento Inteligente de Videochamadas em Tempo Real

## Why
Atualmente, quando um paciente solicita uma videochamada, o sistema não direciona automaticamente para um enfermeiro(a) disponível para realizar a triagem. Além disso, após a triagem, o enfermeiro não possui uma interface clara para escolher e transferir o paciente para o profissional de saúde adequado (médico, fisioterapeuta, nutricionista, etc.). Esta mudança implementa um sistema de roteamento inteligente que conecta automaticamente o paciente ao enfermeiro disponível e permite que o enfermeiro selecione o profissional mais adequado para o atendimento.

## What Changes

### Backend
- **ADDED**: Sistema de fila de atendimento para pacientes aguardando triagem
- **ADDED**: Endpoint para listar enfermeiros disponíveis em tempo real
- **ADDED**: Endpoint para listar profissionais disponíveis por especialidade (médico, fisioterapeuta, cuidador, nutricionista, cabeleireiro, psicólogo, fonoaudiólogo, acupuntura, psicopedagogia clínica)
- **ADDED**: Endpoint para transferir consulta de enfermeiro para profissional escolhido
- **ADDED**: WebSocket events para notificar enfermeiros sobre novas solicitações de videochamada
- **ADDED**: WebSocket events para notificar pacientes sobre status de conexão (conectado ao enfermeiro, aguardando profissional, etc.)
- **MODIFIED**: Endpoint de criação de consulta para automaticamente atribuir ao enfermeiro disponível mais próximo
- **MODIFIED**: Endpoint de iniciar atendimento para suportar seleção de profissional antes de criar reunião Zoom

### Frontend - StixConnect
- **ADDED**: Interface de fila de pacientes aguardando triagem para enfermeiros
- **ADDED**: Notificação em tempo real quando novo paciente solicita videochamada
- **ADDED**: Componente de seleção de profissional com lista de profissionais disponíveis por especialidade
- **ADDED**: Interface para enfermeiro visualizar profissionais online/disponíveis
- **ADDED**: Botão "Transferir para Profissional" na interface de triagem
- **ADDED**: Feedback visual para paciente sobre status da conexão (conectando ao enfermeiro, em triagem, aguardando profissional, etc.)
- **ADDED**: WebSocket client para receber atualizações de status em tempo real
- **MODIFIED**: Fluxo de solicitação de consulta para mostrar status de conexão em tempo real

### Integração
- **ADDED**: Sistema de disponibilidade de profissionais (online/offline, ocupado/disponível)
- **ADDED**: Algoritmo de distribuição de pacientes para enfermeiros (round-robin ou baseado em carga)
- **ADDED**: Notificações push para enfermeiros quando há pacientes na fila

## Impact

### Affected Specs
- `video-routing` - Nova capacidade de roteamento inteligente de videochamadas
- `consultation-management` - Modificação no fluxo de gerenciamento de consultas

### Affected Code
- `stixconnect-backend/app/routers/consultas.py` - Adicionar endpoints de roteamento e transferência
- `stixconnect-backend/app/routers/users.py` - Adicionar endpoint para listar profissionais disponíveis
- `stixconnect-backend/app/models/models.py` - Adicionar campos de disponibilidade e status online
- `stixconnect-backend/app/websockets/consultation_ws.py` - Adicionar eventos de roteamento
- `stixconnect-backend/app/services/` - Novo serviço de roteamento de consultas
- `stixconnect/stixconnect/src/app/(main)/enfermagem/` - Nova interface de fila e seleção de profissionais
- `stixconnect/stixconnect/src/services/consultation.service.ts` - Adicionar métodos de roteamento
- `stixconnect/stixconnect/src/lib/websocket-client.ts` - Adicionar handlers para eventos de roteamento

### Breaking Changes
Nenhuma. Esta é uma adição de funcionalidade que melhora o fluxo existente sem quebrar comportamentos atuais.

### Dependencies
- Backend FastAPI já possui sistema de WebSockets
- Backend já possui integração com Zoom
- Sistema de roles já está implementado com todos os 14 perfis
- Frontend já possui estrutura de serviços e WebSocket client
