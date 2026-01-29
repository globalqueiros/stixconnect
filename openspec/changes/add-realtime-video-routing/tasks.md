## 1. Backend - Modelos e Banco de Dados

- [ ] 1.1 Adicionar campo `disponibilidade` ao modelo User (online, busy, offline)
- [ ] 1.2 Adicionar campo `pacientes_atuais` ao modelo User (contador de pacientes em atendimento)
- [ ] 1.3 Adicionar campo `limite_pacientes` ao modelo User (default: 3 para enfermeiros)
- [ ] 1.4 Criar migração Alembic para adicionar novos campos
- [ ] 1.5 Atualizar schema Pydantic UserResponse para incluir disponibilidade

## 2. Backend - Serviço de Roteamento

- [ ] 2.1 Criar `app/services/routing_service.py` com lógica de roteamento
- [ ] 2.2 Implementar função `get_available_nurse()` com algoritmo round-robin
- [ ] 2.3 Implementar função `get_available_professionals(role)` para listar profissionais por especialidade
- [ ] 2.4 Implementar função `assign_patient_to_nurse(consulta_id, nurse_id)`
- [ ] 2.5 Implementar função `transfer_to_professional(consulta_id, professional_id, role)`
- [ ] 2.6 Adicionar validação de limite de pacientes por enfermeiro

## 3. Backend - Endpoints de Roteamento

- [ ] 3.1 Adicionar `GET /consultas/queue` para listar pacientes aguardando triagem
- [ ] 3.2 Adicionar `GET /users/available-nurses` para listar enfermeiros disponíveis
- [ ] 3.3 Adicionar `GET /users/available-professionals?role={role}` para listar profissionais por especialidade
- [ ] 3.4 Modificar `POST /consultas/` para automaticamente atribuir ao enfermeiro disponível
- [ ] 3.5 Adicionar `POST /consultas/{id}/assign-nurse/{nurse_id}` para atribuição manual (admin)
- [ ] 3.6 Adicionar `POST /consultas/{id}/transfer-professional` para transferir para profissional escolhido
- [ ] 3.7 Adicionar `PUT /users/me/availability` para usuário atualizar seu status (online/busy/offline)

## 4. Backend - WebSocket Events

- [ ] 4.1 Adicionar evento `new_patient_request` para notificar enfermeiros sobre nova solicitação
- [ ] 4.2 Adicionar evento `nurse_assigned` para notificar paciente sobre enfermeiro atribuído
- [ ] 4.3 Adicionar evento `professional_selected` para notificar paciente sobre profissional escolhido
- [ ] 4.4 Adicionar evento `queue_update` para atualizar fila de pacientes em tempo real
- [ ] 4.5 Adicionar evento `availability_changed` para notificar mudanças de disponibilidade
- [ ] 4.6 Atualizar `consultation_ws.py` para suportar novos eventos

## 5. Frontend - Serviço de Roteamento

- [ ] 5.1 Adicionar métodos em `consultation.service.ts`:
  - `getQueue()` - obter fila de pacientes
  - `getAvailableNurses()` - listar enfermeiros disponíveis
  - `getAvailableProfessionals(role)` - listar profissionais por role
  - `transferToProfessional(consultaId, professionalId, role)` - transferir consulta
- [ ] 5.2 Adicionar método `updateAvailability(status)` em `user.service.ts`
- [ ] 5.3 Atualizar `websocket-client.ts` para suportar novos eventos de roteamento

## 6. Frontend - Interface de Fila para Enfermeiros

- [ ] 6.1 Criar componente `QueueList.tsx` para exibir pacientes aguardando triagem
- [ ] 6.2 Adicionar página `/enfermagem/fila` ou integrar na dashboard existente
- [ ] 6.3 Implementar notificação visual/sonora quando novo paciente entra na fila
- [ ] 6.4 Adicionar indicador de pacientes aguardando no menu/navbar
- [ ] 6.5 Implementar atualização em tempo real da fila via WebSocket

## 7. Frontend - Seleção de Profissional

- [ ] 7.1 Criar componente `ProfessionalSelector.tsx` com lista de profissionais disponíveis
- [ ] 7.2 Agrupar profissionais por especialidade (médico, fisioterapeuta, etc.)
- [ ] 7.3 Mostrar status de disponibilidade (online/busy) de cada profissional
- [ ] 7.4 Adicionar botão "Transferir para Profissional" na interface de triagem
- [ ] 7.5 Implementar modal/dropdown para seleção de profissional
- [ ] 7.6 Adicionar feedback visual após transferência bem-sucedida

## 8. Frontend - Status de Conexão para Pacientes

- [ ] 8.1 Criar componente `ConnectionStatus.tsx` para mostrar status atual
- [ ] 8.2 Adicionar estados: "Conectando ao enfermeiro", "Em triagem", "Aguardando profissional", "Conectado"
- [ ] 8.3 Integrar componente na página de consulta do paciente
- [ ] 8.4 Atualizar status em tempo real via WebSocket
- [ ] 8.5 Adicionar indicadores visuais (spinner, ícones, cores)

## 9. Frontend - Controle de Disponibilidade

- [ ] 9.1 Adicionar toggle/switch para enfermeiros mudarem status (online/busy)
- [ ] 9.2 Adicionar indicador visual de status atual no dashboard
- [ ] 9.3 Implementar atualização automática de status quando inicia/finaliza atendimento
- [ ] 9.4 Adicionar aviso quando tentar marcar como disponível mas já está no limite

## 10. Testes e Validação

- [ ] 10.1 Testar fluxo completo: paciente solicita → enfermeiro recebe → triagem → transferência
- [ ] 10.2 Testar algoritmo round-robin com múltiplos enfermeiros
- [ ] 10.3 Testar limite de pacientes por enfermeiro
- [ ] 10.4 Testar WebSocket events em diferentes cenários
- [ ] 10.5 Testar quando não há profissionais disponíveis
- [ ] 10.6 Validar que fluxo antigo ainda funciona (compatibilidade)

## 11. Documentação

- [ ] 11.1 Atualizar documentação da API com novos endpoints
- [ ] 11.2 Documentar eventos WebSocket novos
- [ ] 11.3 Criar guia de uso para enfermeiros
- [ ] 11.4 Atualizar README com informações sobre roteamento
